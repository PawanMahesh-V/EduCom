const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiters for auth-sensitive routes
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

const verifyLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 60,
	standardHeaders: true,
	legacyHeaders: false,
});

const resetLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/login', loginLimiter, AuthController.login);
router.post('/verify-login', verifyLimiter, AuthController.verifyLogin);
router.post('/check-email', AuthController.checkEmail);
router.post('/register', AuthController.register);
router.get('/registration-requests', auth, AuthController.getRegistrationRequests);
router.post('/registration-requests/:requestId/approve', auth, AuthController.approveRegistration);
router.post('/registration-requests/:requestId/reject', auth, AuthController.rejectRegistration);
router.post('/forgot-password', resetLimiter, AuthController.forgotPassword);
router.post('/verify-reset-code', verifyLimiter, AuthController.verifyResetCode);
router.post('/reset-password', resetLimiter, AuthController.resetPassword);
router.get('/me', auth, AuthController.getCurrentUser);
router.post('/logout', auth, AuthController.logout);

module.exports = router;