const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getDashboard, openDocumentAI, getMaterials, documentAI,
  getAnalytics, generateStudyPlan, getStudyPlan,
  getNotifications, markNotificationsRead,
} = require('../controllers/studentController');
const {
  getStudentTests, startTest, submitTest, getStudentResult,
} = require('../controllers/testController');

const router = Router();

router.use(verifyToken, requireRole('student'));

// Dashboard
router.get('/dashboard', getDashboard);

// Analytics
router.get('/analytics', getAnalytics);

// Study plan
router.get('/study-plan',  getStudyPlan);
router.post('/study-plan', generateStudyPlan);

// Notifications
router.get('/notifications',       getNotifications);
router.patch('/notifications/read', markNotificationsRead);

// Materials
router.get('/materials',         getMaterials);
router.post('/document-ai',      documentAI);
router.post('/open-document-ai', openDocumentAI);

// Tests
router.get('/tests',                    getStudentTests);
router.get('/tests/:testId/start',      startTest);
router.post('/tests/:testId/submit',    submitTest);
router.get('/tests/:testId/result',     getStudentResult);

module.exports = router;
