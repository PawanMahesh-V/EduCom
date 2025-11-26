const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/admin/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const usersResult = await pool.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(usersResult.rows[0].count);
        const rolesResult = await pool.query(
            `SELECT role, COUNT(*) as count FROM users 
             GROUP BY role 
             ORDER BY role`
        );
        const coursesResult = await pool.query('SELECT COUNT(*) FROM courses');
        const totalCourses = parseInt(coursesResult.rows[0].count);
        const communitiesResult = await pool.query('SELECT COUNT(*) FROM communities');
        const totalCommunities = parseInt(communitiesResult.rows[0].count);
        const marketplaceResult = await pool.query('SELECT COUNT(*) FROM marketplace_items');
        const totalMarketplaceItems = parseInt(marketplaceResult.rows[0].count);
        const pendingItemsResult = await pool.query(
            "SELECT COUNT(*) FROM marketplace_items WHERE status = 'pending'"
        );
        const pendingMarketplaceItems = parseInt(pendingItemsResult.rows[0].count);
        const recentUsersResult = await pool.query(
            `SELECT id, reg_id, name, email, role, department, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 5`
        );
        const recentCoursesResult = await pool.query(
            `SELECT c.id, c.code, c.name, c.department, 
                    u.name as teacher_name, c.created_at
             FROM courses c
             LEFT JOIN users u ON c.teacher_id = u.id
             ORDER BY c.created_at DESC
             LIMIT 5`
        );
        const enrollmentResult = await pool.query('SELECT COUNT(*) FROM enrollments');
        const totalEnrollments = parseInt(enrollmentResult.rows[0].count);
        const reportsResult = await pool.query(
            "SELECT COUNT(*) FROM reports WHERE status = 'Pending'"
        );
        const pendingReports = parseInt(reportsResult.rows[0].count);
        const usersByRole = {};
        rolesResult.rows.forEach(row => {
            usersByRole[row.role] = parseInt(row.count);
        });
        const stats = {
            totalUsers,
            totalCourses,
            totalCommunities,
            totalEnrollments,
            totalMarketplaceItems,
            pendingMarketplaceItems,
            pendingReports,
            usersByRole,
            recentUsers: recentUsersResult.rows,
            recentCourses: recentCoursesResult.rows,
            averageEnrollmentsPerCourse: totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(2) : 0
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ 
            message: 'Server error while fetching dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});
router.get('/admin/activity', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { days = 7 } = req.query;
        const userActivityResult = await pool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM users
             WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
             GROUP BY DATE(created_at)
             ORDER BY date ASC`
        );

        res.json({
            userActivity: userActivityResult.rows
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Server error while fetching activity data',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;

