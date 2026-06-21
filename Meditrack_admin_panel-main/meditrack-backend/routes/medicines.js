const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/medicines
router.get('/', authMiddleware, (req, res) => {
  const { patientId, status, search } = req.query;
  let medicines = db.get('medicines').value();

  if (patientId && patientId !== 'All') {
    medicines = medicines.filter(m => m.patientId === patientId);
  }
  if (status && status !== 'All') {
    medicines = medicines.filter(m => m.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    medicines = medicines.filter(m =>
      m.medicineName.toLowerCase().includes(s) ||
      m.patientName.toLowerCase().includes(s)
    );
  }

  res.json(medicines);
});

// GET /api/medicines/:id
router.get('/:id', authMiddleware, (req, res) => {
  const med = db.get('medicines').find({ id: req.params.id }).value();
  if (!med) return res.status(404).json({ error: 'Medicine not found' });
  res.json(med);
});

// POST /api/medicines
router.post('/', authMiddleware, (req, res) => {
  const { patientId, medicineName, timings, mealInstruction, startDate, endDate, notes } = req.body;

  if (!medicineName || !patientId || !timings || timings.length === 0) {
    return res.status(400).json({ error: 'patientId, medicineName, and timings are required' });
  }

  const patient = db.get('patients').find({ id: patientId }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const medicines = db.get('medicines').value();
  const nextNum = medicines.length + 1;
  const id = `M${String(nextNum).padStart(3, '0')}`;

  const newMed = {
    id,
    patientId,
    patientName: patient.name,
    medicineName: medicineName.trim(),
    timings,
    mealInstruction: mealInstruction || 'after',
    startDate: startDate || '',
    endDate: endDate || '',
    notes: notes || '',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  db.get('medicines').push(newMed).write();

  // Add notification
  db.get('notifications').push({
    id: uuidv4(),
    type: 'success',
    message: `Medicine schedule added for ${patient.name}: ${medicineName}`,
    time: new Date().toISOString(),
    unread: true,
    patientId,
  }).write();

  res.status(201).json(newMed);
});

// PUT /api/medicines/:id
router.put('/:id', authMiddleware, (req, res) => {
  const med = db.get('medicines').find({ id: req.params.id }).value();
  if (!med) return res.status(404).json({ error: 'Medicine not found' });

  const { medicineName, timings, mealInstruction, startDate, endDate, notes, status } = req.body;

  // If patientId is changing, update patientName
  let patientName = med.patientName;
  let patientId = med.patientId;
  if (req.body.patientId && req.body.patientId !== med.patientId) {
    const patient = db.get('patients').find({ id: req.body.patientId }).value();
    if (patient) {
      patientName = patient.name;
      patientId = patient.id;
    }
  }

  db.get('medicines')
    .find({ id: req.params.id })
    .assign({
      patientId,
      patientName,
      ...(medicineName !== undefined && { medicineName: medicineName.trim() }),
      ...(timings !== undefined && { timings }),
      ...(mealInstruction !== undefined && { mealInstruction }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      updatedAt: new Date().toISOString(),
    })
    .write();

  const updated = db.get('medicines').find({ id: req.params.id }).value();
  res.json(updated);
});

// DELETE /api/medicines/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const med = db.get('medicines').find({ id: req.params.id }).value();
  if (!med) return res.status(404).json({ error: 'Medicine not found' });

  db.get('medicines').remove({ id: req.params.id }).write();
  // Also remove compliance records for this medicine
  db.get('compliance').remove({ medicineId: req.params.id }).write();

  res.json({ message: `Medicine ${med.medicineName} deleted successfully` });
});

module.exports = router;
