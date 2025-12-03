const express = require('express');
const { register, login, verifyOTP, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('verificationDocument'), register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', require('../controllers/authController').forgotPassword);
router.post('/reset-password', require('../controllers/authController').resetPassword);
router.get('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
