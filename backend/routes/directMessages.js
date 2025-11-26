const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get regular (non-anonymous) conversations
        const regularConversations = await pool.query(
            `SELECT 
                other_user_id as user_id,
                other_user_name as user_name,
                other_user_email as user_email,
                other_user_role as user_role,
                last_message_time,
                unread_count,
                last_message,
                is_anonymous
            FROM (
                SELECT DISTINCT ON (other_user_id)
                    CASE 
                        WHEN m.sender_id = $1 THEN m.receiver_id
                        ELSE m.sender_id
                    END as other_user_id,
                    u.name as other_user_name,
                    u.email as other_user_email,
                    u.role as other_user_role,
                    m.created_at as last_message_time,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id IS NULL 
                           AND receiver_id = $1 
                           AND sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
                           AND is_anonymous = false
                           AND is_read = FALSE),
                        0
                    ) as unread_count,
                    m.content as last_message,
                    false as is_anonymous
                FROM messages m
                JOIN users u ON u.id = CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_id
                    ELSE m.sender_id
                END
                WHERE m.community_id IS NULL 
                  AND (m.sender_id = $1 OR m.receiver_id = $1)
                  AND m.is_anonymous = false
                ORDER BY other_user_id, m.created_at DESC
            ) conversations
            ORDER BY last_message_time DESC`,
            [userId]
        );

        // Get anonymous conversations
        const anonymousConversations = await pool.query(
            `SELECT 
                other_user_id as user_id,
                'Anonymous' as user_name,
                'anonymous@hidden.com' as user_email,
                'Anonymous' as user_role,
                last_message_time,
                unread_count,
                last_message,
                is_anonymous
            FROM (
                SELECT DISTINCT ON (other_user_id)
                    CASE 
                        WHEN m.sender_id = $1 THEN m.receiver_id
                        ELSE m.sender_id
                    END as other_user_id,
                    m.created_at as last_message_time,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id IS NULL 
                           AND receiver_id = $1 
                           AND sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
                           AND is_anonymous = true
                           AND is_read = FALSE),
                        0
                    ) as unread_count,
                    m.content as last_message,
                    true as is_anonymous
                FROM messages m
                WHERE m.community_id IS NULL 
                  AND (m.sender_id = $1 OR m.receiver_id = $1)
                  AND m.is_anonymous = true
                ORDER BY other_user_id, m.created_at DESC
            ) conversations
            ORDER BY last_message_time DESC`,
            [userId]
        );

        // Combine both results
        const allConversations = [...regularConversations.rows, ...anonymousConversations.rows]
            .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

        res.json(allConversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between two users
router.get('/messages/:userId/:otherUserId', auth, async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        const { limit = 50, isAnonymous } = req.query;

        const isAnon = isAnonymous === 'true';

        const result = await pool.query(
            `SELECT m.*, 
                    u.name as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.community_id IS NULL
               AND ((m.sender_id = $1 AND m.receiver_id = $2)
                 OR (m.sender_id = $2 AND m.receiver_id = $1))
               AND m.is_anonymous = $4
             ORDER BY m.created_at ASC
             LIMIT $3`,
            [userId, otherUserId, limit, isAnon]
        );

        // Mark messages as read
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE community_id IS NULL 
               AND receiver_id = $1 
               AND sender_id = $2 
               AND is_anonymous = $3
               AND is_read = FALSE`,
            [userId, otherUserId, isAnon]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users for starting new conversation
router.get('/users', auth, async (req, res) => {
    try {
        const { exclude } = req.query;

        let query = `SELECT id, name, role, department, email 
                     FROM users 
                     WHERE deleted_at IS NULL`;
        const params = [];

        if (exclude) {
            query += ` AND id != $1`;
            params.push(exclude);
        }

        query += ` ORDER BY name ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
