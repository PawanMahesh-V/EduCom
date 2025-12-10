const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const auth = require('../middleware/auth');

router.post('/login', AuthController.login);
router.post('/verify-login', AuthController.verifyLogin);
router.post('/check-email', AuthController.checkEmail);
router.post('/register', AuthController.register);
router.get('/registration-requests', auth, AuthController.getRegistrationRequests);
router.post('/registration-requests/:requestId/approve', auth, AuthController.approveRegistration);
router.post('/registration-requests/:requestId/reject', auth, AuthController.rejectRegistration);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-reset-code', AuthController.verifyResetCode);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', auth, AuthController.getCurrentUser);
router.post('/logout', auth, AuthController.logout);

module.exports = router;