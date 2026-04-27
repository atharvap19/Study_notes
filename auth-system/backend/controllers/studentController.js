const path     = require('path');
const fs       = require('fs');
const axios    = require('axios');
const FormData = require('form-data');
const db       = require('../config/db');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// ── GET /api/student/dashboard ─────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/student/materials ────────────────────────────────────────────
// Returns only materials whose subject_id matches the student's enrolled subjects.
exports.getMaterials = async (req, res, next) => {
  try {
    const [subs] = await db.query(
      'SELECT subject_id FROM user_subjects WHERE user_id = ?',
      [req.user.id]
    );
    const subjectIds = subs.map(r => r.subject_id);

    if (subjectIds.length === 0) {
      return res.json({ materials: [] });
    }

    const [materials] = await db.query(
      `SELECT m.id, m.title, m.file_name, m.file_path, m.created_at,
              u.name AS uploaded_by,
              s.id   AS subject_id,
              s.name AS subject_name
       FROM   materials m
       JOIN   users     u ON u.id  = m.uploaded_by
       LEFT JOIN subjects s ON s.id = m.subject_id
       WHERE  m.subject_id IN (?)
       ORDER  BY s.name, m.created_at DESC`,
      [subjectIds]
    );
    return res.json({ materials });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/student/document-ai ─────────────────────────────────────────
// Body: { file_id: <number> }
exports.documentAI = async (req, res, next) => {
  try {
    const { file_id } = req.body;
    if (!file_id) return res.status(400).json({ message: 'file_id is required' });

    const [rows] = await db.query(
      'SELECT id, title, file_name, file_path FROM materials WHERE id = ?',
      [Number(file_id)]
    );
    if (!rows.length) return res.status(404).json({ message: 'Material not found' });

    const material = rows[0];
    const absPath  = path.join(UPLOADS_DIR, path.basename(material.file_path));
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: `File not found on server: ${material.file_name}` });
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(absPath), material.file_name);

    const docAiUrl = `${process.env.DOCAI_BASE_URL || 'http://localhost:8000'}/process-file`;
    const response = await axios.post(docAiUrl, form, {
      headers: form.getHeaders(),
      timeout: 120_000,
    });

    const { notes, flashcards, quiz, key_concepts, highlights, mindmap } = response.data;

    return res.json({
      material:     { id: material.id, title: material.title },
      summary:      notes         || '',
      flashcards:   flashcards    || [],
      quiz:         quiz          || [],
      key_concepts: key_concepts  || [],
      highlights:   highlights    || [],
      mindmap:      mindmap       || null,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(502).json({
        message: 'Document AI service is unavailable. Ensure DOCAI_BASE_URL points to a running Python backend.',
      });
    }
    next(err);
  }
};

// ── GET /api/student/study-plan ───────────────────────────────────────────
exports.getStudyPlan = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT plan_json, generated_at FROM study_plans WHERE student_id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.json({ plan: null });
    return res.json({ plan: rows[0].plan_json, generated_at: rows[0].generated_at });
  } catch (err) { next(err); }
};

// ── GET /api/student/notifications ────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    return res.json({ notifications: rows, unread: rows.filter(r => !r.is_read).length });
  } catch (err) { next(err); }
};

// ── PATCH /api/student/notifications/read ─────────────────────────────────
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

