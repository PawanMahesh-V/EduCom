const pool = require('../config/database');

class Order {
    static async create(orderData) {
        const { buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, items } = orderData;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const orderQuery = `
                INSERT INTO marketplace_orders (
                    buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, delivery_otp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id;
            `;
            
            const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
            
            const { rows } = await client.query(orderQuery, [
                buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, deliveryOtp
            ]);
            
            const orderId = rows[0].id;
            
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO marketplace_order_items (
                        order_id, item_id, title, price, quantity
                    ) VALUES ($1, $2, $3, $4, $5)
                `;
                await client.query(itemQuery, [orderId, item.id, item.title, item.price, item.qty || 1]);
                
                // Decrement quantity in marketplace_items
                const updateItemQuery = `
                    UPDATE marketplace_items
                    SET quantity = quantity - $1,
                        status = CASE WHEN quantity - $1 <= 0 THEN 'out_of_stock' ELSE status END
                    WHERE id = $2
                `;
                await client.query(updateItemQuery, [item.qty || 1, item.id]);
            }
            
            await client.query('COMMIT');
            return orderId;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating order:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByBuyerId(buyerId) {
        const query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.id,
                       'item_id', oi.item_id,
                       'title', oi.title,
                       'price', oi.price,
                       'quantity', oi.quantity
                   )) as items
            FROM marketplace_orders o
            LEFT JOIN marketplace_order_items oi ON o.id = oi.order_id
            WHERE o.buyer_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query, [buyerId]);
            return rows;
        } catch (error) {
            console.error('Error fetching orders by buyer id:', error);
            throw error;
        }
    }

    static async findBySellerId(sellerId) {
        const query = `
            SELECT o.id, o.buyer_id, o.full_name, o.email, o.phone, o.campus, 
                   o.pickup_note, o.payment_method, o.total_amount, o.status, o.created_at, o.delivery_otp,
                   u.name as buyer_name,
                   json_agg(json_build_object(
                       'id', oi.id,
                       'item_id', oi.item_id,
                       'title', oi.title,
                       'price', oi.price,
                       'quantity', oi.quantity
                   )) as items
            FROM marketplace_orders o
            JOIN marketplace_order_items oi ON o.id = oi.order_id
            JOIN marketplace_items mi ON oi.item_id = mi.id
            JOIN users u ON o.buyer_id = u.id
            WHERE mi.seller_id = $1
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query, [sellerId]);
            return rows;
        } catch (error) {
            console.error('Error fetching orders by seller id:', error);
            throw error;
        }
    }

    static async findAll() {
        const query = `
            SELECT o.*, 
                   u.name as buyer_name,
                   json_agg(json_build_object(
                       'id', oi.id,
                       'item_id', oi.item_id,
                       'title', oi.title,
                       'price', oi.price,
                       'quantity', oi.quantity
                   )) as items
            FROM marketplace_orders o
            JOIN marketplace_order_items oi ON o.id = oi.order_id
            JOIN users u ON o.buyer_id = u.id
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC;
        `;
        try {
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Error fetching all orders:', error);
            throw error;
        }
    }

    static async verifyOTP(id, otp) {
        const query = `SELECT * FROM marketplace_orders WHERE id = $1 AND delivery_otp = $2`;
        try {
            const { rows } = await pool.query(query, [id, otp]);
            return rows.length > 0;
        } catch (error) {
            console.error('Error verifying OTP:', error);
            throw error;
        }
    }

    static async updateStatus(id, status) {
        const query = `
            UPDATE marketplace_orders
            SET status = $1
            WHERE id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [status, id]);
            return rows[0];
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    static async cancel(id, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify order exists, belongs to user, and is pending
            const checkQuery = `SELECT * FROM marketplace_orders WHERE id = $1 AND buyer_id = $2 AND status = 'pending'`;
            const { rows: orderRows } = await client.query(checkQuery, [id, userId]);
            
            if (orderRows.length === 0) {
                throw new Error('Order not found, unauthorized, or not in pending status');
            }

            // 2. Update status to cancelled_by_buyer
            await client.query(`UPDATE marketplace_orders SET status = 'cancelled_by_buyer' WHERE id = $1`, [id]);

            // 3. Restock items
            const itemsQuery = `SELECT item_id, quantity FROM marketplace_order_items WHERE order_id = $1`;
            const { rows: itemRows } = await client.query(itemsQuery, [id]);

            for (const item of itemRows) {
                if (item.item_id) {
                    await client.query(
                        `UPDATE marketplace_items SET quantity = quantity + $1, status = 'available' WHERE id = $2`,
                        [item.quantity, item.item_id]
                    );
                }
            }

            await client.query('COMMIT');
            return orderRows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error cancelling order:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Order;
