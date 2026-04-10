const pool = require('../config/database');

class ModerationController {
    static async getReportedMessages(req, res, next) {
        try {
            const query = `
                SELECT m.id, m.content, m.created_at, m.status, m.is_anonymous, m.sender_id, m.receiver_id,
                       u.name AS sender_name, u.email as sender_email,
                       ru.name AS receiver_name,
                       c.id as community_id, c.name as community_name
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                LEFT JOIN users ru ON m.receiver_id = ru.id
                LEFT JOIN communities c ON m.community_id = c.id
                WHERE m.status = 'pending_review'
                ORDER BY m.created_at DESC
            `;
            const result = await pool.query(query);
            res.json({ reported_messages: result.rows });
        } catch (err) {
            next(err);
        }
    }

    static async approveMessage(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await pool.query(
                `UPDATE messages SET status = 'approved' WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Message not found' });
            }

            const message = result.rows[0];
            const io = req.app.get('io');
            
            // Get sender name
            const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [message.sender_id]);
            const senderName = message.is_anonymous ? 'Anonymous Student' : (senderResult.rows[0]?.name || 'Unknown User');

            // Broadcast message since it is now approved
            if (message.community_id) {
                io.to(`community-${message.community_id}`).emit('new-message', {
                    ...message,
                    sender_name: senderName
                });
            } else if (message.receiver_id) {
                io.to(`user-${message.receiver_id}`).emit('new-direct-message', {
                    ...message,
                    sender_name: senderName
                });
                io.to(`user-${message.sender_id}`).emit('new-direct-message', {
                    ...message,
                    sender_name: senderName
                });
            }

            io.to('admin-room').emit('reported-message-handled', { messageId: id });
            
            res.json({ message: 'Message approved successfully', data: message });
        } catch(err) {
            next(err);
        }
    }

    static async rejectMessage(req, res, next) {
        try {
            const { id } = req.params;
            const result = await pool.query(
                `UPDATE messages SET status = 'rejected' WHERE id = $1 RETURNING id`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Message not found' });
            }
            
            const io = req.app.get('io');
            io.to('admin-room').emit('reported-message-handled', { messageId: id });

            res.json({ message: 'Message rejected successfully' });
        } catch(err) {
            next(err);
        }
    }

    static async banUserAndRejectMessage(req, res, next) {
        try {
            const { messageId, userId } = req.params;

            // Reject the message
            await pool.query(
                `UPDATE messages SET status = 'rejected' WHERE id = $1`,
                [messageId]
            );

            // Ban the user
            await pool.query(
                `UPDATE users SET is_active = false WHERE id = $1`,
                [userId]
            );

            const io = req.app.get('io');
            io.to('admin-room').emit('reported-message-handled', { messageId });
            io.to('admin-room').emit('admin-user-update'); // Refresh user lists
            
            // Emit chat-banned so they get an alert if they are currently having the app open
            io.to(`user-${userId}`).emit('chat-banned', { message: 'You have been banned from chatting.' });

            res.json({ message: 'User banned from chatting and message rejected successfully' });
        } catch(err) {
            next(err);
        }
    }

    static async getBannedUsers(req, res, next) {
        try {
            const query = `
                SELECT id, name, email, role, department 
                FROM users 
                WHERE is_active = false 
                ORDER BY name ASC
            `;
            const result = await pool.query(query);
            res.json({ banned_users: result.rows });
        } catch (err) {
            next(err);
        }
    }

    static async unbanUser(req, res, next) {
        try {
            const { userId } = req.params;
            await pool.query('UPDATE users SET is_active = true WHERE id = $1', [userId]);

            const io = req.app.get('io');
            io.to('admin-room').emit('admin-user-update');
            io.to(`user-${userId}`).emit('chat-unbanned', { message: 'Your chat privileges have been restored.' });

            res.json({ message: 'User unbanned successfully' });
        } catch(err) {
            next(err);
        }
    }
}

module.exports = ModerationController;
// file touched to trigger nodemon restart
