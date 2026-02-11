const pool = require('../config/database');

class Course {
    static async findAll(filters = {}, options = {}) {
        const { limit, offset } = options;
        let query = `SELECT c.*, u.name as teacher_name 
                     FROM courses c 
                     LEFT JOIN users u ON c.teacher_id = u.id`;
        const queryParams = [];
        const conditions = [];

        if (filters.department && filters.department !== 'All') {
            queryParams.push(filters.department);
            conditions.push(`c.department = $${queryParams.length}`);
        }

        if (filters.semester && filters.semester !== 'All') {
            queryParams.push(filters.semester);
            conditions.push(`c.semester = $${queryParams.length}`);
        }

        if (filters.teacher_id) {
            queryParams.push(filters.teacher_id);
            conditions.push(`c.teacher_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY c.code';

        if (limit) {
            queryParams.push(limit);
            query += ` LIMIT $${queryParams.length}`;
            if (offset) {
                queryParams.push(offset);
                query += ` OFFSET $${queryParams.length}`;
            }
        }

        const result = await pool.query(query, queryParams);
        return result.rows;
    }

    static async count(filters = {}) {
        let query = 'SELECT COUNT(*) FROM courses c';
        const queryParams = [];
        const conditions = [];

        if (filters.department && filters.department !== 'All') {
            queryParams.push(filters.department);
            conditions.push(`c.department = $${queryParams.length}`);
        }

        if (filters.semester && filters.semester !== 'All') {
            queryParams.push(filters.semester);
            conditions.push(`c.semester = $${queryParams.length}`);
        }

        if (filters.teacher_id) {
            queryParams.push(filters.teacher_id);
            conditions.push(`c.teacher_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, queryParams);
        return parseInt(result.rows[0].count);
    }

    static async findById(id) {
        const query = `
            SELECT c.*, u.name as teacher_name 
            FROM courses c 
            LEFT JOIN users u ON c.teacher_id = u.id 
            WHERE c.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByCode(code) {
        const result = await pool.query('SELECT * FROM courses WHERE code = $1', [code]);
        return result.rows[0];
    }

    static async findByStudentId(studentId) {
        const query = `
            SELECT c.*, u.name as teacher_name, e.enrolled_on
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE e.student_id = $1
            ORDER BY e.enrolled_on DESC
        `;
        const result = await pool.query(query, [studentId]);
        return result.rows;
    }

    static async findByTeacherIdDetailed(teacherId) {
        const query = `
            SELECT c.*, 
                   com.join_code,
                   COUNT(DISTINCT e.student_id) as enrolled_count,
                   'active' as status
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN communities com ON c.id = com.course_id
            WHERE c.teacher_id = $1
            GROUP BY c.id, com.join_code
            ORDER BY c.code
        `;
        const result = await pool.query(query, [teacherId]);
        return result.rows;
    }

    static async getTeacherStats(teacherId) {
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

        return {
            totalCourses: parseInt(coursesResult.rows[0].count),
            totalStudents: parseInt(studentsResult.rows[0].total_students || 0)
        };
    }

    static async create(courseData, client = pool) {
        const { code, name, department, semester, teacher_id } = courseData;
        const query = `
            INSERT INTO courses (code, name, department, semester, teacher_id) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *, 
            (SELECT name FROM users WHERE id = $5) as teacher_name
        `;
        const result = await client.query(query, [code, name, department, semester, teacher_id]);
        return result.rows[0];
    }

    static async update(id, courseData) {
        const { code, name, department, semester, teacher_id } = courseData;
        const query = `
            UPDATE courses 
            SET code = $1, name = $2, department = $3, semester = $4, teacher_id = $5
            WHERE id = $6 
            RETURNING *,
            (SELECT name FROM users WHERE id = $5) as teacher_name
        `;
        const result = await pool.query(query, [code, name, department, semester, teacher_id, id]);
        return result.rows[0];
    }

    static async delete(id, client = pool) {
        const result = await client.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

    static async getEnrolledStudents(courseId) {
        const query = `
            SELECT u.id, u.reg_id, u.name, u.email, u.department, u.semester, u.program_year, u.section, e.enrolled_on
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            WHERE e.course_id = $1
            ORDER BY e.enrolled_on DESC
        `;
        const result = await pool.query(query, [courseId]);
        return result.rows;
    }

    static async assignStudents(courseId, studentIds, client = pool) {
        // Insert enrollments (using ON CONFLICT to avoid duplicates)
        const enrollmentPromises = studentIds.map(student_id =>
            client.query(
                `INSERT INTO enrollments (course_id, student_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT (course_id, student_id) DO NOTHING
                 RETURNING id`,
                [courseId, student_id]
            )
        );

        const results = await Promise.all(enrollmentPromises);
        return results.filter(r => r.rows.length > 0).length;
    }

    static async removeStudents(courseId, studentIds, client = pool) {
        const result = await client.query(
            `DELETE FROM enrollments 
             WHERE course_id = $1 AND student_id = ANY($2::int[])
             RETURNING id`,
            [courseId, studentIds]
        );
        return result.rows.length;
    }

    // --- Course Request Methods ---

    static async findRequestByCode(code, status = 'pending') {
        const result = await pool.query(
            'SELECT id FROM course_requests WHERE code = $1 AND status = $2',
            [code, status]
        );
        return result.rows[0];
    }

    static async createRequest(requestData) {
        const { code, name, department, semester, teacher_id, requested_by } = requestData;
        const result = await pool.query(
            `INSERT INTO course_requests (code, name, department, semester, teacher_id, requested_by, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING *`,
            [code, name, department, semester, teacher_id, requested_by]
        );
        return result.rows[0];
    }

    static async findAllRequests() {
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
        return result.rows;
    }

    static async findRequestById(id) {
        const result = await pool.query('SELECT * FROM course_requests WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async updateRequestStatus(id, status, client = pool) {
        const result = await client.query(
            'UPDATE course_requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }
}

module.exports = Course;
