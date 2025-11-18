const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT c.*, 
                    u.full_name as teacher_name 
             FROM courses c 
             LEFT JOIN users u ON c.teacher_id = u.user_id 
             ORDER BY c.course_code 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM courses');
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
                    u.full_name as teacher_name,
                    e.enrolled_on
             FROM enrollments e
             JOIN courses c ON e.course_id = c.course_id
             LEFT JOIN users u ON c.teacher_id = u.user_id
             WHERE e.student_id = $1
             ORDER BY e.enrolled_on DESC`,
            [studentId]
        );

        res.json({
            courses: result.rows,
            totalCourses: result.rows.length
        });
    } catch (err) {
        console.error('Error fetching student courses:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses for a specific teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const result = await pool.query(
            `SELECT c.*, 
                    COUNT(DISTINCT e.student_id) as enrolled_count,
                    'active' as status
             FROM courses c
             LEFT JOIN enrollments e ON c.course_id = e.course_id
             WHERE c.teacher_id = $1
             GROUP BY c.course_id
             ORDER BY c.course_code`,
            [teacherId]
        );

        res.json({
            courses: result.rows,
            totalCourses: result.rows.length
        });
    } catch (err) {
        console.error('Error fetching teacher courses:', err);
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
             LEFT JOIN enrollments e ON c.course_id = e.course_id
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
        console.error('Error fetching teacher stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT c.*, 
                    u.full_name as teacher_name 
             FROM courses c 
             LEFT JOIN users u ON c.teacher_id = u.user_id 
             WHERE c.course_id = $1`,
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

router.post('/', auth, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { course_code, course_name, department, semester, teacher_id } = req.body;
        if (!course_code || !course_name || !department || !semester) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await client.query('BEGIN');

        const courseResult = await client.query(
            `INSERT INTO courses (course_code, course_name, department, semester, teacher_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *, 
                (SELECT full_name FROM users WHERE user_id = $5) as teacher_name`,
            [course_code, course_name, department, semester, teacher_id]
        );

        const newCourse = courseResult.rows[0];

        const communityName = `${course_code} Community`;
        await client.query(
            `INSERT INTO communities (course_id, name, status) 
             VALUES ($1, $2, 'active')`,
            [newCourse.course_id, communityName]
        );

        await client.query('COMMIT');

        res.status(201).json(newCourse);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Course code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name, department, semester, teacher_id } = req.body;

        if (!course_code || !course_name || !department || !semester) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `UPDATE courses 
             SET course_code = $1, course_name = $2, department = $3, 
                 semester = $4, teacher_id = $5
             WHERE course_id = $6 
             RETURNING *,
                (SELECT full_name FROM users WHERE user_id = $5) as teacher_name`,
            [course_code, course_name, department, semester, teacher_id, id]
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
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM courses WHERE course_id = $1 RETURNING course_id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get enrolled students for a course
router.get('/:id/enrolled', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT u.user_id, u.reg_id, u.full_name, u.email, u.department, e.enrolled_on
             FROM enrollments e
             JOIN users u ON e.student_id = u.user_id
             WHERE e.course_id = $1
             ORDER BY e.enrolled_on DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enrolled students:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove students from course
router.post('/:id/remove', auth, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { student_ids } = req.body;

        console.log('=== COURSE REMOVAL REQUEST ===');
        console.log('Course ID:', id);
        console.log('Student IDs:', student_ids);

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'student_ids array is required' });
        }

        // Verify course exists
        const courseCheck = await client.query(
            'SELECT course_id, course_name FROM courses WHERE course_id = $1',
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
             RETURNING enrollment_id`,
            [id, student_ids]
        );

        const removedCount = deleteResult.rows.length;

        await client.query('COMMIT');

        console.log('Removed enrollments:', removedCount);
        console.log('=== END REMOVAL REQUEST ===');

        res.json({ 
            message: `Successfully removed ${removedCount} student(s) from course`,
            removedCount,
            totalAttempted: student_ids.length
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error removing students from course:', err);
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

        console.log('=== COURSE ASSIGNMENT REQUEST ===');
        console.log('Course ID:', id);
        console.log('Student IDs:', student_ids);

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'student_ids array is required' });
        }

        // Verify course exists
        const courseCheck = await client.query(
            'SELECT course_id, department FROM courses WHERE course_id = $1',
            [id]
        );

        console.log('Course check result:', courseCheck.rows);

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const courseDepartment = courseCheck.rows[0].department;
        console.log('Course department:', courseDepartment);

        // Verify all students exist and belong to the same department
        const studentsCheck = await client.query(
            `SELECT user_id, department, full_name 
             FROM users 
             WHERE user_id = ANY($1::int[]) AND role = 'Student'`,
            [student_ids]
        );

        console.log('Students check result:', studentsCheck.rows);

        if (studentsCheck.rows.length !== student_ids.length) {
            return res.status(400).json({ message: 'Some student IDs are invalid' });
        }

        // Check department mismatch
        const mismatchedStudents = studentsCheck.rows.filter(
            student => student.department !== courseDepartment
        );

        console.log('Mismatched students:', mismatchedStudents);

        if (mismatchedStudents.length > 0) {
            const names = mismatchedStudents.map(s => s.full_name).join(', ');
            return res.status(400).json({ 
                message: `Department mismatch: ${names} cannot be assigned to ${courseDepartment} course` 
            });
        }

        console.log('Starting transaction...');
        await client.query('BEGIN');

        // Insert enrollments (using ON CONFLICT to avoid duplicates)
        const enrollmentPromises = student_ids.map(student_id =>
            client.query(
                `INSERT INTO enrollments (course_id, student_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT (course_id, student_id) DO NOTHING
                 RETURNING enrollment_id`,
                [id, student_id]
            )
        );

        const results = await Promise.all(enrollmentPromises);
        console.log('Enrollment results:', results.map(r => r.rows));
        const newEnrollments = results.filter(r => r.rows.length > 0).length;

        console.log('Committing transaction...');
        await client.query('COMMIT');
        console.log('Transaction committed successfully');
        console.log('New enrollments:', newEnrollments);
        console.log('=== END ASSIGNMENT REQUEST ===');

        res.json({ 
            message: `Successfully assigned course to ${newEnrollments} student(s)`,
            newEnrollments,
            totalAttempted: student_ids.length
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error assigning course:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;