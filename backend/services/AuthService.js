const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const pool = require('../config/database');
const EmailService = require('./EmailService');

class AuthService {
    static async login(identifier, password) {
        const user = await User.findByIdentifier(identifier);
        if (!user || !user.password) {
            throw new Error('Invalid credentials or User not found');
        }

        const storedHash = typeof user.password === 'string' ? user.password : user.password.toString();
        const isValidPassword = await bcrypt.compare(password, storedHash);

        if (!isValidPassword) {
            throw new Error('Invalid credentials or User not found');
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error('JWT_SECRET is not properly configured');

        const payload = { userId: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

        return {
            user: {
                id: user.id, reg_id: user.reg_id, email: user.email,
                name: user.name, role: user.role, department: user.department,
                is_active: user.is_active
            },
            token
        };
    }

    static async verifyLogin(email, code) {
        const result = await pool.query(
            `SELECT * FROM login_verification_codes 
             WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC LIMIT 1`,
            [email.trim(), code.trim()]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid or expired verification code');
        }

        await pool.query(`UPDATE login_verification_codes SET used = TRUE WHERE id = $1`, [result.rows[0].id]);

        const user = await User.findByIdentifier(email);
        if (!user) throw new Error('User not found');

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error('JWT_SECRET is not properly configured');

        const payload = { userId: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

        return {
            user: {
                id: user.id, reg_id: user.reg_id, email: user.email,
                name: user.name, role: user.role, department: user.department,
                is_active: user.is_active
            },
            token
        };
    }

    static async forgotPassword(email) {
        const user = await User.findByIdentifier(email.trim());
        if (!user) throw new Error('No account found with this email address.');

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        console.log('\n=================================');
        console.log('🔑 PASSWORD RESET VERIFICATION CODE');
        console.log('=================================');
        console.log(`Email: ${user.email}`);
        console.log(`Code: ${verificationCode}`);
        console.log(`Expires: ${expiresAt.toLocaleString()}`);
        console.log('=================================\n');

        await pool.query(
            `INSERT INTO password_reset_codes (email, code, expires_at) VALUES ($1, $2, $3)`,
            [user.email, verificationCode, expiresAt]
        );

        try {
            await EmailService.sendVerificationCode(user.email, verificationCode, 'password-reset');
        } catch (error) {
            console.error('Error sending reset email', error);
        }

        return verificationCode;
    }

    static async verifyResetCode(email, code) {
        const result = await pool.query(
            `SELECT * FROM password_reset_codes 
             WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC LIMIT 1`,
            [email.trim(), code.trim()]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid or expired verification code');
        }

        await pool.query(`UPDATE password_reset_codes SET used = TRUE WHERE id = $1`, [result.rows[0].id]);

        return jwt.sign(
            { email: email.trim(), purpose: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    static async resetPassword(resetToken, newPassword) {
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            if (decoded.purpose !== 'password-reset') throw new Error();
        } catch (err) {
            throw new Error('Invalid or expired reset token');
        }

        const user = await User.findByIdentifier(decoded.email);
        if (!user) throw new Error('User not found');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.id, hashedPassword);
    }

    static async checkEmail(email) {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) return { exists: true, pending: false };

        const pendingRequest = await pool.query('SELECT id FROM registration_requests WHERE email = $1 AND status = $2', [email.toLowerCase(), 'pending']);
        if (pendingRequest.rows.length > 0) return { exists: false, pending: true };

        return { exists: false, pending: false };
    }

    static async sendRegistrationCode(email) {
        const lowerEmail = email.toLowerCase();
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        console.log('\n=================================');
        console.log('📧 REGISTRATION VERIFICATION CODE');
        console.log('=================================');
        console.log(`Email: ${lowerEmail}`);
        console.log(`Code: ${verificationCode}`);
        console.log(`Expires: ${expiresAt.toLocaleString()}`);
        console.log('=================================\n');

        await pool.query(
            `INSERT INTO login_verification_codes (email, code, expires_at) VALUES ($1, $2, $3)`,
            [lowerEmail, verificationCode, expiresAt]
        );

        try {
            await EmailService.sendVerificationCode(lowerEmail, verificationCode, 'registration');
        } catch (error) {
            console.error('Error sending registration email:', error.message);
        }

        return verificationCode;
    }

    static async verifyRegistrationCode(email, code) {
        const result = await pool.query(
            `SELECT * FROM login_verification_codes 
             WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC LIMIT 1`,
            [email.toLowerCase().trim(), code.trim()]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid or expired verification code');
        }

        await pool.query(`UPDATE login_verification_codes SET used = TRUE WHERE id = $1`, [result.rows[0].id]);
        return true;
    }

    static async register(userData) {
        const { reg_id, name, email, password, role, department, semester, program_year } = userData;
        const lowerEmail = email.toLowerCase();
        
        let finalRegId = reg_id;
        if (['Teacher', 'HOD', 'PM'].includes(role)) {
            finalRegId = await User.generateNextRegId(role);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO registration_requests 
             (reg_id, name, email, password, role, department, semester, program_year, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)`,
            [finalRegId, name, lowerEmail, hashedPassword, role, department, semester || null, program_year || null]
        );
    }

    static async getRegistrationRequests() {
        const result = await pool.query(
            `SELECT id, reg_id, name, email, role, department, semester, program_year, status, created_at 
             FROM registration_requests 
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        return result.rows;
    }

    static async approveRegistration(requestId) {
        const request = await pool.query('SELECT * FROM registration_requests WHERE id = $1 AND status = $2', [requestId, 'pending']);
        if (request.rows.length === 0) throw new Error('Registration request not found');

        const reqData = request.rows[0];

        await pool.query(
            `INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
            [reqData.reg_id, reqData.name, reqData.email, reqData.password, reqData.role, reqData.department, reqData.semester, reqData.program_year]
        );

        await pool.query('UPDATE registration_requests SET status = $1 WHERE id = $2', ['approved', requestId]);

        EmailService.sendRegistrationApprovalEmail(reqData.email, reqData.name)
            .then(() => EmailService.sendWelcomeEmail(reqData.email, reqData.name, reqData.role))
            .catch(err => console.error('Error sending emails:', err));
    }

    static async rejectRegistration(requestId) {
        const result = await pool.query(
            'UPDATE registration_requests SET status = $1 WHERE id = $2 AND status = $3 RETURNING id',
            ['rejected', requestId, 'pending']
        );
        if (result.rows.length === 0) throw new Error('Registration request not found');
    }
}

module.exports = AuthService;
