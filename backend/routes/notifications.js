const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const NotificationController = require('../controllers/NotificationController');

// Get user notifications
router.get('/', auth, NotificationController.getUserNotifications);

// Mark single notification as read
router.put('/:id/read', auth, NotificationController.markRead);

// Mark all as read
router.put('/read-all', auth, NotificationController.markAllRead);

// Delete notification
router.delete('/:id', auth, NotificationController.deleteNotification);

// Create notification (Admin)
router.post('/', auth, validate(['title', 'message']), NotificationController.createNotification);

// Broadcast (Admin)
router.post('/broadcast', auth, validate(['title', 'message']), NotificationController.broadcastNotification);

module.exports = router;
