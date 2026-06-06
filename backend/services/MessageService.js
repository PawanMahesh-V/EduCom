const pool = require('../config/database');

class MessageService {
    static async isUserChatBanned(userId) {
        const userCheck = await pool.query('SELECT is_active FROM users WHERE id = $1', [userId]);
        return userCheck.rows.length > 0 && userCheck.rows[0].is_active === false;
    }

    static async getUserRole(userId) {
        const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        return result.rows.length > 0 ? result.rows[0].role : null;
    }

    static async isCommunityInactive(communityId) {
        const statusCheck = await pool.query('SELECT status FROM communities WHERE id = $1', [communityId]);
        return statusCheck.rows.length > 0 && statusCheck.rows[0].status === 'inactive';
    }

    static async saveCommunityMessage(communityId, senderId, content, status) {
        const result = await pool.query(
            `INSERT INTO messages (community_id, sender_id, content, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id, community_id, sender_id, content, status, created_at`,
            [communityId, senderId, content, status]
        );
        return result.rows[0];
    }

    static async getCommunityDetails(communityId) {
        const result = await pool.query(
            `SELECT c.name, co.name as course_name, co.code as course_code, co.id as course_id
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             WHERE c.id = $1`,
            [communityId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    static async getCommunityNotificationRecipients(communityId, senderId) {
        const enrolledStudents = await pool.query(
            `SELECT DISTINCT e.student_id as user_id
             FROM enrollments e
             JOIN communities c ON e.course_id = c.course_id
             WHERE c.id = $1 AND e.student_id != $2`,
            [communityId, senderId]
        );
        const courseTeacher = await pool.query(
            `SELECT teacher_id as user_id
             FROM courses
             WHERE id = (SELECT course_id FROM communities WHERE id = $1)
             AND teacher_id IS NOT NULL
             AND teacher_id != $2`,
            [communityId, senderId]
        );

        return [
            ...enrolledStudents.rows,
            ...courseTeacher.rows
        ].filter(r => r.user_id);
    }

    static async createNotification(userId, senderId, title, message, courseId) {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, sender_id, title, message, type, is_read, course_id)
             VALUES ($1, $2, $3, $4, 'info', false, $5)
             RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
            [userId, senderId, title, message, courseId]
        );
        return result.rows[0];
    }

    static async deleteMessage(messageId) {
        await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
    }

    static async saveDirectMessage(senderId, receiverId, content, isAnonymous, status) {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content, is_read, is_anonymous, community_id, status)
             VALUES ($1, $2, $3, false, $4, NULL, $5)
             RETURNING id, sender_id, receiver_id, content, is_read, is_anonymous, created_at, delivered_at, read_at, status`,
            [senderId, receiverId, content, isAnonymous, status]
        );
        return result.rows[0];
    }

    static async markMessageDelivered(messageId) {
        const result = await pool.query(
            `UPDATE messages 
             SET delivered_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND delivered_at IS NULL
             RETURNING id, sender_id, delivered_at`,
            [messageId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    static async markMessageRead(messageId, receiverId) {
        const result = await pool.query(
            `UPDATE messages 
             SET is_read = true, read_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND receiver_id = $2 AND is_read = false
             RETURNING id, sender_id, read_at`,
            [messageId, receiverId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    static async markMultipleMessagesRead(messageIds, receiverId) {
        if (!messageIds || messageIds.length === 0) return [];
        const result = await pool.query(
            `UPDATE messages 
             SET is_read = true, read_at = CURRENT_TIMESTAMP 
             WHERE id = ANY($1) AND receiver_id = $2 AND is_read = false
             RETURNING id, sender_id, read_at`,
            [messageIds, receiverId]
        );
        return result.rows;
    }
}

module.exports = MessageService;
