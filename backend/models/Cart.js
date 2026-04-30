const pool = require('../config/database');

class Cart {
    static async getCart(userId) {
        const query = `
            SELECT c.id as cart_item_id, c.quantity as qty, m.*, u.name as seller_name
            FROM cart_items c
            JOIN marketplace_items m ON c.item_id = m.id
            LEFT JOIN users u ON m.seller_id = u.id
            WHERE c.user_id = $1
            ORDER BY c.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query, [userId]);
            return rows;
        } catch (error) {
            console.error('Error fetching cart:', error);
            throw error;
        }
    }

    static async addItem(userId, itemId, quantity = 1) {
        const query = `
            INSERT INTO cart_items (user_id, item_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, item_id) 
            DO UPDATE SET quantity = cart_items.quantity + $3
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [userId, itemId, quantity]);
            return rows[0];
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    }

    static async removeItem(userId, itemId) {
        const query = `
            DELETE FROM cart_items 
            WHERE user_id = $1 AND item_id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [userId, itemId]);
            return rows[0];
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }

    static async updateQuantity(userId, itemId, quantity) {
        if (quantity <= 0) {
            return await this.removeItem(userId, itemId);
        }
        
        const query = `
            UPDATE cart_items 
            SET quantity = $3
            WHERE user_id = $1 AND item_id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [userId, itemId, quantity]);
            return rows[0];
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            throw error;
        }
    }

    static async clearCart(userId) {
        const query = `DELETE FROM cart_items WHERE user_id = $1`;
        try {
            await pool.query(query, [userId]);
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    }
}

module.exports = Cart;
