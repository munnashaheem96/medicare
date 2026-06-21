const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/notifications
router.get('/', authMiddleware, (req, res) => {
  const notifications = db.get('notifications').value()
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 50); // Last 50
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, (req, res) => {
  const count = db.get('notifications').filter({ unread: true }).value().length;
  res.json({ count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, (req, res) => {
  db.get('notifications').find({ id: req.params.id }).assign({ unread: false }).write();
  res.json({ message: 'Notification marked as read' });
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, (req, res) => {
  db.get('notifications').each(n => { n.unread = false; }).write();
  res.json({ message: 'All notifications marked as read' });
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, (req, res) => {
  db.get('notifications').remove({ id: req.params.id }).write();
  res.json({ message: 'Notification deleted' });
});

module.exports = router;
