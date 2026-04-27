require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes     = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const studentRoutes  = require('./routes/student');
const teacherRoutes  = require('./routes/teacher');

const app  = express();
const PORT = process.env.PORT || 3000;
const DOCAI_FRONTEND_URL = process.env.DOCAI_FRONTEND_URL || 'http://localhost:3001';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded study materials (e.g. /uploads/file.pdf)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/student',  studentRoutes);
app.use('/api/teacher',  teacherRoutes);

// ── Page Routes ─────────────────────────────────────────────────────────────
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/login',    (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/docnotes', (req, res) => {
  try {
    const target = new URL(DOCAI_FRONTEND_URL);
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (token) target.searchParams.set('token', token);
    return res.redirect(target.toString());
  } catch (err) {
    console.error('[docnotes redirect error]', err.message);
    return res.status(500).json({ message: 'DOCAI_FRONTEND_URL is not configured correctly' });
  }
});
app.get('/student',  (req, res) => res.sendFile(path.join(__dirname, '../frontend/student-dashboard.html')));
app.get('/teacher',  (req, res) => res.sendFile(path.join(__dirname, '../frontend/teacher-dashboard.html')));

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server error]', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
