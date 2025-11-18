const pool = require('../config/database');

class User {
    static async findByIdentifier(identifier) {
        const query = `
            SELECT user_id, reg_id, email, full_name, role, department, password_hash 
            FROM users 
            WHERE LOWER(email) = LOWER($1) OR LOWER(reg_id) = LOWER($1)
        `;
        const result = await pool.query(query, [identifier && identifier.trim()]);
        return result.rows[0];
    }
    static async findById(userId) {
        const query = `
            SELECT user_id, reg_id, email, full_name, role, department, created_at, updated_at
            FROM users 
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
    static async findAll(filters = {}) {
        let query = `
            SELECT user_id, reg_id, email, full_name, role, department, created_at, updated_at
            FROM users
        `;
        const params = [];
        const conditions = [];

        if (filters.role) {
            params.push(filters.role);
            conditions.push(`role = $${params.length}`);
        }

        if (filters.department) {
            params.push(filters.department);
            conditions.push(`department = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        return result.rows;
    }
    static async create(userData) {
        const { reg_id, full_name, email, password_hash, role, department } = userData;
        const query = `
            INSERT INTO users (reg_id, full_name, email, password_hash, role, department)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, reg_id, email, full_name, role, department, created_at
        `;
        const result = await pool.query(query, [reg_id, full_name, email, password_hash, role, department]);
        return result.rows[0];
    }
    static async update(userId, userData) {
        const { full_name, email, role, department } = userData;
        const query = `
            UPDATE users 
            SET full_name = $1, email = $2, role = $3, department = $4, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5
            RETURNING user_id, reg_id, email, full_name, role, department, updated_at
        `;
        const result = await pool.query(query, [full_name, email, role, department, userId]);
        return result.rows[0];
    }
    static async delete(userId) {
        const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id';
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
    static async updatePassword(userId, passwordHash) {
        const query = `
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
        `;
        await pool.query(query, [passwordHash, userId]);
    }
    static async countByRole() {
        const query = `
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = User;
