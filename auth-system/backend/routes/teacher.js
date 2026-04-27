const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getDashboard, uploadMaterial, getMaterials, getAnalytics, createSubject, deleteSubject } = require('../controllers/teacherController');
const {
  createTest, getTeacherTests, getTestQuestions, addQuestion,
  deleteQuestion, publishTest, closeTest, getTestResults,
} = require('../controllers/testController');
const upload = require('../middleware/upload');

const router = Router();

router.use(verifyToken, requireRole('teacher'));

// Dashboard
router.get('/dashboard', getDashboard);

// Analytics
router.get('/analytics', getAnalytics);

// Subject management
router.post('/subjects',     createSubject);
router.delete('/subjects/:id', deleteSubject);

// Materials
router.get('/materials', getMaterials);
router.post(
  '/upload-material',
  (req, res, next) => {
    upload.single('file')(req, res, err => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  uploadMaterial
);

// Tests
router.get('/tests',                        getTeacherTests);
router.post('/tests',                       createTest);
router.get('/tests/:testId/questions',      getTestQuestions);
router.post('/tests/:testId/questions',     addQuestion);
router.delete('/questions/:questionId',     deleteQuestion);
router.patch('/tests/:testId/publish',      publishTest);
router.patch('/tests/:testId/close',        closeTest);
router.get('/tests/:testId/results',        getTestResults);

module.exports = router;
