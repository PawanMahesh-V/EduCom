const pool = require('../config/database');

class MarketplaceItem {
    static async create(itemData) {
        const { seller_id, title, description, price, image_url, category, quantity, tags } = itemData;
        const status = quantity === 0 ? 'out_of_stock' : 'available';
        
        const query = `
            INSERT INTO marketplace_items (
                seller_id, title, description, price, image_url, category, quantity, tags, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        
        const values = [seller_id, title, description, price, image_url, category, quantity, tags, status];
        
        try {
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error('Error creating marketplace item:', error);
            throw error;
        }
    }

    static async findAll(filters = {}) {
        let query = `
            SELECT m.*, u.name as seller_name, u.role as seller_role
            FROM marketplace_items m
            LEFT JOIN users u ON m.seller_id = u.id
            WHERE m.status != 'hidden'
        `;
        const values = [];
        let paramCount = 1;

        if (filters.category && filters.category !== 'All Category') {
            query += ` AND m.category = $${paramCount}`;
            values.push(filters.category);
            paramCount++;
        }

        if (filters.search) {
            query += ` AND (m.title ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
            paramCount++;
        }

        query += ` ORDER BY m.created_at DESC`;

        try {
            const { rows } = await pool.query(query, values);
            return rows;
        } catch (error) {
            console.error('Error fetching marketplace items:', error);
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT m.*, u.name as seller_name, u.email as seller_email, u.role as seller_role
            FROM marketplace_items m
            LEFT JOIN users u ON m.seller_id = u.id
            WHERE m.id = $1;
        `;
        try {
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching marketplace item by id:', error);
            throw error;
        }
    }

    static async updateStatus(id, status) {
        const query = `
            UPDATE marketplace_items
            SET status = $1
            WHERE id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [status, id]);
            return rows[0];
        } catch (error) {
            console.error('Error updating marketplace item status:', error);
            throw error;
        }
    }

    static async findBySellerId(sellerId) {
        const query = `
            SELECT m.*, u.name as seller_name
            FROM marketplace_items m
            LEFT JOIN users u ON m.seller_id = u.id
            WHERE m.seller_id = $1
            ORDER BY m.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query, [sellerId]);
            return rows;
        } catch (error) {
            console.error('Error fetching items by seller id:', error);
            throw error;
        }
    }

    static async update(id, itemData) {
        const { title, description, price, image_url, category, quantity, tags } = itemData;
        const status = quantity === 0 ? 'out_of_stock' : 'available';
        
        const query = `
            UPDATE marketplace_items
            SET title = $1, description = $2, price = $3, image_url = COALESCE($4, image_url), 
                category = $5, quantity = $6, tags = $7, status = $8
            WHERE id = $9
            RETURNING *;
        `;
        const values = [title, description, price, image_url, category, quantity, tags, status, id];
        
        try {
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error('Error updating marketplace item:', error);
            throw error;
        }
    }

    static async delete(id) {
        const query = `DELETE FROM marketplace_items WHERE id = $1 RETURNING *;`;
        try {
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error('Error deleting marketplace item:', error);
            throw error;
        }
    }
}

module.exports = MarketplaceItem;
