const { Router } = require('express');
const { register, login, updateProfile, changePassword, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login',    login);

// Protected
router.get('/me',               verifyToken, getMe);
router.patch('/profile',        verifyToken, updateProfile);
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;
