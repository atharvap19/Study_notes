const db = require('../config/db');

// ── GET /api/subjects ──────────────────────────────────────────────────────
exports.getSubjects = async (req, res, next) => {
  try {
    const [subjects] = await db.query(
      'SELECT id, name FROM subjects ORDER BY name'
    );
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
};
