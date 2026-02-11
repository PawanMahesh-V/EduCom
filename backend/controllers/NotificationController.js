const Notification = require('../models/Notification');

class NotificationController {
    static async getUserNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const { limit = 50 } = req.query;
            const notifications = await Notification.findAllByUser(userId, limit);
            res.json({ notifications });
        } catch (err) {
            next(err);
        }
    }

    static async markRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const notification = await Notification.markAsRead(id, userId);

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            res.json(notification);
        } catch (err) {
            next(err);
        }
    }

    static async markAllRead(req, res, next) {
        try {
            const userId = req.user.userId;
            await Notification.markAllAsRead(userId);
            res.json({ message: 'All notifications marked as read' });
        } catch (err) {
            next(err);
        }
    }

    static async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const deleted = await Notification.delete(id, userId);

            if (!deleted) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            res.json({ message: 'Notification deleted successfully' });
        } catch (err) {
            next(err);
        }
    }

    // Admin only
    static async createNotification(req, res, next) {
        try {
            const { id, title, message, type } = req.body;
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Note: Current logic assumes explicit ID from client? 
            // If client sends ID, use it. If not, don't pass it to SQL is better.
            // But model supports it.
            const notification = await Notification.create({ id, title, message, type });
            res.status(201).json(notification);
        } catch (err) {
            next(err);
        }
    }

    static async broadcastNotification(req, res, next) {
        try {
            const { title, message, type, role_filter } = req.body;

            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const users = await Notification.getUsersByRole(role_filter);
            await Notification.broadcast(users, { title, message, type });

            res.status(201).json({
                message: 'Notifications sent successfully',
                count: users.length
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = NotificationController;
