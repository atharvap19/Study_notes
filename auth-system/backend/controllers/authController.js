const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const SALT_ROUNDS = 12;

// ── POST /api/auth/register ────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, subjects } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or teacher' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashed, role]
    );

    // Insert subject enrollments if provided
    if (Array.isArray(subjects) && subjects.length > 0) {
      const values = subjects.map(sid => [result.insertId, Number(sid)]);
      await db.query(
        'INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES ?',
        [values]
      );
    }

    return res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/profile ───────────────────────��───────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    await db.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
    return res.json({ message: 'Profile updated', name: name.trim() });
  } catch (err) { next(err); }
};

// ── PATCH /api/auth/change-password ───────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ──────────────────────────────────────────────���────────
exports.getMe = async (req, res, next) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ user });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    // Same message for wrong email AND wrong password to prevent user enumeration.
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      token,
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    next(err);
  }
};
