const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const pool = require('../config/database');
const { sendVerificationCode, sendRegistrationApprovalEmail } = require('../config/emailConfig');

class AuthController {
    static async login(req, res) {
        try {
            let { identifier, password } = req.body;
            identifier = identifier ? identifier.trim() : identifier;
            const user = await User.findByIdentifier(identifier);

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            if (!user.password) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            try {
                const storedHash = typeof user.password === 'string'
                    ? user.password
                    : user.password.toString();
                const isValidPassword = await bcrypt.compare(password, storedHash);

                if (!isValidPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            } catch (hashError) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            // Store verification code in login_verification_codes table
            await pool.query(
                `INSERT INTO login_verification_codes (email, code, expires_at) 
                 VALUES ($1, $2, $3)`,
                [user.email, verificationCode, expiresAt]
            );

            // Send verification code
            try {
                await sendVerificationCode(user.email, verificationCode);
            } catch (emailError) {
                // Email sending failed silently
            }

            res.json({
                message: 'Verification code sent to your email',
                email: user.email,
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });

        } catch (err) {
            res.status(500).json({ message: 'Server error during login' });
        }
    }

    static async verifyLogin(req, res) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ message: 'Email and code are required' });
            }

            // Verify the code
            const result = await pool.query(
                `SELECT * FROM login_verification_codes 
                 WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY created_at DESC LIMIT 1`,
                [email.trim(), code.trim()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            // Mark code as used
            await pool.query(
                `UPDATE login_verification_codes SET used = TRUE WHERE id = $1`,
                [result.rows[0].id]
            );

            // Get user
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
            delete user.password;

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
            res.status(500).json({ message: 'Server error during verification' });
        }
    }
    static async getCurrentUser(req, res) {
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
            res.status(500).json({ message: 'Server error' });
        }
    }
    static async logout(req, res) {
        try {
            res.json({ message: 'Logged out successfully' });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async forgotPassword(req, res) {
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
                await sendVerificationCode(user.email, verificationCode);
            } catch (emailError) {
            }

            res.json({ 
                message: 'If an account exists with this email, you will receive a verification code.',
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });

        } catch (err) {
            res.status(500).json({ message: 'Server error during password reset' });
        }
    }

    static async verifyResetCode(req, res) {
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
            res.status(500).json({ message: 'Server error during code verification' });
        }
    }

    static async resetPassword(req, res) {
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
            res.status(500).json({ message: 'Server error during password reset' });
        }
    }

    static async checkEmail(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            // Check if email exists in users table
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                return res.json({ exists: true, pending: false });
            }

            // Check if email has a pending registration request
            const pendingRequest = await pool.query(
                'SELECT id FROM registration_requests WHERE email = $1 AND status = $2',
                [email.toLowerCase(), 'pending']
            );

            if (pendingRequest.rows.length > 0) {
                return res.json({ exists: false, pending: true });
            }

            return res.json({ exists: false, pending: false });

        } catch (err) {
            console.error('Error checking email:', err);
            res.status(500).json({ message: 'Server error checking email' });
        }
    }

    static async register(req, res) {
        try {
            const { reg_id, name, email, password, role, department, semester, program_year } = req.body;

            // Validation
            if (!reg_id || !name || !email || !password || !role || !department) {
                return res.status(400).json({ message: 'All required fields must be provided' });
            }

            // Validate email domain
            if (!email.toLowerCase().endsWith('@szabist.pk')) {
                return res.status(400).json({ message: 'Only @szabist.pk email addresses are allowed' });
            }

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1 OR reg_id = $2',
                [email.toLowerCase(), reg_id]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'User with this email or registration ID already exists' });
            }

            // Check if there's a pending request
            const existingRequest = await pool.query(
                'SELECT id FROM registration_requests WHERE (email = $1 OR reg_id = $2) AND status = $3',
                [email.toLowerCase(), reg_id, 'pending']
            );

            if (existingRequest.rows.length > 0) {
                return res.status(400).json({ message: 'A registration request is already pending for this email or ID' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into registration_requests table
            await pool.query(
                `INSERT INTO registration_requests 
                 (reg_id, name, email, password, role, department, semester, program_year, status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)`,
                [reg_id, name, email.toLowerCase(), hashedPassword, role, department, semester || null, program_year || null]
            );

            res.status(201).json({ message: 'Registration request submitted successfully. Please wait for admin approval.' });

        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ message: 'Server error during registration' });
        }
    }

    static async getRegistrationRequests(req, res) {
        try {
            const result = await pool.query(
                `SELECT id, reg_id, name, email, role, department, semester, program_year, status, created_at 
                 FROM registration_requests 
                 WHERE status = 'pending'
                 ORDER BY created_at DESC`
            );

            res.json({ requests: result.rows });
        } catch (err) {
            console.error('Error fetching registration requests:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async approveRegistration(req, res) {
        try {
            const { requestId } = req.params;

            // Get the request
            const request = await pool.query(
                'SELECT * FROM registration_requests WHERE id = $1 AND status = $2',
                [requestId, 'pending']
            );

            if (request.rows.length === 0) {
                return res.status(404).json({ message: 'Registration request not found' });
            }

            const reqData = request.rows[0];

            // Create user
            await pool.query(
                `INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
                [reqData.reg_id, reqData.name, reqData.email, reqData.password, reqData.role, reqData.department, reqData.semester, reqData.program_year]
            );

            // Update request status
            await pool.query(
                'UPDATE registration_requests SET status = $1 WHERE id = $2',
                ['approved', requestId]
            );

            // Send approval email
            try {
                await sendRegistrationApprovalEmail(reqData.email, reqData.name);
            } catch (emailError) {
                console.error('Error sending approval email:', emailError);
                // Continue even if email fails
            }

            res.json({ message: 'Registration approved successfully' });

        } catch (err) {
            console.error('Error approving registration:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async rejectRegistration(req, res) {
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
            console.error('Error rejecting registration:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = AuthController;
