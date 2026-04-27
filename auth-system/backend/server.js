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
