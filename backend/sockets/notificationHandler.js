const pool = require('../config/database');

module.exports = (io, socket, connectedUsers) => {

    // Send notification
    socket.on('send-notification', async (data) => {
        const { userId, title, message, type, senderId } = data;

        try {
            // Save notification to database
            const result = await pool.query(
                `INSERT INTO notifications (user_id, sender_id, title, message, type, is_read)
                 VALUES ($1, $2, $3, $4, $5, false)
                 RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                [userId, senderId, title, message, type]
            );

            const notification = result.rows[0];

            // Send to specific user if online
            const targetSocketId = connectedUsers.get(userId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new-notification', notification);
            }
        } catch (error) {
            console.error('Send notification error:', error);
        }
    });

    // Broadcast notification to role
    socket.on('broadcast-notification', async (data) => {
        const { role, title, message, type, senderId } = data;

        try {
            // Get all users with the specified role
            const users = await pool.query(
                'SELECT id FROM users WHERE role = $1',
                [role]
            );

            // Insert notifications for all users
            const insertPromises = users.rows.map(user =>
                pool.query(
                    `INSERT INTO notifications (user_id, sender_id, title, message, type, target_role, is_read)
                     VALUES ($1, $2, $3, $4, $5, $6, false)
                     RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                    [user.id, senderId, title, message, type, role]
                )
            );

            const results = await Promise.all(insertPromises);

            // Broadcast to all connected users with that role
            results.forEach(result => {
                const notification = result.rows[0];
                const targetSocketId = connectedUsers.get(notification.user_id);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('new-notification', notification);
                }
            });
        } catch (error) {
            console.error('Broadcast notification error:', error);
        }
    });
};
