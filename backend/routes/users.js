const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/teachers', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, reg_id, name, email, department, role 
             FROM users 
             WHERE role IN ('Teacher','HOD','PM') 
             ORDER BY name`
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
        const { page = 1, limit = 10, role, department } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT id, reg_id, name, email, role, department, semester, program_year, section FROM users';
        const queryParams = [];
        const conditions = [];
        
        // Add role filter
        if (role && role !== 'All') {
            queryParams.push(role);
            conditions.push(`role = $${queryParams.length}`);
        }
        
        // Add department filter
        if (department && department !== 'All') {
            queryParams.push(department);
            conditions.push(`department = $${queryParams.length}`);
        }
        
        // Append WHERE clause if filters exist
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Add pagination
        queryParams.push(limit);
        queryParams.push(offset);
        query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const result = await pool.query(query, queryParams);

        // Count total with same filters
        let countQuery = 'SELECT COUNT(*) FROM users';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
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
            'SELECT id, reg_id, name, email, role, department, semester, program_year, section FROM users WHERE id = $1',
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
    const { reg_id, name, email, password, role = 'Student', department = 'CS', semester, program_year, section } = req.body;

        if (!reg_id || !name || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const { ROLES: validRoles, DEPARTMENTS: validDepartments } = require('../config/constants');
        let semesterValue = null;
        let programYearValue = null;
        
        if (role === 'Student') {
            const sem = parseInt(semester, 10);
            if (sem >= 1 && sem <= 8) {
                semesterValue = sem;
            }
        } else if (role === 'PM') {
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
            'INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, section) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, reg_id, name, email, role, department, semester, program_year, section',
            [reg_id, name, email, hashedPassword, role, department, semesterValue, programYearValue, section || null]
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
        const { reg_id, name, email, password, role, department, semester, program_year, section } = req.body;
        let semesterValue = null;
        let programYearValue = null;
        
        if (role === 'Student') {
            const sem = parseInt(semester, 10);
            if (sem >= 1 && sem <= 8) {
                semesterValue = sem;
            }
        } else if (role === 'PM') {
            const py = parseInt(program_year, 10);
            if (!(py >= 1 && py <= 4)) {
                return res.status(400).json({ message: 'Program year must be between 1 and 4 for PM role' });
            }
            programYearValue = py;
        }

        const { ROLES: validRoles, DEPARTMENTS: validDepartments } = require('../config/constants');
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        if (!validDepartments.includes(department)) {
            return res.status(400).json({ message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` });
        }

        const userExists = await pool.query(
            'SELECT role FROM users WHERE id = $1',
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
                'UPDATE users SET reg_id = $1, name = $2, email = $3, role = $4, department = $5, semester = $6, program_year = $7, password = $8, section = $9 WHERE id = $10 RETURNING id, reg_id, name, email, role, department, semester, program_year, section',
                [reg_id, name, email, role, department, semesterValue, programYearValue, hashedPassword, section || null, id]
            );
            return res.json(result.rows[0]);
        }

        const result = await pool.query(
            'UPDATE users SET reg_id = $1, name = $2, email = $3, role = $4, department = $5, semester = $6, program_year = $7, section = $8 WHERE id = $9 RETURNING id, reg_id, name, email, role, department, semester, program_year, section',
            [reg_id, name, email, role, department, semesterValue, programYearValue, section || null, id]
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
            'SELECT role FROM users WHERE id = $1',
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

        // Delete from all tables with foreign key references to users
        // Order matters due to dependencies

        // Get assignments created by user to delete submissions first
        const userAssignments = await client.query(
            'SELECT id FROM assignments WHERE created_by = $1',
            [id]
        );
        if (userAssignments.rows.length > 0) {
            const assignmentIds = userAssignments.rows.map(a => a.id);
            await client.query('DELETE FROM submissions WHERE assignment_id = ANY($1::int[])', [assignmentIds]);
        }

        // Delete assignments created by user
        await client.query('DELETE FROM assignments WHERE created_by = $1', [id]);

        // Delete user's submissions as student
        await client.query('DELETE FROM submissions WHERE student_id = $1', [id]);

        // Delete enrollments
        await client.query('DELETE FROM enrollments WHERE student_id = $1', [id]);
        await client.query('UPDATE enrollments SET enrolled_by = NULL WHERE enrolled_by = $1', [id]);

        // Delete anonymous feedback
        await client.query('DELETE FROM anonymous_feedback WHERE sender_id = $1 OR receiver_id = $1', [id]);

        // Delete notifications
        await client.query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [id]);

        // Update courses (set teacher to null)
        await client.query('UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1', [id]);

        // Handle course requests
        await client.query('UPDATE course_requests SET teacher_id = NULL WHERE teacher_id = $1', [id]);
        await client.query('UPDATE course_requests SET requested_by = NULL WHERE requested_by = $1', [id]);

        // Delete reports (need to handle messages first if they reference user)
        await client.query('DELETE FROM reports WHERE reporter_id = $1', [id]);

        // Delete messages
        await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);

        // Handle marketplace
        const marketplaceItems = await client.query(
            'SELECT id FROM marketplace_items WHERE seller_id = $1',
            [id]
        );
        
        if (marketplaceItems.rows.length > 0) {
            const itemIds = marketplaceItems.rows.map(item => item.id);
            await client.query('DELETE FROM transactions WHERE item_id = ANY($1::int[])', [itemIds]);
        }
        
        await client.query('DELETE FROM transactions WHERE buyer_id = $1', [id]);
        await client.query('DELETE FROM marketplace_items WHERE seller_id = $1', [id]);

        // Finally delete the user
        const result = await client.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        await client.query('COMMIT');
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete user error:', err);
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
            `SELECT id, reg_id, name, email, department, role 
             FROM users 
             WHERE role IN ('Teacher','HOD','PM') 
             ORDER BY name`
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
            'SELECT id, reg_id, name, email, role, department FROM users WHERE id = $1 AND role = $2',
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
                "SELECT id, reg_id, email, password FROM users WHERE password IS NULL OR password NOT LIKE '$2%'");

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
                    'UPDATE users SET password = $1 WHERE id = $2',
                    [hashed, u.id]
                );

                updated.push({ id: u.id, reg_id: u.reg_id, email: u.email, tempPassword });
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
