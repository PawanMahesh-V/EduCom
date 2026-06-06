const User = require('../models/User');
const AuthService = require('../services/AuthService');

class AuthController {
    static async login(req, res, next) {
        try {
            let { identifier, password } = req.body;
            identifier = identifier ? identifier.trim() : identifier;
            
            const result = await AuthService.login(identifier, password);
            res.json({
                message: 'Login successful',
                user: result.user,
                token: result.token
            });
        } catch (err) {
            if (err.message.includes('Invalid credentials') || err.message.includes('not found')) {
                return res.status(401).json({ message: err.message });
            }
            next(err);
        }
    }

    static async verifyLogin(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            const result = await AuthService.verifyLogin(email, code);
            res.json(result);
        } catch (err) {
            if (err.message.includes('Invalid or expired')) {
                return res.status(400).json({ message: err.message });
            }
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    static async getCurrentUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                user: {
                    id: user.id,
                    reg_id: user.reg_id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    is_active: user.is_active
                }
            });
        } catch (err) {
            next(err);
        }
    }

    static async logout(req, res, next) {
        try {
            res.json({ message: 'Logged out successfully' });
        } catch (err) {
            next(err);
        }
    }

    static async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const verificationCode = await AuthService.forgotPassword(email);
            res.json({
                message: 'If an account exists with this email, you will receive a verification code.',
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });
        } catch (err) {
            if (err.message.includes('No account found')) {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    static async verifyResetCode(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            const resetToken = await AuthService.verifyResetCode(email, code);
            res.json({
                message: 'Code verified successfully',
                resetToken
            });
        } catch (err) {
            if (err.message.includes('Invalid or expired')) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const { resetToken, newPassword } = req.body;
            if (!resetToken || !newPassword) {
                return res.status(400).json({ message: 'Reset token and new password are required' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }

            await AuthService.resetPassword(resetToken, newPassword);
            res.json({ message: 'Password reset successfully' });
        } catch (err) {
            if (err.message.includes('Invalid or expired')) {
                return res.status(400).json({ message: err.message });
            }
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    static async checkEmail(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const status = await AuthService.checkEmail(email);
            return res.json(status);
        } catch (err) {
            next(err);
        }
    }

    static async sendRegistrationCode(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const lowerEmail = email.toLowerCase();
            const allowedDomain = lowerEmail.endsWith('@szabist.pk') || lowerEmail.endsWith('@szabist.edu.pk');
            if (!allowedDomain) {
                return res.status(400).json({ message: 'Only @szabist.pk or @szabist.edu.pk email addresses are allowed' });
            }

            const existingStatus = await AuthService.checkEmail(lowerEmail);
            if (existingStatus.exists) {
                return res.status(400).json({ message: 'This email is already registered' });
            }
            if (existingStatus.pending) {
                return res.status(400).json({ message: 'A registration request is already pending for this email' });
            }

            const verificationCode = await AuthService.sendRegistrationCode(lowerEmail);
            res.json({
                message: 'Verification code sent to your email',
                email: lowerEmail,
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });
        } catch (err) {
            next(err);
        }
    }

    static async verifyRegistrationCode(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            await AuthService.verifyRegistrationCode(email, code);
            res.json({
                message: 'Email verified successfully',
                verified: true
            });
        } catch (err) {
            if (err.message.includes('Invalid or expired')) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    }

    static async register(req, res, next) {
        try {
            const { reg_id, name, email, password, role, department } = req.body;

            if (!name || !email || !password || !role || !department) {
                return res.status(400).json({ message: 'All required fields must be provided' });
            }
            
            const lowerEmail = email.toLowerCase();
            const allowedDomain = lowerEmail.endsWith('@szabist.pk') || lowerEmail.endsWith('@szabist.edu.pk');
            if (!allowedDomain) {
                return res.status(400).json({ message: 'Only @szabist.pk or @szabist.edu.pk email addresses are allowed' });
            }

            if (!['Teacher', 'HOD', 'PM'].includes(role) && !reg_id) {
                return res.status(400).json({ message: 'Registration ID is required' });
            }

            const existingStatus = await AuthService.checkEmail(lowerEmail);
            if (existingStatus.exists) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
            if (existingStatus.pending) {
                return res.status(400).json({ message: 'A registration request is already pending for this email' });
            }

            await AuthService.register(req.body);
            res.status(201).json({ message: 'Registration request submitted successfully. Please wait for admin approval.' });
        } catch (err) {
            next(err);
        }
    }

    static async getRegistrationRequests(req, res, next) {
        try {
            const requests = await AuthService.getRegistrationRequests();
            res.json({ requests });
        } catch (err) {
            next(err);
        }
    }

    static async approveRegistration(req, res, next) {
        try {
            const { requestId } = req.params;
            await AuthService.approveRegistration(requestId);
            res.json({ message: 'Registration approved successfully' });
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    static async rejectRegistration(req, res, next) {
        try {
            const { requestId } = req.params;
            await AuthService.rejectRegistration(requestId);
            res.json({ message: 'Registration rejected' });
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }
}

module.exports = AuthController;
