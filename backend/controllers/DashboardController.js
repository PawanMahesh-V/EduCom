const pool = require('../config/database');
const User = require('../models/User');
const Course = require('../models/Course');
const Community = require('../models/Community');

class DashboardController {
    static async getAdminStats(req, res, next) {
        try {
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }

            // Parallel execution for performance
            const [
                usersResult,
                rolesResult,
                coursesResult,
                communitiesResult,
                marketplaceResult,
                pendingItemsResult,
                recentUsersResult,
                recentCoursesResult,
                enrollmentResult,
                reportsResult,
                trendingCommunitiesResult,
                pendingMarketplacePreviewResult,
                blockedUsersResult,
                totalMessagesResult,
                departmentDistributionResult
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM users'),
                pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role'),
                pool.query('SELECT COUNT(*) FROM courses'),
                pool.query('SELECT COUNT(*) FROM communities'),
                pool.query('SELECT COUNT(*) FROM marketplace_items'),
                pool.query("SELECT COUNT(*) FROM marketplace_items WHERE status = 'pending'"),
                pool.query(`SELECT id, reg_id, name, email, role, department, created_at 
                            FROM users ORDER BY created_at DESC LIMIT 5`),
                pool.query(`SELECT c.id, c.code, c.name, c.department, 
                                   u.name as teacher_name, c.created_at
                            FROM courses c
                            LEFT JOIN users u ON c.teacher_id = u.id
                            ORDER BY c.created_at DESC LIMIT 5`),
                pool.query('SELECT COUNT(*) FROM enrollments'),
                pool.query("SELECT COUNT(*) FROM messages WHERE status = 'pending_review'"),
                pool.query(`SELECT c.id, c.name, COUNT(m.id) as activity_count 
                            FROM communities c 
                            LEFT JOIN messages m ON c.id = m.community_id 
                            GROUP BY c.id ORDER BY activity_count DESC LIMIT 3`),
                pool.query(`SELECT id, title, price, created_at 
                            FROM marketplace_items 
                            WHERE status = 'pending' 
                            ORDER BY created_at ASC LIMIT 3`),
                pool.query('SELECT COUNT(*) FROM users WHERE is_active = false'),
                pool.query('SELECT COUNT(*) FROM messages'),
                pool.query(`SELECT department, COUNT(*) as count 
                            FROM users 
                            WHERE department IS NOT NULL AND role != 'Admin'
                            GROUP BY department ORDER BY count DESC`)
            ]);

            const totalUsers = parseInt(usersResult.rows[0].count);
            const totalCourses = parseInt(coursesResult.rows[0].count);
            const totalCommunities = parseInt(communitiesResult.rows[0].count);
            const totalEnrollments = parseInt(enrollmentResult.rows[0].count);

            const usersByRole = {};
            rolesResult.rows.forEach(row => {
                usersByRole[row.role] = parseInt(row.count);
            });

            const stats = {
                totalUsers,
                totalCourses,
                totalCommunities,
                totalEnrollments,
                totalMarketplaceItems: parseInt(marketplaceResult.rows[0].count),
                pendingMarketplaceItems: parseInt(pendingItemsResult.rows[0].count),
                pendingReports: parseInt(reportsResult.rows[0].count),
                totalBlockedUsers: parseInt(blockedUsersResult.rows[0].count),
                totalMessages: parseInt(totalMessagesResult.rows[0].count),
                departmentDistribution: departmentDistributionResult.rows,
                usersByRole,
                recentUsers: recentUsersResult.rows,
                recentCourses: recentCoursesResult.rows,
                trendingCommunities: trendingCommunitiesResult.rows,
                pendingMarketplacePreview: pendingMarketplacePreviewResult.rows,
                averageEnrollmentsPerCourse: totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(2) : 0
            };

            res.json(stats);
        } catch (err) {
            next(err);
        }
    }

    static async getActivityStats(req, res, next) {
        try {
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }

            const { days = 7 } = req.query;
            const userActivityResult = await pool.query(
                `SELECT DATE(created_at) as date, COUNT(*) as count
                 FROM messages
                 WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
                 GROUP BY DATE(created_at)
                 ORDER BY date ASC`
            );

            res.json({
                userActivity: userActivityResult.rows
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DashboardController;
