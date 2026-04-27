const { Router } = require('express');
const { getSubjects } = require('../controllers/subjectsController');

const router = Router();

// GET /api/subjects  — public, no auth required
router.get('/', getSubjects);

module.exports = router;
