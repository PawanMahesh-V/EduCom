const pool = require('../config/database');

class Wishlist {
    static async getWishlist(userId) {
        const query = `
            SELECT w.id as wishlist_item_id, m.*, u.name as seller_name
            FROM wishlists w
            JOIN marketplace_items m ON w.item_id = m.id
            LEFT JOIN users u ON m.seller_id = u.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query, [userId]);
            return rows;
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    }

    static async addItem(userId, itemId) {
        const query = `
            INSERT INTO wishlists (user_id, item_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, item_id) DO NOTHING
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [userId, itemId]);
            return rows[0];
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    }

    static async removeItem(userId, itemId) {
        const query = `
            DELETE FROM wishlists 
            WHERE user_id = $1 AND item_id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [userId, itemId]);
            return rows[0];
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    }
}

module.exports = Wishlist;
