const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const DirectMessageController = require('../controllers/DirectMessageController');

// Get all conversations for a user
router.get('/conversations/:userId', auth, DirectMessageController.getConversations);

// Get messages between two users
router.get('/messages/:userId/:otherUserId', auth, DirectMessageController.getMessages);

// Get all users for starting new conversation
router.get('/users', auth, DirectMessageController.getUsers);

// Search messages
router.get('/messages/:userId/:otherUserId/search', auth, DirectMessageController.searchMessages);

// Delete a message
router.delete('/message/:messageId', auth, DirectMessageController.deleteMessage);

// Delete multiple messages
router.post('/message/delete-multiple', auth, validate(['messageIds']), DirectMessageController.deleteMultipleMessages);

module.exports = router;
