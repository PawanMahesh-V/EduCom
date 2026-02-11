const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DashboardController = require('../controllers/DashboardController');

router.get('/admin/stats', auth, DashboardController.getAdminStats);
router.get('/admin/activity', auth, DashboardController.getActivityStats);

module.exports = router;
