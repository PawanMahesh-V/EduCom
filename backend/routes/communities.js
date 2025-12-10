const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT c.*, 
                    co.code as course_code,
                    co.name as course_name,
                    co.department
             FROM communities c 
             LEFT JOIN courses co ON c.course_id = co.id`;
        const queryParams = [];
        const conditions = [];
        
        // Add status filter
        if (status && status !== 'All') {
            queryParams.push(status);
            conditions.push(`c.status = $${queryParams.length}`);
        }
        
        // Append WHERE clause if filters exist
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Add ordering and pagination
        queryParams.push(limit);
        queryParams.push(offset);
        query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const result = await pool.query(query, queryParams);

        // Count total with same filters
        let countQuery = 'SELECT COUNT(*) FROM communities c';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
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

// Get communities for a student (based on enrolled courses)
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        const result = await pool.query(
            `SELECT DISTINCT c.id, c.course_id, c.name, c.join_code, c.status, c.created_at, 
                    co.name as course_name, co.code as course_code,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id = c.id 
                           AND sender_id != $1 
                           AND is_read = FALSE),
                        0
                    ) as unread_count
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             JOIN enrollments e ON co.id = e.course_id
             WHERE e.student_id = $1 AND c.status = 'active'
             ORDER BY c.created_at DESC`,
            [studentId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get communities for a teacher (based on courses they teach)
router.get('/teacher/:teacherId', auth, async (req, res) => {
    try {
        const { teacherId } = req.params;

        const result = await pool.query(
            `SELECT DISTINCT c.id, c.course_id, c.name, c.join_code, c.status, c.created_at, 
                    co.name as course_name, co.code as course_code,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id = c.id 
                           AND sender_id != $1 
                           AND is_read = FALSE),
                        0
                    ) as unread_count
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             WHERE co.teacher_id = $1 AND c.status = 'active'
             ORDER BY c.created_at DESC`,
            [teacherId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT c.*, 
                    co.code as course_code,
                    co.name as course_name,
                    co.department
             FROM communities c 
             LEFT JOIN courses co ON c.course_id = co.id 
             WHERE c.id = $1`,
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

// Generate random join code
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

router.post('/', auth, async (req, res) => {
    try {
        const { id, name, status = 'active' } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Community name is required' });
        }

        const joinCode = generateJoinCode();

        const result = await pool.query(
            `INSERT INTO communities (id, name, join_code, status) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [id || null, name, joinCode, status]
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
             WHERE id = $3 
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
            'DELETE FROM communities WHERE id = $1 RETURNING id',
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
            `SELECT u.id, u.username, u.name, u.email
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             JOIN enrollments e ON co.id = e.course_id
             JOIN users u ON e.student_id = u.id
             WHERE c.id = $1
             ORDER BY u.name`,
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

// Get messages for a community
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, userId } = req.query;

        const result = await pool.query(
            `SELECT m.id, m.community_id, m.sender_id, m.content, m.is_anonymous, m.status, 
                    (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') as created_at,
                    u.name as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.community_id = $1
             ORDER BY m.created_at ASC
             LIMIT $2`,
            [id, limit]
        );

        // Mark messages as read for this user
        if (userId) {
            await pool.query(
                `UPDATE messages 
                 SET is_read = TRUE 
                 WHERE community_id = $1 
                   AND sender_id != $2 
                   AND is_read = FALSE`,
                [id, userId]
            );
        }

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Join community by code
router.post('/join', auth, async (req, res) => {
    try {
        const { joinCode, studentId } = req.body;

        if (!joinCode || !studentId) {
            return res.status(400).json({ message: 'Join code and student ID are required' });
        }

        // Find community by join code
        const communityResult = await pool.query(
            `SELECT c.*, co.id as course_id, co.name as course_name, co.code as course_code, co.department, co.semester
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             WHERE c.join_code = $1 AND c.status = 'active'`,
            [joinCode.toUpperCase()]
        );

        if (communityResult.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid join code or community not found' });
        }

        const community = communityResult.rows[0];

        // Check if student is already enrolled in this course
        const enrollmentCheck = await pool.query(
            'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [studentId, community.course_id]
        );

        if (enrollmentCheck.rows.length > 0) {
            return res.status(400).json({ message: 'You are already a member of this community' });
        }

        // Verify student department matches course department
        const studentResult = await pool.query(
            'SELECT department FROM users WHERE id = $1',
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (studentResult.rows[0].department !== community.department) {
            return res.status(403).json({ 
                message: `This community is for ${community.department} department students only` 
            });
        }

        // Enroll student in the course
        await pool.query(
            'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)',
            [studentId, community.course_id]
        );

        res.json({ 
            message: 'Successfully joined community!',
            community: {
                id: community.id,
                name: community.name,
                course_name: community.course_name,
                course_code: community.course_code
            }
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'You are already a member of this community' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
