const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50 } = req.query;

        const result = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({ notifications: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE notification_id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE notification_id = $1 AND user_id = $2
             RETURNING notification_id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { user_id, title, message, type = 'info' } = req.body;

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!user_id || !title || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [user_id, title, message, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/broadcast', auth, async (req, res) => {
    try {
        const { title, message, type = 'info', role_filter } = req.body;

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!title || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let userQuery = 'SELECT user_id FROM users';
        const queryParams = [];
        
        if (role_filter) {
            userQuery += ' WHERE role = $1';
            queryParams.push(role_filter);
        }

        const users = await pool.query(userQuery, queryParams);

        const insertPromises = users.rows.map(user => 
            pool.query(
                `INSERT INTO notifications (user_id, title, message, type) 
                 VALUES ($1, $2, $3, $4)`,
                [user.user_id, title, message, type]
            )
        );

        await Promise.all(insertPromises);

        res.status(201).json({ 
            message: 'Notifications sent successfully',
            count: users.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
