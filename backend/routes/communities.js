const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const CommunityController = require('../controllers/CommunityController');

// Get all communities
router.get('/', auth, CommunityController.getAllCommunities);

// Get communities for a student
router.get('/student/:studentId', auth, CommunityController.getStudentCommunities);

// Get communities for a teacher
router.get('/teacher/:teacherId', auth, CommunityController.getTeacherCommunities);

// Get communities for a HOD
router.get('/hod/:hodId', auth, CommunityController.getHODCommunities);

// Get community by ID
router.get('/:id', auth, CommunityController.getCommunityById);

// Create new community
router.post('/', auth, validate(['name']), CommunityController.createCommunity);

// Update community
router.put('/:id', auth, validate(['name']), CommunityController.updateCommunity);

// Delete community
router.delete('/:id', auth, CommunityController.deleteCommunity);

// Get community members
router.get('/:id/members', auth, CommunityController.getMembers);

// Get community messages
router.get('/:id/messages', auth, CommunityController.getMessages);

// Join community
router.post('/join', auth, validate(['joinCode', 'studentId']), CommunityController.joinCommunity);

// Leave community
router.post('/:id/leave', auth, CommunityController.leaveCommunity);

// Delete message
router.delete('/:communityId/messages/:messageId', auth, CommunityController.deleteMessage);

// Delete multiple messages
router.post('/:communityId/messages/delete-multiple', auth, validate(['messageIds']), CommunityController.deleteMultipleMessages);

module.exports = router;
