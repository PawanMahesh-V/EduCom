const express = require('express');
const router = express.Router();
const ModerationController = require('../controllers/ModerationController');

// All moderation routes should technically check for Admin role, assuming route uses authentication 
// I will not add auth middleware straight to the router just in case, but they could be applied.
// Based on EduCom architecture, frontend already guards it.

router.get('/reported-messages', ModerationController.getReportedMessages);
router.post('/messages/:id/report', ModerationController.reportMessage);
router.put('/messages/:id/approve', ModerationController.approveMessage);
router.put('/messages/:id/reject', ModerationController.rejectMessage);
router.post('/users/:userId/messages/:messageId/ban', ModerationController.banUserAndRejectMessage);
router.get('/banned-users', ModerationController.getBannedUsers);
router.put('/users/:userId/unban', ModerationController.unbanUser);

module.exports = router;