// ── POST /api/student/study-plan ──────────────────────────────────────────
exports.generateStudyPlan = async (req, res, next) => {
  try {
    const sid = req.user.id;
    const { callGroq } = require('../utils/groq');

    const [[user]] = await db.query('SELECT name FROM users WHERE id = ?', [sid]);

    const [enrolled] = await db.query(
      `SELECT s.id, s.name FROM user_subjects us
       JOIN subjects s ON s.id = us.subject_id
       WHERE us.user_id = ?`,
      [sid]
    );

    const [perf] = await db.query(
      `SELECT s.name AS subject_name,
              COUNT(ta.id) AS tests_taken,
              ROUND(AVG(ta.score / ta.total_marks * 100), 1) AS avg_pct
       FROM test_attempts ta
       JOIN tests t ON t.id = ta.test_id
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE ta.student_id = ? AND ta.status = 'submitted' AND ta.total_marks > 0
       GROUP BY s.id, s.name`,
      [sid]
    );

    let materials = [];
    if (enrolled.length) {
      const [mats] = await db.query(
        `SELECT m.title, s.name AS subject_name
         FROM materials m LEFT JOIN subjects s ON s.id = m.subject_id
         WHERE m.subject_id IN (?)
         ORDER BY s.name, m.title`,
        [enrolled.map(e => e.id)]
      );
      materials = mats;
    }

    const subjectList = enrolled.map(e => e.name).join(', ') || 'none enrolled';
    const perfText = perf.length
      ? perf.map(p => `- ${p.subject_name}: avg ${p.avg_pct}% (${p.tests_taken} test${p.tests_taken !== 1 ? 's' : ''})`).join('\n')
      : '- No test results yet';
    const matText = materials.length
      ? materials.map(m => `- [${m.subject_name}] ${m.title}`).join('\n')
      : '- No materials uploaded yet';

    const prompt = `You are an AI academic advisor. Generate a personalised 7-day study plan for ${user.name}.

ENROLLED SUBJECTS: ${subjectList}

TEST PERFORMANCE:
${perfText}

AVAILABLE STUDY MATERIALS:
${matText}

RULES:
- Subjects with avg < 60% need the most sessions (high priority)
- Subjects with avg 60-74% need moderate sessions (medium priority)
- Subjects with avg >= 75% need light revision (low priority)
- Subjects with no test data get moderate attention
- Each day should have 2-4 sessions totalling 2-4 hours
- Sessions: 30-90 min each
- Tips must be specific and actionable (not generic)
- Return ONLY valid JSON, no markdown fences, no explanation outside JSON

JSON format:
{
  "summary": "2-3 sentences explaining the plan rationale",
  "weak_areas": ["subjects with avg < 60%"],
  "strong_areas": ["subjects with avg >= 75%"],
  "plan": [
    {
      "day": "Day 1",
      "label": "Monday",
      "sessions": [
        {
          "subject": "Subject Name",
          "topic": "Specific topic or material title",
          "duration": "45 min",
          "priority": "high",
          "tip": "Actionable study tip"
        }
      ]
    }
  ]
}`;

    const raw = await callGroq(prompt, 2800);

    let plan;
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('{');
      const end   = cleaned.lastIndexOf('}');
      plan = JSON.parse(cleaned.slice(start, end + 1));
    } catch (_) {
      return res.status(502).json({ message: 'AI returned an unexpected format. Please try again.' });
    }

    // Persist to DB (upsert — one plan per student)
    await db.query(
      `INSERT INTO study_plans (student_id, plan_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE plan_json = VALUES(plan_json), generated_at = NOW()`,
      [sid, JSON.stringify(plan)]
    );

    return res.json({ plan, generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.response?.status === 429) {
      return res.status(429).json({ message: 'AI rate limit reached. Please try again in a few minutes.' });
    }
    next(err);
  }
};

// ── GET /api/student/analytics ────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const sid = req.user.id;

    const [[overall]] = await db.query(
      `SELECT COUNT(*) AS tests_taken,
              ROUND(AVG(score / total_marks * 100), 1) AS avg_pct,
              SUM(score) AS total_score,
              SUM(total_marks) AS total_available,
              SUM(CASE WHEN score / total_marks >= 0.5 THEN 1 ELSE 0 END) AS passed
       FROM test_attempts
       WHERE student_id = ? AND status = 'submitted' AND total_marks > 0`,
      [sid]
    );

    const [bySubject] = await db.query(
      `SELECT s.name AS subject_name,
              COUNT(ta.id) AS tests_taken,
              ROUND(AVG(ta.score / ta.total_marks * 100), 1) AS avg_pct,
              ROUND(MAX(ta.score / ta.total_marks * 100), 1) AS best_pct
       FROM test_attempts ta
       JOIN tests t ON t.id = ta.test_id
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE ta.student_id = ? AND ta.status = 'submitted' AND ta.total_marks > 0
       GROUP BY s.id, s.name
       ORDER BY avg_pct DESC`,
      [sid]
    );

    const [recent] = await db.query(
      `SELECT t.title, s.name AS subject_name,
              ta.score, ta.total_marks,
              ROUND(ta.score / ta.total_marks * 100) AS percentage,
              ta.submitted_at
       FROM test_attempts ta
       JOIN tests t ON t.id = ta.test_id
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE ta.student_id = ? AND ta.status = 'submitted'
       ORDER BY ta.submitted_at DESC
       LIMIT 20`,
      [sid]
    );

    return res.json({ overall, by_subject: bySubject, recent });
  } catch (err) { next(err); }
};

// ── POST /api/student/open-document-ai ────────────────────────────────────
// Body: { file_path: "uploads/ml_intro.pdf" }  (legacy modal path)
exports.openDocumentAI = async (req, res, next) => {
  try {
    const { file_path } = req.body;
    if (!file_path) {
      return res.status(400).json({ message: 'file_path is required' });
    }

    const safeName = path.basename(file_path);
    const absPath  = path.join(UPLOADS_DIR, safeName);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: `File "${safeName}" not found on server` });
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(absPath), safeName);

    const docAiUrl = `${process.env.DOCAI_BASE_URL || 'http://localhost:8000'}/process-file`;
    const response = await axios.post(docAiUrl, form, {
      headers: form.getHeaders(),
      timeout: 120_000,
    });

    const { notes, flashcards, quiz, key_concepts, highlights, mindmap } = response.data;

    return res.json({
      summary:      notes,
      flashcards:   flashcards   || [],
      quiz:         quiz         || [],
      key_concepts: key_concepts || [],
      highlights:   highlights   || [],
      mindmap:      mindmap      || null,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(502).json({
        message: 'Document AI service is unavailable. Make sure the FastAPI backend is running on port 8000.',
      });
    }
    next(err);
  }
};
