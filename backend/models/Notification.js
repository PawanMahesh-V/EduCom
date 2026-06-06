const pool = require('../config/database');

class Notification {
    static async findAllByUser(userId, limit = 50) {
        const query = `
            SELECT n.*, u.name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC
            LIMIT $2
        `;
        const result = await pool.query(query, [userId, limit]);
        return result.rows;
    }

    static async markAsRead(id, userId) {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async markAllAsRead(userId) {
        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
    }

    static async markAsReadByCourseId(userId, courseId) {
        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND course_id = $2 AND is_read = false`,
            [userId, courseId]
        );
    }

    static async markAsReadBySenderId(userId, senderId) {
        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND sender_id = $2 AND is_read = false`,
            [userId, senderId]
        );
    }

    static async delete(id, userId) {
        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async create(data) {
        const { id, title, message, type = 'info', user_id, sender_id } = data;
        const result = await pool.query(
            `INSERT INTO notifications (id, user_id, sender_id, title, message, type) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [id || data.notification_id, user_id, sender_id, title, message, type]
        );
        return result.rows[0];
    }

    // Improved broadcast method that doesn't rely on buggy ID assignment
    static async broadcast(users, data) {
        const { title, message, type = 'info' } = data;
        // We'll trust the DB has a default for ID (like UUID or Serial).
        // If not, we should generate one.
        // Original code: `INSERT INTO notifications (id, title, message, type) VALUES ($1...)` with $1=user.id
        // This confirms the bug. I will FIX IT by not inserting ID explicitly if possible.

        const insertPromises = users.map(user =>
            pool.query(
                `INSERT INTO notifications (user_id, title, message, type) 
                  VALUES ($1, $2, $3, $4) RETURNING *`,
                [user.id, title, message, type]
            )
        );
        return Promise.all(insertPromises);
    }

    static async getUsersByRole(role) {
        const query = role ? 'SELECT id FROM users WHERE role = $1' : 'SELECT id FROM users';
        const params = role ? [role] : [];
        const result = await pool.query(query, params);
        return result.rows;
    }
}

module.exports = Notification;
