const pool = require('../config/database');

class User {
    static async findByIdentifier(identifier) {
        const query = `
            SELECT id, reg_id, email, name, role, department, semester, program_year, section, password 
            FROM users 
            WHERE LOWER(email) = LOWER($1) OR LOWER(reg_id) = LOWER($1)
        `;
        const result = await pool.query(query, [identifier && identifier.trim()]);
        return result.rows[0];
    }
    static async findById(userId) {
        const query = `
            SELECT id, reg_id, email, name, role, department, semester, program_year, section, created_at, updated_at
            FROM users 
            WHERE id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
    static async findAll(filters = {}) {
        let query = `
            SELECT id, reg_id, email, name, role, department, semester, program_year, section, created_at, updated_at
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
        const { reg_id, name, email, password, role, department, semester, program_year, section } = userData;
        const query = `
            INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, section)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, reg_id, email, name, role, department, semester, program_year, section, created_at
        `;
        const result = await pool.query(query, [reg_id, name, email, password, role, department, semester || null, program_year || null, section || null]);
        return result.rows[0];
    }
    static async update(userId, userData) {
        const { name, email, role, department, semester, program_year, section } = userData;
        const query = `
            UPDATE users 
            SET name = $1, email = $2, role = $3, department = $4, semester = $5, program_year = $6, section = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING id, reg_id, email, name, role, department, semester, program_year, section, updated_at
        `;
        const result = await pool.query(query, [name, email, role, department, semester || null, program_year || null, section || null, userId]);
        return result.rows[0];
    }
    static async delete(userId) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
    static async updatePassword(userId, newPassword) {
        const query = `
            UPDATE users 
            SET password = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        await pool.query(query, [newPassword, userId]);
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
    static async generateNextRegId(role) {
        let prefix = '';
        if (role === 'Teacher') prefix = 'T';
        else if (role === 'HOD') prefix = 'HOD';
        else if (role === 'PM') prefix = 'PM';
        else return null;

        // Find the highest existing ID with this prefix
        // We'll look in both users and registration_requests tables
        const query = `
            SELECT reg_id FROM users WHERE reg_id LIKE $1
            UNION
            SELECT reg_id FROM registration_requests WHERE reg_id LIKE $1
        `;

        const result = await pool.query(query, [`${prefix}%`]);

        let maxNum = 0;
        const regex = new RegExp(`^${prefix}(\\d+)$`);

        result.rows.forEach(row => {
            const match = row.reg_id.match(regex);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });

        const nextNum = maxNum + 1;
        // Pad with zeros to ensure at least 3 digits
        const nextId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
        console.log(`[USER] Generated Reg ID for ${role}: ${nextId}`);
        return nextId;
    }
}

module.exports = User;
