const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT c.*, 
                    co.course_code,
                    co.course_name,
                    co.department
             FROM communities c 
             LEFT JOIN courses co ON c.course_id = co.course_id 
             ORDER BY c.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM communities');
        const totalCommunities = parseInt(countResult.rows[0].count);

        res.json({
            communities: result.rows,
            totalCommunities,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCommunities / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT c.*, 
                    co.course_code,
                    co.course_name,
                    co.department
             FROM communities c 
             LEFT JOIN courses co ON c.course_id = co.course_id 
             WHERE c.community_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { course_id, name, status = 'active' } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Community name is required' });
        }

        const result = await pool.query(
            `INSERT INTO communities (course_id, name, status) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [course_id || null, name, status]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Community already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Community name is required' });
        }

        const result = await pool.query(
            `UPDATE communities 
             SET name = $1, status = $2
             WHERE community_id = $3 
             RETURNING *`,
            [name, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Community name already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM communities WHERE community_id = $1 RETURNING community_id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.json({ message: 'Community deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/members', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT u.user_id, u.username, u.full_name, u.email
             FROM communities c
             JOIN courses co ON c.course_id = co.course_id
             JOIN enrollments e ON co.course_id = e.course_id
             JOIN users u ON e.student_id = u.user_id
             WHERE c.community_id = $1
             ORDER BY u.full_name`,
            [id]
        );

        res.json({
            members: result.rows,
            totalMembers: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
