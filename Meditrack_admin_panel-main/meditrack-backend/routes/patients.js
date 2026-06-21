const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/patients
router.get('/', authMiddleware, (req, res) => {
  const { status, search } = req.query;
  let patients = db.get('patients').value();

  if (status && status !== 'All') {
    patients = patients.filter(p => p.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    patients = patients.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.mobile.includes(s) ||
      (p.condition || '').toLowerCase().includes(s)
    );
  }

  // Enrich with medicine count
  const medicines = db.get('medicines').value();
  patients = patients.map(p => ({
    ...p,
    medicineCount: medicines.filter(m => m.patientId === p.id).length,
  }));

  res.json(patients);
});

// GET /api/patients/:id
router.get('/:id', authMiddleware, (req, res) => {
  const patient = db.get('patients').find({ id: req.params.id }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// POST /api/patients
router.post('/', authMiddleware, (req, res) => {
  const { name, mobile, age, gender, bloodGroup, condition, doctor, notes } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required' });
  }

  // Generate next ID
  const patients = db.get('patients').value();
  const nextNum = patients.length + 1;
  const id = `P${String(nextNum).padStart(3, '0')}`;

  const newPatient = {
    id,
    name: name.trim(),
    mobile: mobile.trim(),
    age: age ? Number(age) : '',
    gender: gender || 'Male',
    bloodGroup: bloodGroup || 'B+',
    condition: condition || '',
    doctor: doctor || '',
    notes: notes || '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    fcmToken: '',
    createdAt: new Date().toISOString(),
  };

  db.get('patients').push(newPatient).write();

  // Add notification
  db.get('notifications').push({
    id: uuidv4(),
    type: 'info',
    message: `New patient registered: ${name}`,
    time: new Date().toISOString(),
    unread: true,
    patientId: id,
  }).write();

  res.status(201).json(newPatient);
});

// PUT /api/patients/:id
router.put('/:id', authMiddleware, (req, res) => {
  const patient = db.get('patients').find({ id: req.params.id }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { name, mobile, age, gender, bloodGroup, condition, doctor, notes, status, fcmToken } = req.body;

  db.get('patients')
    .find({ id: req.params.id })
    .assign({
      ...(name !== undefined && { name: name.trim() }),
      ...(mobile !== undefined && { mobile: mobile.trim() }),
      ...(age !== undefined && { age: Number(age) }),
      ...(gender !== undefined && { gender }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(condition !== undefined && { condition }),
      ...(doctor !== undefined && { doctor }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      ...(fcmToken !== undefined && { fcmToken }),
      updatedAt: new Date().toISOString(),
    })
    .write();

  // If condition changed, update patientName in medicines
  if (name) {
    db.get('medicines')
      .filter({ patientId: req.params.id })
      .each(m => { m.patientName = name.trim(); })
      .write();
  }

  const updated = db.get('patients').find({ id: req.params.id }).value();
  res.json(updated);
});

// DELETE /api/patients/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const patient = db.get('patients').find({ id: req.params.id }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Delete patient medicines
  db.get('medicines').remove({ patientId: req.params.id }).write();
  // Delete patient compliance records
  db.get('compliance').remove({ patientId: req.params.id }).write();
  // Delete patient
  db.get('patients').remove({ id: req.params.id }).write();

  res.json({ message: `Patient ${patient.name} deleted successfully` });
});

// POST /api/patients/:id/fcm-token  (called by Flutter app to register device)
router.post('/:id/fcm-token', (req, res) => {
  const { fcmToken } = req.body;
  const patient = db.get('patients').find({ id: req.params.id }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  db.get('patients').find({ id: req.params.id }).assign({ fcmToken }).write();
  res.json({ message: 'FCM token registered' });
});

module.exports = router;
