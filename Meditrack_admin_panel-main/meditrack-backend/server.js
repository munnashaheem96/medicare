require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDb } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const medicineRoutes = require('./routes/medicines');
const complianceRoutes = require('./routes/compliance');
const notificationRoutes = require('./routes/notifications');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    '*', // Allow Flutter app too
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Initialize Database ─────────────────────────────────────────────────────
initDb();

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MediTrack Backend API',
    version: '1.0.0',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Flutter App Info Route (no auth needed) ──────────────────────────────────
app.get('/api/flutter/info', (req, res) => {
  res.json({
    message: 'MediTrack API is running. Use /api/compliance to log doses and /api/compliance/flutter/:patientId to get schedule.',
    endpoints: {
      getSchedule: 'GET /api/compliance/flutter/:patientId?date=YYYY-MM-DD',
      logDose: 'POST /api/compliance (body: {patientId, medicineId, date, timing, status})',
      registerToken: 'POST /api/patients/:id/fcm-token (body: {fcmToken})',
    }
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     MediTrack Backend API Started! 🚀     ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}            ║`);
  console.log(`║  Health:  http://localhost:${PORT}/api/health ║`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
  console.log('📋 Admin Login: admin@meditrack.com / admin123');
  console.log('📱 Flutter API: /api/compliance/flutter/:patientId');
  console.log('');
});
