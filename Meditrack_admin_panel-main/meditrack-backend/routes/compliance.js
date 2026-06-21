const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/compliance  (admin - requires auth)
router.get('/', authMiddleware, (req, res) => {
  const { patientId, status, date, startDate, endDate, medicineId } = req.query;
  let records = db.get('compliance').value();

  if (patientId && patientId !== 'All') {
    records = records.filter(r => r.patientId === patientId);
  }
  if (status && status !== 'All') {
    records = records.filter(r => r.status === status);
  }
  if (date) {
    records = records.filter(r => r.date === date);
  }
  if (startDate) {
    records = records.filter(r => r.date >= startDate);
  }
  if (endDate) {
    records = records.filter(r => r.date <= endDate);
  }
  if (medicineId) {
    records = records.filter(r => r.medicineId === medicineId);
  }

  // Sort by date desc
  records.sort((a, b) => b.date.localeCompare(a.date));

  res.json(records);
});

// GET /api/compliance/stats  — for dashboard cards
router.get('/stats', authMiddleware, (req, res) => {
  const { range = 'weekly', patientId } = req.query;

  const today = new Date();
  let days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  let records = db.get('compliance').value().filter(r => r.date >= cutoffStr);
  if (patientId) records = records.filter(r => r.patientId === patientId);

  const total = records.length;
  const taken = records.filter(r => r.status === 'taken').length;
  const skipped = records.filter(r => r.status === 'skipped').length;
  const missed = records.filter(r => r.status === 'missed').length;

  res.json({
    total,
    taken,
    skipped,
    missed,
    rate: total ? Math.round((taken / total) * 100) : 0,
  });
});

// GET /api/compliance/trend  — 7-day daily trend
router.get('/trend', authMiddleware, (req, res) => {
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = db.get('compliance').filter({ date: dateStr }).value();
    const total = dayRecords.length;
    const taken = dayRecords.filter(r => r.status === 'taken').length;

    result.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: dateStr,
      taken,
      skipped: dayRecords.filter(r => r.status === 'skipped').length,
      missed: dayRecords.filter(r => r.status === 'missed').length,
      rate: total ? Math.round((taken / total) * 100) : 0,
    });
  }

  res.json(result);
});

// GET /api/compliance/patient-stats  — per-patient compliance rates
router.get('/patient-stats', authMiddleware, (req, res) => {
  const patients = db.get('patients').value();
  const allCompliance = db.get('compliance').value();

  const statsPerPatient = patients.map(p => {
    const records = allCompliance.filter(r => r.patientId === p.id);
    const taken = records.filter(r => r.status === 'taken').length;
    const total = records.length;
    return {
      id: p.id,
      name: p.name,
      condition: p.condition,
      rate: total ? Math.round((taken / total) * 100) : 0,
      taken,
      total,
      missed: records.filter(r => r.status === 'missed').length,
      skipped: records.filter(r => r.status === 'skipped').length,
      status: p.status,
    };
  });

  res.json(statsPerPatient);
});

// POST /api/compliance  (called by Flutter app to log a dose)
// This is an OPEN endpoint — no auth needed (Flutter app calls it)
router.post('/', (req, res) => {
  const { patientId, medicineId, date, timing, status } = req.body;

  if (!patientId || !medicineId || !date || !timing || !status) {
    return res.status(400).json({ error: 'patientId, medicineId, date, timing, and status are required' });
  }
  if (!['taken', 'skipped', 'missed'].includes(status)) {
    return res.status(400).json({ error: 'status must be taken, skipped, or missed' });
  }

  // Check if record already exists for this slot
  const existing = db.get('compliance').find({ patientId, medicineId, date, timing }).value();

  if (existing) {
    // Update existing record
    db.get('compliance')
      .find({ patientId, medicineId, date, timing })
      .assign({ status, loggedAt: new Date().toISOString() })
      .write();
    
    const updated = db.get('compliance').find({ patientId, medicineId, date, timing }).value();
    return res.json(updated);
  }

  const newRecord = {
    id: uuidv4(),
    patientId,
    medicineId,
    date,
    timing,
    status,
    loggedAt: new Date().toISOString(),
  };

  db.get('compliance').push(newRecord).write();

  // Add missed dose notification for admin
  if (status === 'missed' || status === 'skipped') {
    const patient = db.get('patients').find({ id: patientId }).value();
    const medicine = db.get('medicines').find({ id: medicineId }).value();
    if (patient && medicine) {
      db.get('notifications').push({
        id: uuidv4(),
        type: status === 'missed' ? 'alert' : 'warning',
        message: `Patient ${patient.name} ${status} "${medicine.medicineName}" (${timing})`,
        time: new Date().toISOString(),
        unread: true,
        patientId,
      }).write();
    }
  }

  res.status(201).json(newRecord);
});

// GET /api/compliance/flutter/:patientId  (Flutter app fetches its own schedule)
router.get('/flutter/:patientId', (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  const patient = db.get('patients').find({ id: patientId }).value();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Get medicines for this patient
  const medicines = db.get('medicines').filter({ patientId, status: 'Active' }).value();

  // Get today's compliance (or specific date)
  const targetDate = date || new Date().toISOString().split('T')[0];
  const todayCompliance = db.get('compliance').filter({ patientId, date: targetDate }).value();

  // Build schedule: what should be taken today and whether it was logged
  const schedule = [];
  medicines.forEach(med => {
    // Check if medicine is still active (within date range)
    const today = targetDate;
    if (med.endDate && today > med.endDate) return;
    if (med.startDate && today < med.startDate) return;

    med.timings.forEach(timing => {
      const complianceRecord = todayCompliance.find(
        r => r.medicineId === med.id && r.timing === timing
      );
      schedule.push({
        medicineId: med.id,
        medicineName: med.medicineName,
        timing,
        mealInstruction: med.mealInstruction,
        notes: med.notes,
        status: complianceRecord?.status || 'pending',
        loggedAt: complianceRecord?.loggedAt || null,
      });
    });
  });

  res.json({
    patient: { id: patient.id, name: patient.name },
    date: targetDate,
    schedule,
  });
});

module.exports = router;
