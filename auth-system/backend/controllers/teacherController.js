const path = require('path');
const db   = require('../config/db');

// ── GET /api/teacher/dashboard ─────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const [stats] = await db.query(
      'SELECT COUNT(*) AS total_materials FROM materials WHERE uploaded_by = ?',
      [req.user.id]
    );
    const [studentCount] = await db.query(
      "SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'"
    );

    return res.json({
      user:            rows[0],
      total_materials: stats[0].total_materials,
      total_students:  studentCount[0].total_students,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/teacher/materials ────────────────────────────────────────────
exports.getMaterials = async (req, res, next) => {
  try {
    const [materials] = await db.query(
      `SELECT m.id, m.title, m.file_name, m.file_path, m.created_at,
              s.id AS subject_id, s.name AS subject_name
       FROM   materials m
       LEFT JOIN subjects s ON s.id = m.subject_id
       WHERE  m.uploaded_by = ?
       ORDER  BY m.created_at DESC`,
      [req.user.id]
    );
    return res.json({ materials });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/teacher/subjects ────────────────────────────────────────────
exports.createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Subject name is required' });
    const [existing] = await db.query('SELECT id FROM subjects WHERE name = ?', [name.trim()]);
    if (existing.length) return res.status(409).json({ message: 'Subject already exists' });
    const [result] = await db.query('INSERT INTO subjects (name) VALUES (?)', [name.trim()]);
    return res.status(201).json({ subject: { id: result.insertId, name: name.trim() } });
  } catch (err) { next(err); }
};

// ── DELETE /api/teacher/subjects/:id ──────────────────────────────────────
exports.deleteSubject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[{ cnt }]] = await db.query(
      `SELECT (SELECT COUNT(*) FROM materials WHERE subject_id = ?) +
              (SELECT COUNT(*) FROM tests    WHERE subject_id = ?) AS cnt`,
      [id, id]
    );
    if (cnt > 0) return res.status(400).json({ message: 'Cannot delete a subject that has materials or tests linked to it' });
    await db.query('DELETE FROM subjects WHERE id = ?', [id]);
    return res.json({ message: 'Subject deleted' });
  } catch (err) { next(err); }
};

// ── GET /api/teacher/analytics ────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const tid = req.user.id;

    const [testStats] = await db.query(
      `SELECT t.id, t.title, t.status, s.name AS subject_name,
              COUNT(ta.id) AS attempts,
              ROUND(AVG(ta.score / ta.total_marks * 100), 1) AS avg_pct,
              ROUND(MAX(ta.score / ta.total_marks * 100), 1) AS top_pct,
              SUM(CASE WHEN ta.score / ta.total_marks >= 0.5 THEN 1 ELSE 0 END) AS passed,
              COUNT(tq.id) AS question_count
       FROM tests t
       LEFT JOIN subjects s ON s.id = t.subject_id
       LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.status = 'submitted' AND ta.total_marks > 0
       LEFT JOIN test_questions tq ON tq.test_id = t.id
       WHERE t.teacher_id = ?
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [tid]
    );

    const [students] = await db.query(
      `SELECT u.id, u.name, u.email,
              COUNT(ta.id) AS tests_taken,
              ROUND(AVG(ta.score / ta.total_marks * 100), 1) AS avg_pct,
              SUM(ta.score) AS total_score,
              SUM(ta.total_marks) AS total_available
       FROM users u
       LEFT JOIN test_attempts ta ON ta.student_id = u.id
                AND ta.status = 'submitted' AND ta.total_marks > 0
                AND ta.test_id IN (SELECT id FROM tests WHERE teacher_id = ?)
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY avg_pct DESC, u.name`,
      [tid]
    );

    const [[overall]] = await db.query(
      `SELECT COUNT(DISTINCT ta.student_id) AS active_students,
              COUNT(ta.id) AS total_attempts,
              ROUND(AVG(ta.score / ta.total_marks * 100), 1) AS avg_pct
       FROM test_attempts ta
       JOIN tests t ON t.id = ta.test_id
       WHERE t.teacher_id = ? AND ta.status = 'submitted' AND ta.total_marks > 0`,
      [tid]
    );

    return res.json({ overall, test_stats: testStats, students });
  } catch (err) { next(err); }
};

// ── POST /api/teacher/upload-material ─────────────────────────────────────
// Form-data: file (binary) + title (string) + subject_id (number)
exports.uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const { title, subject_id } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!subject_id) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const file_path = `uploads/${req.file.filename}`;

    const [result] = await db.query(
      'INSERT INTO materials (title, file_name, file_path, uploaded_by, subject_id) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), req.file.originalname, file_path, req.user.id, Number(subject_id)]
    );

    return res.status(201).json({
      message:     'Material uploaded successfully',
      material_id: result.insertId,
      file_path,
    });
  } catch (err) {
    next(err);
  }
};
