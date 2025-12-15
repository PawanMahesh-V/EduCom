const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user role
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const userRole = userResult.rows[0]?.role;

        // For teachers/HODs/PMs, separate anonymous messages into a special conversation
        const isTeacher = ['Teacher', 'HOD', 'PM'].includes(userRole);

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
                false as is_anonymous
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
                    m.content as last_message
                FROM messages m
                JOIN users u ON u.id = CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_id
                    ELSE m.sender_id
                END
                WHERE m.community_id IS NULL 
                  AND (m.sender_id = $1 OR m.receiver_id = $1)
                  AND (m.is_anonymous = false OR m.sender_id = $1)
                ORDER BY other_user_id, m.created_at DESC
            ) conversations
            ORDER BY last_message_time DESC`,
            [userId]
        );

        let allConversations = regularConversations.rows;

        // For teachers, add a special "Anonymous Students" conversation if they have anonymous messages
        if (isTeacher) {
            const anonymousMessages = await pool.query(
                `SELECT 
                    COUNT(*)::integer as unread_count,
                    MAX(created_at) as last_message_time,
                    (SELECT content FROM messages 
                     WHERE community_id IS NULL 
                       AND receiver_id = $1 
                       AND is_anonymous = true 
                     ORDER BY created_at DESC LIMIT 1) as last_message
                FROM messages
                WHERE community_id IS NULL
                  AND receiver_id = $1
                  AND is_anonymous = true
                  AND is_read = false`,
                [userId]
            );

            const anonymousData = anonymousMessages.rows[0];
            
            // Check if there are any anonymous messages (sent or received)
            const hasAnonymous = await pool.query(
                `SELECT EXISTS(
                    SELECT 1 FROM messages 
                    WHERE community_id IS NULL 
                      AND receiver_id = $1 
                      AND is_anonymous = true
                ) as has_messages`,
                [userId]
            );

            if (hasAnonymous.rows[0].has_messages) {
                allConversations.unshift({
                    user_id: 'anonymous',
                    user_name: 'Anonymous Students',
                    user_email: null,
                    user_role: 'Student',
                    last_message_time: anonymousData.last_message_time,
                    unread_count: anonymousData.unread_count || 0,
                    last_message: anonymousData.last_message || 'Anonymous message',
                    is_anonymous: true
                });
            }
        }

        res.json(allConversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between two users
router.get('/messages/:userId/:otherUserId', auth, async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        const { limit = 50 } = req.query;

        // Special handling for anonymous conversation
        if (otherUserId === 'anonymous') {
            const result = await pool.query(
                `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                        (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') as created_at,
                        'Anonymous Student' as sender_name
                 FROM messages m
                 WHERE m.community_id IS NULL
                   AND m.receiver_id = $1
                   AND m.is_anonymous = true
                 ORDER BY m.created_at ASC
                 LIMIT $2`,
                [userId, limit]
            );

            // Mark anonymous messages as read
            await pool.query(
                `UPDATE messages 
                 SET is_read = TRUE 
                 WHERE community_id IS NULL 
                   AND receiver_id = $1 
                   AND is_anonymous = true
                   AND is_read = FALSE`,
                [userId]
            );

            return res.json(result.rows);
        }

        // Regular conversation - exclude anonymous messages only for teachers viewing them
        const result = await pool.query(
            `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                    (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') as created_at,
                    u.name as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.community_id IS NULL
               AND ((m.sender_id = $1 AND m.receiver_id = $2)
                 OR (m.sender_id = $2 AND m.receiver_id = $1))
               AND (
                 m.is_anonymous = false 
                 OR m.sender_id = $1
               )
             ORDER BY m.created_at ASC
             LIMIT $3`,
            [userId, otherUserId, limit]
        );

        // Mark messages as read
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE community_id IS NULL 
               AND receiver_id = $1 
               AND sender_id = $2 
               AND is_read = FALSE`,
            [userId, otherUserId]
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
