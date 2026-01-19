const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, department, semester } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT c.*, 
                    u.name as teacher_name 
             FROM courses c 
             LEFT JOIN users u ON c.teacher_id = u.id`;
        const queryParams = [];
        const conditions = [];

        // Add department filter
        if (department && department !== 'All') {
            queryParams.push(department);
            conditions.push(`c.department = $${queryParams.length}`);
        }

        // Add semester filter
        if (semester && semester !== 'All') {
            queryParams.push(semester);
            conditions.push(`c.semester = $${queryParams.length}`);
        }

        // Append WHERE clause if filters exist
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Add ordering and pagination
        queryParams.push(limit);
        queryParams.push(offset);
        query += ` ORDER BY c.code LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const result = await pool.query(query, queryParams);

        // Count total with same filters
        let countQuery = 'SELECT COUNT(*) FROM courses c';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
        const totalCourses = parseInt(countResult.rows[0].count);

        res.json({
            courses: result.rows,
            totalCourses,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCourses / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses for a specific student (enrolled courses)
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        const result = await pool.query(
            `SELECT c.*, 
                    u.name as teacher_name,
                    e.enrolled_on
             FROM enrollments e
             JOIN courses c ON e.course_id = c.id
             LEFT JOIN users u ON c.teacher_id = u.id
             WHERE e.student_id = $1
             ORDER BY e.enrolled_on DESC`,
            [studentId]
        );

        res.json({
            courses: result.rows,
            totalCourses: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses for a specific teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
    try {
        const { teacherId } = req.params;

        const result = await pool.query(
            `SELECT c.*, 
                    com.join_code,
                    COUNT(DISTINCT e.student_id) as enrolled_count,
                    'active' as status
             FROM courses c
             LEFT JOIN enrollments e ON c.id = e.course_id
             LEFT JOIN communities com ON c.id = com.course_id
             WHERE c.teacher_id = $1
             GROUP BY c.id, com.join_code
             ORDER BY c.code`,
            [teacherId]
        );

        res.json({
            courses: result.rows,
            totalCourses: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get teacher dashboard stats
router.get('/teacher/:teacherId/stats', auth, async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Get total courses
        const coursesResult = await pool.query(
            'SELECT COUNT(*) FROM courses WHERE teacher_id = $1',
            [teacherId]
        );

        // Get total enrolled students across all courses
        const studentsResult = await pool.query(
            `SELECT COUNT(DISTINCT e.student_id) as total_students
             FROM courses c
             LEFT JOIN enrollments e ON c.id = e.id
             WHERE c.teacher_id = $1`,
            [teacherId]
        );

        res.json({
            totalCourses: parseInt(coursesResult.rows[0].count),
            totalStudents: parseInt(studentsResult.rows[0].total_students || 0),
            activeAssignments: 0, // Placeholder - implement when assignments table is ready
            pendingGrading: 0 // Placeholder - implement when grading table is ready
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT c.*, 
                    u.name as teacher_name 
             FROM courses c 
             LEFT JOIN users u ON c.teacher_id = u.id 
             WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate random join code
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

router.post('/', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const { code, name, department, semester, teacher_id } = req.body;
        if (!code || !name || !department || !semester) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await client.query('BEGIN');

        const courseResult = await client.query(
            `INSERT INTO courses (code, name, department, semester, teacher_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *, 
                (SELECT name FROM users WHERE id = $5) as teacher_name`,
            [code, name, department, semester, teacher_id]
        );

        const newCourse = courseResult.rows[0];

        // Generate unique join code for the community
        const joinCode = generateJoinCode();
        const communityName = `${code} Community`;

        const communityResult = await client.query(
            `INSERT INTO communities (course_id, name, join_code, status) 
             VALUES ($1, $2, $3, 'active')
             RETURNING *`,
            [newCourse.id, communityName, joinCode]
        );

        // Add join_code to the response
        newCourse.join_code = communityResult.rows[0].join_code;

        await client.query('COMMIT');

        // Emit update to admins
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('admin-course-update');
        }

        res.status(201).json(newCourse);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            if (err.constraint === 'courses_code_key') {
                return res.status(400).json({ message: 'Course code already exists' });
            } else if (err.constraint === 'communities_join_code_key') {
                // Retry with a new join code
                return res.status(500).json({ message: 'Join code collision. Please try again.' });
            }
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        client.release();
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, department, semester, teacher_id } = req.body;

        if (!code || !name || !department || !semester) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `UPDATE courses 
             SET code = $1, name = $2, department = $3, 
                 semester = $4, teacher_id = $5
             WHERE id = $6 
             RETURNING *,
                (SELECT name FROM users WHERE id = $5) as teacher_name`,
            [code, name, department, semester, teacher_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Course code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // First, delete messages in communities related to this course
        await client.query(
            `DELETE FROM messages 
             WHERE community_id IN (SELECT id FROM communities WHERE course_id = $1)`,
            [id]
        );

        // Delete communities related to this course
        await client.query(
            'DELETE FROM communities WHERE course_id = $1',
            [id]
        );

        // Delete enrollments for this course
        await client.query(
            'DELETE FROM enrollments WHERE course_id = $1',
            [id]
        );

        // Delete notifications related to this course
        await client.query(
            'DELETE FROM notifications WHERE course_id = $1',
            [id]
        );

        // Now delete the course
        const result = await client.query(
            'DELETE FROM courses WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Course not found' });
        }

        await client.query('COMMIT');

        // Emit update to admins
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('admin-course-update');
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting course:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Get enrolled students for a course
router.get('/:id/enrolled', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT u.id, u.reg_id, u.name, u.email, u.department, u.semester, u.program_year, u.section, e.enrolled_on
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             WHERE e.course_id = $1
             ORDER BY e.enrolled_on DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove students from course
router.post('/:id/remove', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { student_ids } = req.body;

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'student_ids array is required' });
        }

        // Verify course exists
        const courseCheck = await client.query(
            'SELECT id, name FROM courses WHERE id = $1',
            [id]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await client.query('BEGIN');

        // Delete enrollments
        const deleteResult = await client.query(
            `DELETE FROM enrollments 
             WHERE course_id = $1 AND student_id = ANY($2::int[])
             RETURNING id`,
            [id, student_ids]
        );

        const removedCount = deleteResult.rows.length;

        await client.query('COMMIT');

        res.json({
            message: `Successfully removed ${removedCount} student(s) from course`,
            removedCount,
            totalAttempted: student_ids.length
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Assign course to students
router.post('/:id/assign', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { student_ids } = req.body;

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'student_ids array is required' });
        }

        // Verify course exists
        const courseCheck = await client.query(
            'SELECT id, department, name FROM courses WHERE id = $1',
            [id]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const courseDepartment = courseCheck.rows[0].department;

        // Verify all students exist and belong to the same department
        const studentsCheck = await client.query(
            `SELECT id, department, name 
             FROM users 
             WHERE id = ANY($1::int[]) AND role = 'Student'`,
            [student_ids]
        );

        if (studentsCheck.rows.length !== student_ids.length) {
            return res.status(400).json({ message: 'Some student IDs are invalid' });
        }

        // Check department mismatch
        const mismatchedStudents = studentsCheck.rows.filter(
            student => student.department !== courseDepartment
        );

        if (mismatchedStudents.length > 0) {
            const names = mismatchedStudents.map(s => s.name).join(', ');
            return res.status(400).json({
                message: `Department mismatch: ${names} cannot be assigned to ${courseDepartment} course`
            });
        }

        await client.query('BEGIN');

        // Insert enrollments (using ON CONFLICT to avoid duplicates)
        const enrollmentPromises = student_ids.map(student_id =>
            client.query(
                `INSERT INTO enrollments (course_id, student_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT (course_id, student_id) DO NOTHING
                 RETURNING id`,
                [id, student_id]
            )
        );

        const results = await Promise.all(enrollmentPromises);
        const newEnrollments = results.filter(r => r.rows.length > 0).length;

        await client.query('COMMIT');

        const io = req.app.get('io');
        if (io && newEnrollments > 0) {
            const courseName = courseCheck.rows[0].name;
            student_ids.forEach(sid => {
                io.to(`user-${sid}`).emit('user-enrolled', {
                    courseId: id,
                    courseName: courseName
                });
            });
        }

        res.json({
            message: `Successfully assigned course to ${newEnrollments} student(s)`,
            newEnrollments,
            totalAttempted: student_ids.length
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Submit course request
router.post('/request', auth, async (req, res) => {
    try {
        const { code, name, department, semester, teacher_id } = req.body;
        const requested_by = req.user.userId || req.user.id;

        // Check if course code already exists
        const existingCourse = await pool.query(
            'SELECT id FROM courses WHERE code = $1',
            [code]
        );

        if (existingCourse.rows.length > 0) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        // Check if there's already a pending request for this code
        const existingRequest = await pool.query(
            'SELECT id FROM course_requests WHERE code = $1 AND status = $2',
            [code, 'pending']
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ message: 'A request for this course code is already pending' });
        }

        const result = await pool.query(
            `INSERT INTO course_requests (code, name, department, semester, teacher_id, requested_by, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING *`,
            [code, name, department, semester, teacher_id, requested_by]
        );

        res.status(201).json({
            message: 'Course request submitted successfully',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Error submitting course request:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all course requests (admin only)
router.get('/requests/all', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cr.*, 
                    u.name as teacher_name,
                    u.email as teacher_email,
                    req.name as requested_by_name
             FROM course_requests cr
             LEFT JOIN users u ON cr.teacher_id = u.id
             LEFT JOIN users req ON cr.requested_by = req.id
             WHERE cr.status = 'pending'
             ORDER BY cr.created_at DESC`
        );

        res.json({ requests: result.rows });
    } catch (err) {
        console.error('Error fetching course requests:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve course request (admin only)
router.post('/requests/:id/approve', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Get the request details
        const requestResult = await client.query(
            'SELECT * FROM course_requests WHERE id = $1 AND status = $2',
            [id, 'pending']
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        const request = requestResult.rows[0];

        // Create the course
        const courseResult = await client.query(
            `INSERT INTO courses (code, name, department, semester, teacher_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [request.code, request.name, request.department, request.semester, request.teacher_id]
        );

        const newCourse = courseResult.rows[0];

        // Generate unique join code for the community
        const joinCode = generateJoinCode();
        const communityName = `${request.code} Community`;

        const communityResult = await client.query(
            `INSERT INTO communities (course_id, name, join_code, status) 
             VALUES ($1, $2, $3, 'active')
             RETURNING *`,
            [newCourse.id, communityName, joinCode]
        );

        // Add join_code to the response
        newCourse.join_code = communityResult.rows[0].join_code;

        // Update request status
        await client.query(
            'UPDATE course_requests SET status = $1 WHERE id = $2',
            ['approved', id]
        );

        // Send notification to teacher
        await client.query(
            `INSERT INTO notifications (user_id, title, message, type, sender_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                request.teacher_id,
                'Course Request Approved',
                `Your course request for ${request.name} (${request.code}) has been approved! Join code: ${joinCode}`,
                'course_update',
                req.user.userId || req.user.id
            ]
        );

        await client.query('COMMIT');

        // Emit socket event to notify the teacher that their course was approved
        const io = req.app.get('io');
        if (io) {
            // Emit to all connected clients - the frontend will filter by teacher_id
            io.emit('course-approved', {
                course: newCourse,
                teacherId: request.teacher_id
            });
        }

        res.json({
            message: 'Course request approved and course created',
            course: newCourse
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error approving course request:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Reject course request (admin only)
router.post('/requests/:id/reject', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE course_requests SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
            ['rejected', id, 'pending']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        res.json({
            message: 'Course request rejected',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Error rejecting course request:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
