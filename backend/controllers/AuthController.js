const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const pool = require('../config/database');
const EmailService = require('../services/EmailService');

class AuthController {
    static async login(req, res, next) {
        try {
            let { identifier, password } = req.body;
            identifier = identifier ? identifier.trim() : identifier;
            const user = await User.findByIdentifier(identifier);

            if (!user) {
                return res.status(401).json({ message: 'Invalid email or User not found' });
            }
            if (!user.password) {
                return res.status(401).json({ message: 'Invalid Password or User not found' });
            }

            try {
                const storedHash = typeof user.password === 'string'
                    ? user.password
                    : user.password.toString();
                const isValidPassword = await bcrypt.compare(password, storedHash);

                if (!isValidPassword) {
                    return res.status(401).json({ message: 'Invalid credentials or User not found' });
                }
            } catch (hashError) {
                return res.status(401).json({ message: 'Invalid credentials or User not found' });
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not properly configured');
            }

            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

            const userResponse = {
                id: user.id,
                reg_id: user.reg_id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department
            };

            res.json({
                message: 'Login successful',
                user: userResponse,
                token
            });

        } catch (err) {
            next(err);
        }
    }

    static async verifyLogin(req, res, next) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            const result = await pool.query(
                `SELECT * FROM login_verification_codes 
                 WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY created_at DESC LIMIT 1`,
                [email.trim(), code.trim()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            await pool.query(
                `UPDATE login_verification_codes SET used = TRUE WHERE id = $1`,
                [result.rows[0].id]
            );

            const user = await User.findByIdentifier(email);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not properly configured');
            }

            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

            res.json({
                user: {
                    id: user.id,
                    reg_id: user.reg_id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department
                },
                token
            });

        } catch (err) {
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
                    department: user.department
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

            const user = await User.findByIdentifier(email.trim());

            if (!user) {
                return res.status(404).json({
                    message: 'No account found with this email address.'
                });
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await pool.query(
                `INSERT INTO password_reset_codes (email, code, expires_at) 
                 VALUES ($1, $2, $3)`,
                [user.email, verificationCode, expiresAt]
            );

            try {
                await EmailService.sendVerificationCode(user.email, verificationCode, 'password-reset');
            } catch (emailError) {
                console.error('Error sending reset email', emailError);
            }

            res.json({
                message: 'If an account exists with this email, you will receive a verification code.',
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });

        } catch (err) {
            next(err);
        }
    }

