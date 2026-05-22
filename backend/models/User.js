const pool = require('../config/database');

class User {
    static async findByIdentifier(identifier) {
        const query = `
            SELECT id, reg_id, email, name, role, department, semester, program_year, section, password, is_active 
            FROM users 
            WHERE LOWER(email) = LOWER($1) OR LOWER(reg_id) = LOWER($1)
        `;
        const result = await pool.query(query, [identifier && identifier.trim()]);
        return result.rows[0];
    }
    static async findById(userId) {
        const query = `
            SELECT id, reg_id, email, name, role, department, semester, program_year, section, is_active, created_at, updated_at
            FROM users 
            WHERE id = $1
        `;
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
