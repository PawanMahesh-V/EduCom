const pool = require('../config/database');

class Message {
    static async getRecentConversations(userId, isTeacher = false) {
        // Get regular (non-anonymous) conversations
        const query = `
            SELECT 
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
            ORDER BY last_message_time DESC
        `;
        const result = await pool.query(query, [userId]);
        let allConversations = result.rows;

        // For teachers, check for anonymous messages
        if (isTeacher) {
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
                const anonymousData = await pool.query(
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
                const data = anonymousData.rows[0];

                allConversations.unshift({
                    user_id: 'anonymous',
                    user_name: 'Anonymous Students',
                    user_email: null,
                    user_role: 'Student',
                    last_message_time: data.last_message_time || new Date(), // Fallback if no unread
                    unread_count: data.unread_count || 0,
                    last_message: data.last_message || 'Anonymous stats',
                    is_anonymous: true
                });
            }
        }
        return allConversations;
    }

    static async getDirectMessages(userId, otherUserId, limit = 50) {
        // Regular conversation
        // Mark messages as read happens in controller or separate methods
        const query = `
            SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                    m.created_at,
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
             LIMIT $3
        `;
        const result = await pool.query(query, [userId, otherUserId, limit]);
        return result.rows;
    }

    static async getAnonymousMessages(teacherId, limit = 50) {
        const query = `
             SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                    m.created_at,
                    'Anonymous Student' as sender_name
             FROM messages m
             WHERE m.community_id IS NULL
               AND m.receiver_id = $1
               AND m.is_anonymous = true
             ORDER BY m.created_at ASC
             LIMIT $2
        `;
        const result = await pool.query(query, [teacherId, limit]);
        return result.rows;
    }

    static async markDirectMessagesRead(userId, otherUserId) {
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE community_id IS NULL 
               AND receiver_id = $1 
               AND sender_id = $2 
               AND is_read = FALSE`,
            [userId, otherUserId]
        );
    }

    static async markAnonymousMessagesRead(teacherId) {
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE community_id IS NULL 
               AND receiver_id = $1 
               AND is_anonymous = true
               AND is_read = FALSE`,
            [teacherId]
        );
    }

    static async searchDirectMessages(userId, otherUserId, searchTerm) {
        const query = `
             SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                    m.created_at,
                    u.name as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.community_id IS NULL
               AND ((m.sender_id = $1 AND m.receiver_id = $2)
                 OR (m.sender_id = $2 AND m.receiver_id = $1))
               AND (m.is_anonymous = false OR m.sender_id = $1)
               AND LOWER(m.content) LIKE $3
             ORDER BY m.created_at DESC
             LIMIT 50
        `;
        const result = await pool.query(query, [userId, otherUserId, searchTerm]);
        return result.rows;
    }

    static async searchAnonymousMessages(teacherId, searchTerm) {
        const query = `
             SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_anonymous,
                    m.created_at,
                    'Anonymous Student' as sender_name
             FROM messages m
             WHERE m.community_id IS NULL
               AND m.receiver_id = $1
               AND m.is_anonymous = true
               AND LOWER(m.content) LIKE $2
             ORDER BY m.created_at DESC
             LIMIT 50
        `;
        const result = await pool.query(query, [teacherId, searchTerm]);
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT id, sender_id, content FROM messages WHERE id = $1 AND community_id IS NULL`,
            [id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    }

    static async deleteMultiple(messageIds, userId) {
        const result = await pool.query(
            `DELETE FROM messages 
             WHERE id = ANY($1) 
               AND sender_id = $2
               AND community_id IS NULL
             RETURNING id`,
            [messageIds, userId]
        );
        return result;
    }
}

module.exports = Message;
