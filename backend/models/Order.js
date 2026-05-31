const pool = require('../config/database');

class Order {
    static async create(orderData) {
        const { buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, items, status = 'pending' } = orderData;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const paymentId = 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
            
            // 1. Fetch seller_ids for all items
            const itemIds = items.map(item => item.id);
            const itemsInfoQuery = `SELECT id, seller_id FROM marketplace_items WHERE id = ANY($1)`;
            const { rows: itemsInfoRows } = await client.query(itemsInfoQuery, [itemIds]);
            
            const itemSellerMap = {};
            for (const row of itemsInfoRows) {
                itemSellerMap[row.id] = row.seller_id;
            }
            
            // 2. Group items by seller_id
            const sellerGroups = {};
            for (const item of items) {
                const seller_id = itemSellerMap[item.id];
                if (!seller_id) throw new Error(`Item ${item.id} not found`);
                if (!sellerGroups[seller_id]) {
                    sellerGroups[seller_id] = { items: [], subtotal: 0 };
                }
                sellerGroups[seller_id].items.push(item);
                sellerGroups[seller_id].subtotal += (item.price * (item.qty || 1));
            }
            
            // 3. Create an order for each seller
            for (const seller_id of Object.keys(sellerGroups)) {
                const group = sellerGroups[seller_id];
                const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
                
                const orderQuery = `
                    INSERT INTO marketplace_orders (
                        buyer_id, seller_id, payment_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, delivery_otp, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING id;
                `;
                
                const { rows } = await client.query(orderQuery, [
                    buyer_id, seller_id, paymentId, full_name, email, phone, campus, pickup_note, payment_method, group.subtotal, deliveryOtp, status
                ]);
                
                const orderId = rows[0].id;
                
                for (const item of group.items) {
                    const itemQuery = `
                        INSERT INTO marketplace_order_items (
                            order_id, item_id, title, price, quantity
                        ) VALUES ($1, $2, $3, $4, $5)
                    `;
                    await client.query(itemQuery, [orderId, item.id, item.title, item.price, item.qty || 1]);
                    
                    const updateItemQuery = `
                        UPDATE marketplace_items
                        SET quantity = quantity - $1,
                            status = CASE WHEN quantity - $1 <= 0 THEN 'out_of_stock' ELSE status END
                        WHERE id = $2
                    `;
                    await client.query(updateItemQuery, [item.qty || 1, item.id]);
                }
            }
            
            await client.query('COMMIT');
            return paymentId;
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
            WHERE o.buyer_id = $1 AND o.status != 'pending_payment'
            GROUP BY o.id
            ORDER BY o.created_at DESC, o.id DESC;
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
            LEFT JOIN marketplace_items mi ON oi.item_id = mi.id
            JOIN users u ON o.buyer_id = u.id
            WHERE (o.seller_id = $1 OR (o.seller_id IS NULL AND mi.seller_id = $1))
              AND o.status != 'pending_payment'
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC, o.id DESC;
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
            ORDER BY o.created_at DESC, o.id DESC;
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

    static async updateStatusByPaymentId(paymentId, status) {
        const query = `
            UPDATE marketplace_orders
            SET status = $1
            WHERE payment_id = $2
            RETURNING *;
        `;
        try {
            const { rows } = await pool.query(query, [status, paymentId]);
            return rows;
        } catch (error) {
            console.error('Error updating order status by payment ID:', error);
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
