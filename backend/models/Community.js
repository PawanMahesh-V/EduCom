const pool = require('../config/database');

class Community {
    static async create(communityData, client = pool) {
        const { course_id, name, join_code, status = 'active' } = communityData;
        const query = `
            INSERT INTO communities (course_id, name, join_code, status) 
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await client.query(query, [course_id, name, join_code, status]);
        return result.rows[0];
    }

    static async findAll(filters = {}, options = {}) {
        const { limit, offset } = options;
        let query = `SELECT c.*, 
                    co.code as course_code,
                    co.name as course_name,
                    co.department
             FROM communities c 
             LEFT JOIN courses co ON c.course_id = co.id`;
        const queryParams = [];
        const conditions = [];

        if (filters.status && filters.status !== 'All') {
            queryParams.push(filters.status);
            conditions.push(`c.status = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY c.created_at DESC';

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
        let query = 'SELECT COUNT(*) FROM communities c';
        const queryParams = [];
        const conditions = [];

        if (filters.status && filters.status !== 'All') {
            queryParams.push(filters.status);
            conditions.push(`c.status = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, queryParams);
        return parseInt(result.rows[0].count);
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   co.code as course_code,
                   co.name as course_name,
                   co.department,
                   co.semester
            FROM communities c 
            LEFT JOIN courses co ON c.course_id = co.id 
            WHERE c.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByJoinCode(joinCode) {
        const query = `
            SELECT c.*, co.id as course_id, co.name as course_name, co.code as course_code, co.department, co.semester
            FROM communities c
            JOIN courses co ON c.course_id = co.id
            WHERE c.join_code = $1
        `;
        const result = await pool.query(query, [joinCode]);
        return result.rows[0];
    }

    static async findByStudentId(studentId) {
        const query = `
            SELECT DISTINCT c.id, c.course_id, c.name, c.join_code, c.status, c.created_at, 
                    co.name as course_name, co.code as course_code,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id = c.id 
                           AND sender_id != $1 
                           AND is_read = FALSE),
                        0
                    ) as unread_count
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             JOIN enrollments e ON co.id = e.course_id
             WHERE e.student_id = $1
             ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [studentId]);
        return result.rows;
    }

    static async findByTeacherId(teacherId) {
        const query = `
            SELECT DISTINCT c.id, c.course_id, c.name, c.join_code, c.status, c.created_at, 
                    co.name as course_name, co.code as course_code,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id = c.id 
                           AND sender_id != $1 
                           AND is_read = FALSE),
                        0
                    ) as unread_count
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             WHERE co.teacher_id = $1
             ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [teacherId]);
        return result.rows;
    }

    static async findByDepartment(department, excludeUserId) {
        const query = `
             SELECT DISTINCT c.id, c.course_id, c.name, c.join_code, c.status, c.created_at, 
                    co.name as course_name, co.code as course_code,
                    COALESCE(
                        (SELECT COUNT(*)::integer 
                         FROM messages 
                         WHERE community_id = c.id 
                           AND sender_id != $1 
                           AND is_read = FALSE),
                        0
                    ) as unread_count
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             WHERE co.department = $2
             ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [excludeUserId, department]);
        return result.rows;
    }

    static async update(id, data) {
        const { name, status } = data;
        const result = await pool.query(
            `UPDATE communities 
             SET name = $1, status = $2
             WHERE id = $3 
             RETURNING *`,
            [name, status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM communities WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

    // --- Members & Messages ---

    static async getMembers(id) {
        const query = `
             SELECT u.id, u.username, u.name, u.email
             FROM communities c
             JOIN courses co ON c.course_id = co.id
             JOIN enrollments e ON co.id = e.course_id
             JOIN users u ON e.student_id = u.id
             WHERE c.id = $1
             ORDER BY u.name
        `;
        const result = await pool.query(query, [id]);
        return result.rows;
    }

    static async updateMessagesRead(communityId, userId) {
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE community_id = $1 
               AND sender_id != $2 
               AND is_read = FALSE`,
            [communityId, userId]
        );
    }

    static async getMessages(communityId, limit = 50) {
        const query = `
            SELECT m.id, m.community_id, m.sender_id, m.content, m.is_anonymous, m.status, 
                    m.created_at,
                    u.name as sender_name
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.community_id = $1
             ORDER BY m.created_at ASC
             LIMIT $2
        `;
        const result = await pool.query(query, [communityId, limit]);
        return result.rows;
    }

    static async deleteMessage(messageId) {
        await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
    }

    static async findMessageById(messageId) {
        const result = await pool.query(
            'SELECT id, sender_id, community_id FROM messages WHERE id = $1 AND community_id IS NOT NULL',
            [messageId]
        );
        return result.rows[0];
    }

    static async deleteMultipleMessages(messageIds, senderId, communityId) {
        const result = await pool.query(
            `DELETE FROM messages 
             WHERE id = ANY($1) 
               AND sender_id = $2
               AND community_id = $3
             RETURNING id`,
            [messageIds, senderId, communityId]
        );
        return result;
    }

    static async deleteByCourseId(courseId, client = pool) {
        // First delete messages
        await client.query(
            `DELETE FROM messages 
             WHERE community_id IN (SELECT id FROM communities WHERE course_id = $1)`,
            [courseId]
        );

        // Then delete communities
        const result = await client.query(
            'DELETE FROM communities WHERE course_id = $1',
            [courseId]
        );
        return result;
    }
}

module.exports = Community;
