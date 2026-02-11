const Message = require('../models/Message');
const User = require('../models/User');
const { TEACHING_ROLES } = require('../config/constants');
const pool = require('../config/database');

class DirectMessageController {

    static async getConversations(req, res, next) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isTeacher = TEACHING_ROLES.includes(user.role);
            const conversations = await Message.getRecentConversations(userId, isTeacher);
            res.json(conversations);
        } catch (err) {
            next(err);
        }
    }

    static async getMessages(req, res, next) {
        try {
            const { userId, otherUserId } = req.params;
            const { limit = 50 } = req.query;

            // Anonymous conversation
            if (otherUserId === 'anonymous') {
                const messages = await Message.getAnonymousMessages(userId, limit);
                await Message.markAnonymousMessagesRead(userId);
                return res.json(messages);
            }

            // Direct conversation
            const messages = await Message.getDirectMessages(userId, otherUserId, limit);
            await Message.markDirectMessagesRead(userId, otherUserId);

            res.json(messages);
        } catch (err) {
            next(err);
        }
    }

    static async getUsers(req, res, next) {
        try {
            const { exclude } = req.query;
            let query = `SELECT id, name, role, department, email FROM users WHERE deleted_at IS NULL`;
            const params = [];
            if (exclude) {
                query += ` AND id != $1`;
                params.push(exclude);
            }
            query += ` ORDER BY name ASC`;
            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (err) {
            next(err);
        }
    }

    static async searchMessages(req, res, next) {
        try {
            const { userId, otherUserId } = req.params;
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.json([]);
            }

            const searchTerm = `%${q.trim().toLowerCase()}%`;

            if (otherUserId === 'anonymous') {
                const messages = await Message.searchAnonymousMessages(userId, searchTerm);
                return res.json(messages);
            }

            const messages = await Message.searchDirectMessages(userId, otherUserId, searchTerm);
            res.json(messages);
        } catch (err) {
            next(err);
        }
    }

    static async deleteMessage(req, res, next) {
        try {
            const { messageId } = req.params;
            const userId = req.user.userId;

            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }

            if (message.sender_id !== userId) {
                return res.status(403).json({ message: 'You can only delete your own messages' });
            }

            await Message.delete(messageId);
            res.json({ message: 'Message deleted successfully', deletedMessageId: parseInt(messageId) });
        } catch (err) {
            next(err);
        }
    }

    static async deleteMultipleMessages(req, res, next) {
        try {
            const { messageIds } = req.body;
            const userId = req.user.userId;

            const result = await Message.deleteMultiple(messageIds, userId);

            res.json({
                message: 'Messages deleted successfully',
                deletedCount: result.rowCount,
                deletedIds: result.rows.map(r => r.id)
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DirectMessageController;
