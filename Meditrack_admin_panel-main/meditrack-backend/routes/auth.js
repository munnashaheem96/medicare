const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admin = db.get('admins').find({ email: email.toLowerCase() }).value();
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = bcrypt.compareSync(password, admin.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    process.env.JWT_SECRET || 'meditrack_secret',
    { expiresIn: '7d' }
  );

  const { passwordHash, ...adminData } = admin;

  res.json({
    token,
    admin: adminData,
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const admin = db.get('admins').find({ id: req.admin.id }).value();
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  const { passwordHash, ...adminData } = admin;
  res.json(adminData);
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  const { name, hospital, phone, specialization } = req.body;

  db.get('admins')
    .find({ id: req.admin.id })
    .assign({ name, hospital, phone, specialization, updatedAt: new Date().toISOString() })
    .write();

  const updated = db.get('admins').find({ id: req.admin.id }).value();
  const { passwordHash, ...adminData } = updated;
  res.json(adminData);
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = db.get('admins').find({ id: req.admin.id }).value();

  const isValid = bcrypt.compareSync(currentPassword, admin.passwordHash);
  if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.get('admins').find({ id: req.admin.id }).assign({ passwordHash: newHash }).write();

  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
