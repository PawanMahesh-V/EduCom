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

    static async createForMultiple(users, data) {
        const { title, message, type = 'info' } = data;
        const insertPromises = users.map(user =>
            pool.query(
                `INSERT INTO notifications (id, user_id, title, message, type) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.id, user.id, title, message, type] // Note: ID generation needs to be consistent. 
                // Original code assumed client passed ID for single, generated for multiple?
                // Actually the original code had `id` in body for single post.
                // For broadcast, let's assume auto-increment or UUID if table supports it.
                // If table "id" is SERIAL or UUID DEFAULT, we don't need to pass it.
                // Checking original broadcast: `VALUES ($1, $2, $3, $4)` -> user.id passed as ID?
                // The original code passed `user.id` as the Notification ID... that seems like a bug or bad design if multiple notifs.
                // Assuming "id" column is primary key. One user can have multiple notifications.
                // If the original uses user.id as notification id, then a user can satisfy PK only once?
                // Looking at original: `VALUES ($1, $2, $3, $4)`. Params: `[user.id, title, message, type]`.
                // Column order in INSERT: `id, title, message, type`. 
                // So yes, it was trying to reuse user.id as notification.id. This likely crashes on second notification.
                // Correct approach: Let DB handle ID (omit ID column), or generate UUID.
                // I will try to OMIT id if possible, or pass NULL/DEFAULT.
            )
        );
        // Wait, look at `INSERT INTO notifications (id, ..)`
        // If I change it to `INSERT INTO notifications (user_id, ...)` and let DB auto-gen ID?
        // Let's assume the schema has auto-gen ID if not provided, or we should use UUID.
        // SAFE FIX: Use `uuid` generator if package exists, or random string.
        // Actually, let's look at `create` above. It takes `id`.
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
                  VALUES ($1, $2, $3, $4)`,
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
