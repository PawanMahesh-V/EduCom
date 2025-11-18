const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/teachers', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, reg_id, full_name, email, department, role 
             FROM users 
             WHERE role IN ('Teacher','HOD','PM') 
             ORDER BY full_name`
        );

        res.json({
            teachers: result.rows
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            'SELECT user_id, reg_id, full_name, email, role, department, program_year FROM users LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            totalUsers,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT user_id, reg_id, full_name, email, role, department, program_year FROM users WHERE user_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
    const { reg_id, full_name, email, password, role = 'Student', department = 'CS', program_year } = req.body;

        if (!reg_id || !full_name || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validRoles = ['Admin', 'Teacher', 'Student', 'HOD', 'PM'];
    const validDepartments = ['CS', 'BBA', 'IT'];
        let programYearValue = null;
        if (role === 'PM') {
            const py = parseInt(program_year, 10);
            if (!(py >= 1 && py <= 4)) {
                return res.status(400).json({ message: 'Program year must be between 1 and 4 for PM role' });
            }
            programYearValue = py;
        }
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        if (!validDepartments.includes(department)) {
            return res.status(400).json({ message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` });
        }

        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR reg_id = $2',
            [email, reg_id]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const bcrypt = require('bcrypt');
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (reg_id, full_name, email, password_hash, role, department, program_year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, reg_id, full_name, email, role, department, program_year',
            [reg_id, full_name, email, hashedPassword, role, department, programYearValue]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ 
                message: 'A user with this registration ID or email already exists',
                detail: err.detail
            });
        }

        res.status(500).json({ 
            message: 'Server error while creating user',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { reg_id, full_name, email, password, role, department, program_year } = req.body;
        let programYearValue = null;
        if (role === 'PM') {
            const py = parseInt(program_year, 10);
            if (!(py >= 1 && py <= 4)) {
                return res.status(400).json({ message: 'Program year must be between 1 and 4 for PM role' });
            }
            programYearValue = py;
        }

        const validRoles = ['Admin', 'Teacher', 'Student', 'HOD', 'PM'];
        const validDepartments = ['CS', 'BBA', 'IT'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        if (!validDepartments.includes(department)) {
            return res.status(400).json({ message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` });
        }

        const userExists = await pool.query(
            'SELECT role FROM users WHERE user_id = $1',
            [id]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userExists.rows[0].role === 'Admin' && role !== 'Admin') {
            const adminCount = await pool.query(
                'SELECT COUNT(*) FROM users WHERE role = $1',
                ['Admin']
            );
            if (parseInt(adminCount.rows[0].count) <= 1) {
                return res.status(400).json({ message: 'Cannot change role of the last admin user' });
            }
        }

        if (password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

            if (!hashedPassword || !hashedPassword.startsWith('$2')) {
                throw new Error('Failed to generate valid password hash');
            }
            
            const result = await pool.query(
                'UPDATE users SET reg_id = $1, full_name = $2, email = $3, role = $4, department = $5, program_year = $6, password_hash = $7 WHERE user_id = $8 RETURNING user_id, reg_id, full_name, email, role, department, program_year',
                [reg_id, full_name, email, role, department, programYearValue, hashedPassword, id]
            );
            return res.json(result.rows[0]);
        }

        const result = await pool.query(
            'UPDATE users SET reg_id = $1, full_name = $2, email = $3, role = $4, department = $5, program_year = $6 WHERE user_id = $7 RETURNING user_id, reg_id, full_name, email, role, department, program_year',
            [reg_id, full_name, email, role, department, programYearValue, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ 
                message: 'A user with this registration ID or email already exists',
                detail: err.detail
            });
        }

        res.status(500).json({ 
            message: 'Server error while updating user',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        const userExists = await client.query(
            'SELECT role FROM users WHERE user_id = $1',
            [id]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userExists.rows[0].role === 'Admin') {
            const adminCount = await client.query(
                'SELECT COUNT(*) FROM users WHERE role = $1',
                ['Admin']
            );
            if (parseInt(adminCount.rows[0].count) <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        await client.query('DELETE FROM submissions WHERE student_id = $1', [id]);
        await client.query('DELETE FROM enrollments WHERE student_id = $1', [id]);
        await client.query('DELETE FROM anonymous_feedback WHERE sender_id = $1 OR receiver_id = $1', [id]);
        await client.query('DELETE FROM notifications WHERE sender_id = $1', [id]);
        await client.query('UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1', [id]);
        await client.query('DELETE FROM reports WHERE reporter_id = $1', [id]);
        const marketplaceItems = await client.query(
            'SELECT item_id FROM marketplace_items WHERE seller_id = $1',
            [id]
        );
        
        if (marketplaceItems.rows.length > 0) {
            const itemIds = marketplaceItems.rows.map(item => item.item_id);
            await client.query('DELETE FROM transactions WHERE item_id = ANY($1::int[])', [itemIds]);
        }
        
        await client.query('DELETE FROM transactions WHERE buyer_id = $1', [id]);
        
        await client.query('DELETE FROM marketplace_items WHERE seller_id = $1', [id]);
        const result = await client.query(
            'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
            [id]
        );
        await client.query('COMMIT');
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        
        res.status(500).json({ 
            message: 'Server error while deleting user',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        client.release();
    }
});

router.get('/teachers', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, reg_id, full_name, email, department, role 
             FROM users 
             WHERE role IN ('Teacher','HOD','PM') 
             ORDER BY full_name`
        );

        res.json({
            teachers: result.rows
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/admin/profile', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT user_id, reg_id, full_name, email, role, department FROM users WHERE user_id = $1 AND role = $2',
            [req.user.userId, 'Admin']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/admin/reset-invalid-passwords', auth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const invalidQ = await client.query(
                "SELECT user_id, reg_id, email, password_hash FROM users WHERE password_hash IS NULL OR password_hash NOT LIKE '$2%'");

            if (invalidQ.rows.length === 0) {
                await client.query('COMMIT');
                return res.json({ updated: [] });
            }

            const bcrypt = require('bcrypt');
            const updated = [];

            for (const u of invalidQ.rows) {
                const tempPassword = 'TempPass!' + Math.random().toString(36).slice(2, 10);
                const hashed = await bcrypt.hash(tempPassword, 10);

                await client.query(
                    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
                    [hashed, u.user_id]
                );

                updated.push({ user_id: u.user_id, reg_id: u.reg_id, email: u.email, tempPassword });
            }

            await client.query('COMMIT');
            res.json({ updated });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error while resetting passwords' });
    }
});

module.exports = router;