    static async verifyResetCode(req, res, next) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            const result = await pool.query(
                `SELECT * FROM password_reset_codes 
                 WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY created_at DESC LIMIT 1`,
                [email.trim(), code.trim()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            await pool.query(
                `UPDATE password_reset_codes SET used = TRUE WHERE id = $1`,
                [result.rows[0].id]
            );

            const resetToken = jwt.sign(
                { email: email.trim(), purpose: 'password-reset' },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.json({
                message: 'Code verified successfully',
                resetToken
            });

        } catch (err) {
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

            let decoded;
            try {
                decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
                if (decoded.purpose !== 'password-reset') {
                    throw new Error('Invalid token purpose');
                }
            } catch (err) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            const user = await User.findByIdentifier(decoded.email);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.updatePassword(user.id, hashedPassword);

            res.json({ message: 'Password reset successfully' });

        } catch (err) {
            next(err);
        }
    }

    static async checkEmail(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                return res.json({ exists: true, pending: false });
            }

            const pendingRequest = await pool.query(
                'SELECT id FROM registration_requests WHERE email = $1 AND status = $2',
                [email.toLowerCase(), 'pending']
            );

            if (pendingRequest.rows.length > 0) {
                return res.json({ exists: false, pending: true });
            }

            return res.json({ exists: false, pending: false });

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

            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [lowerEmail]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'This email is already registered' });
            }

            const pendingRequest = await pool.query(
                'SELECT id FROM registration_requests WHERE email = $1 AND status = $2',
                [lowerEmail, 'pending']
            );

            if (pendingRequest.rows.length > 0) {
                return res.status(400).json({ message: 'A registration request is already pending for this email' });
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            try {
                await EmailService.sendVerificationCode(lowerEmail, verificationCode, 'registration');
            } catch (emailError) {
                return res.status(400).json({
                    message: 'Failed to send verification email. Please check if the email address is valid.'
                });
            }

            await pool.query(
                `INSERT INTO login_verification_codes (email, code, expires_at) 
                 VALUES ($1, $2, $3)`,
                [lowerEmail, verificationCode, expiresAt]
            );

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

            const result = await pool.query(
                `SELECT * FROM login_verification_codes 
                 WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY created_at DESC LIMIT 1`,
                [email.toLowerCase().trim(), code.trim()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            await pool.query(
                `UPDATE login_verification_codes SET used = TRUE WHERE id = $1`,
                [result.rows[0].id]
            );

            res.json({
                message: 'Email verified successfully',
                verified: true
            });

        } catch (err) {
            next(err);
        }
    }

    static async register(req, res, next) {
        try {
            const { reg_id, name, email, password, role, department, semester, program_year } = req.body;

            if (!name || !email || !password || !role || !department) {
                return res.status(400).json({ message: 'All required fields must be provided' });
            }

            let finalRegId = reg_id;
            if (['Teacher', 'HOD', 'PM'].includes(role)) {
                finalRegId = await User.generateNextRegId(role);
            } else {
                if (!reg_id) return res.status(400).json({ message: 'Registration ID is required' });
            }

            const lowerEmail = email.toLowerCase();
            const allowedDomain = lowerEmail.endsWith('@szabist.pk') || lowerEmail.endsWith('@szabist.edu.pk');
            if (!allowedDomain) {
                return res.status(400).json({ message: 'Only @szabist.pk or @szabist.edu.pk email addresses are allowed' });
            }

            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1 OR reg_id = $2',
                [lowerEmail, finalRegId]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'User with this email or registration ID already exists' });
            }

            const existingRequest = await pool.query(
                'SELECT id FROM registration_requests WHERE (email = $1 OR reg_id = $2) AND status = $3',
                [lowerEmail, finalRegId, 'pending']
            );

            if (existingRequest.rows.length > 0) {
                return res.status(400).json({ message: 'A registration request is already pending for this email or ID' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await pool.query(
                `INSERT INTO registration_requests 
                 (reg_id, name, email, password, role, department, semester, program_year, status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)`,
                [finalRegId, name, lowerEmail, hashedPassword, role, department, semester || null, program_year || null]
            );

            res.status(201).json({ message: 'Registration request submitted successfully. Please wait for admin approval.' });

        } catch (err) {
            next(err);
        }
    }

    static async getRegistrationRequests(req, res, next) {
        try {
            const result = await pool.query(
                `SELECT id, reg_id, name, email, role, department, semester, program_year, status, created_at 
                 FROM registration_requests 
                 WHERE status = 'pending'
                 ORDER BY created_at DESC`
            );

            res.json({ requests: result.rows });
        } catch (err) {
            next(err);
        }
    }

    static async approveRegistration(req, res, next) {
        try {
            const { requestId } = req.params;

            const request = await pool.query(
                'SELECT * FROM registration_requests WHERE id = $1 AND status = $2',
                [requestId, 'pending']
            );

            if (request.rows.length === 0) {
                return res.status(404).json({ message: 'Registration request not found' });
            }

            const reqData = request.rows[0];

            await pool.query(
                `INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
                [reqData.reg_id, reqData.name, reqData.email, reqData.password, reqData.role, reqData.department, reqData.semester, reqData.program_year]
            );

            await pool.query(
                'UPDATE registration_requests SET status = $1 WHERE id = $2',
                ['approved', requestId]
            );

            res.json({ message: 'Registration approved successfully' });

            EmailService.sendRegistrationApprovalEmail(reqData.email, reqData.name)
                .then(() => EmailService.sendWelcomeEmail(reqData.email, reqData.name, reqData.role))
                .catch(emailError => {
                    console.error('Error sending emails in background:', emailError);
                });

        } catch (err) {
            next(err);
        }
    }

    static async rejectRegistration(req, res, next) {
        try {
            const { requestId } = req.params;

            const result = await pool.query(
                'UPDATE registration_requests SET status = $1 WHERE id = $2 AND status = $3 RETURNING id',
                ['rejected', requestId, 'pending']
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Registration request not found' });
            }

            res.json({ message: 'Registration rejected' });

        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;

