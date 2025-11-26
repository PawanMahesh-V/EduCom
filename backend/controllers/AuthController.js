const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const pool = require('../config/database');
const { sendVerificationCode } = require('../config/emailConfig');

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
}

module.exports = AuthController;
