const MarketplaceItem = require('../models/MarketplaceItem');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const pool = require('../config/database');
const crypto = require('crypto');
const axios = require('axios');

const marketplaceController = {
    // Get all items
    getAllItems: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const filters = {
                role: req.query.role,
                search: req.query.search,
                limit,
                offset
            };
            const result = await MarketplaceItem.findAll(filters);
            res.status(200).json(result); // result is { items, total }
        } catch (error) {
            console.error('Error fetching marketplace items:', error);
            res.status(500).json({ message: 'Server error fetching items' });
        }
    },

    // Get item by ID
    getItemById: async (req, res) => {
        try {
            const item = await MarketplaceItem.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            res.status(200).json(item);
        } catch (error) {
            console.error('Error fetching marketplace item:', error);
            res.status(500).json({ message: 'Server error fetching item' });
        }
    },

    // Create new item
    createItem: async (req, res) => {
        try {
            const seller_id = req.user.userId; // From auth middleware
            const { title, description, price, category, quantity, tags } = req.body;

            // Handle image URL if uploaded
            let image_url = null;
            if (req.file) {
                // Return the public path to the uploaded file
                image_url = `${process.env.API_URL || 'http://localhost:5000'}/uploads/marketplace/${req.file.filename}`;
            }

            // Basic validation
            if (!title || !price) {
                return res.status(400).json({ message: 'Title and price are required' });
            }

            // Convert tags to array if it's a string, or handle empty
            let parsedTags = [];
            if (tags && typeof tags === 'string') {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(tags)) {
                parsedTags = tags;
            }

            const newItemData = {
                seller_id,
                title,
                description: description || '',
                price: parseFloat(price),
                image_url: image_url,
                category: category || 'Other',
                quantity: quantity !== undefined ? parseInt(quantity, 10) : 1,
                tags: parsedTags
            };

            const item = await MarketplaceItem.create(newItemData);
            res.status(201).json(item);
        } catch (error) {
            console.error('Error creating marketplace item:', error);
            res.status(500).json({ message: 'Server error creating item' });
        }
    },

    // Update item status (for seller or admin)
    updateItemStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const item = await MarketplaceItem.findById(req.params.id);
            
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }

            // Verify ownership or admin role (assuming req.user has role)
            if (item.seller_id !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized to update this item' });
            }

            const updatedItem = await MarketplaceItem.updateStatus(req.params.id, status);
            res.status(200).json(updatedItem);
        } catch (error) {
            console.error('Error updating marketplace item status:', error);
            res.status(500).json({ message: 'Server error updating item' });
        }
    },

    // Get current user's items
    getMyItems: async (req, res) => {
        try {
            const seller_id = req.user.userId;
            const items = await MarketplaceItem.findBySellerId(seller_id);
            res.status(200).json(items);
        } catch (error) {
            console.error('Error fetching user marketplace items:', error);
            res.status(500).json({ message: 'Server error fetching your items' });
        }
    },

    // Update item details
    updateItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, price, category, quantity, tags } = req.body;
            const item = await MarketplaceItem.findById(id);

            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }

            if (item.seller_id !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized to update this item' });
            }

            let image_url = null;
            if (req.file) {
                image_url = `${process.env.API_URL || 'http://localhost:5000'}/uploads/marketplace/${req.file.filename}`;
            }

            let parsedTags = [];
            if (tags && typeof tags === 'string') {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(tags)) {
                parsedTags = tags;
            }

            const updatedData = {
                title,
                description: description || '',
                price: parseFloat(price),
                image_url: image_url,
                category: category || item.category,
                quantity: quantity !== undefined ? parseInt(quantity, 10) : item.quantity,
                tags: parsedTags
            };

            const updatedItem = await MarketplaceItem.update(id, updatedData);
            res.status(200).json(updatedItem);
        } catch (error) {
            console.error('Error updating marketplace item:', error);
            res.status(500).json({ message: 'Server error updating item' });
        }
    },

    // Delete item
    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;
            const item = await MarketplaceItem.findById(id);

            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }

            if (item.seller_id !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized to delete this item' });
            }

            await MarketplaceItem.delete(id);
            res.status(200).json({ message: 'Item deleted successfully' });
        } catch (error) {
            console.error('Error deleting marketplace item:', error);
            res.status(500).json({ message: 'Server error deleting item' });
        }
    },

    // Place an order (standard)
    placeOrder: async (req, res) => {
        try {
            const buyer_id = req.user.userId;
            const orderData = {
                buyer_id,
                ...req.body
            };

            const orderId = await Order.create(orderData);
            
            // Emit real-time inventory update
            const io = req.app.get('io');
            if (io) {
                io.emit('inventory_updated');
            }

            res.status(201).json({ message: 'Order placed successfully', orderId });
        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).json({ message: 'Server error placing order' });
        }
    },

    // ─── Initiate PayFast Payment via Redirect ───
    initiatePayFastPayment: async (req, res) => {
        try {
            const buyer_id = req.user.userId;
            const orderData = {
                buyer_id,
                ...req.body,
                status: 'pending_payment',
            };

            // 1. Persist order so we have an ID before redirecting
            const orderId = await Order.create(orderData);

            const merchantId  = process.env.PAYFAST_MERCHANT_ID || '14833';
            const merchantKey = process.env.PAYFAST_SECURE_KEY || 'rPcy4T7GQkSCFsHBLdn26s';
            const tokenUrl    = process.env.PAYFAST_TOKEN_URL || 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken';
            const redirectUrl = process.env.PAYFAST_REDIRECT_URL || 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';

            const frontendUrl = req.headers.origin || 'http://localhost:5173';
            const backendUrl  = process.env.API_URL  || `${req.protocol}://${req.get('host')}`;

            // 2. Fetch Access Token from PayFast Pakistan
            const tokenParams = new URLSearchParams({
                MERCHANT_ID: merchantId,
                SECURED_KEY: merchantKey,
                BASKET_ID: orderId.toString(),
                TXNAMT: parseFloat(orderData.total_amount).toFixed(2),
                CURRENCY_CODE: 'PKR'
            });

            console.log('[PayFast] Requesting access token from:', tokenUrl, 'with params:', tokenParams.toString());

            let accessToken = null;
            try {
                const tokenResponse = await axios.post(
                    tokenUrl,
                    tokenParams.toString(),
                    {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 10000
                    }
                );

                console.log('[PayFast] Access token response:', tokenResponse.data);
                accessToken = tokenResponse.data && tokenResponse.data.ACCESS_TOKEN;
            } catch (tokenErr) {
                console.error('[PayFast] Token fetch error:', tokenErr.message);
                throw new Error(`Failed to authenticate with PayFast: ${tokenErr.message}`);
            }

            if (!accessToken) {
                throw new Error('No ACCESS_TOKEN returned from PayFast token API');
            }

            // 3. Build UAT form parameters for POST redirection
            const cleanPhone = orderData.phone ? orderData.phone.replace(/\D/g, '') : '03001234567';
            const pfPayload = {
                MERCHANT_ID:             merchantId,
                MERCHANT_NAME:           'EduCom',
                TOKEN:                   accessToken,
                PROCCODE:                '00',
                TXNAMT:                  parseFloat(orderData.total_amount).toFixed(2),
                CUSTOMER_MOBILE_NO:      cleanPhone,
                CUSTOMER_EMAIL_ADDRESS:  orderData.email || 'customer@example.com',
                SIGNATURE:               'educomsignature',
                VERSION:                 'MERCHANTCART-0.1',
                TXNDESC:                 `EduCom Order #${orderId}`,
                SUCCESS_URL:             `${frontendUrl}/payment/callback`,
                FAILURE_URL:             `${frontendUrl}/payment/callback`,
                BASKET_ID:               orderId.toString(),
                ORDER_DATE:              new Date().toISOString().split('T')[0], // YYYY-MM-DD
                CHECKOUT_URL:            (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1') || backendUrl.includes('0.0.0.0')) 
                                         ? 'https://httpbin.org/anything' 
                                         : `${backendUrl}/api/marketplace/orders/payfast/webhook`,
                CURRENCY_CODE:           'PKR',
                TRAN_TYPE:               'ECOMM_PURCHASE',
                CUSTOMER_NAME:           orderData.full_name || 'Customer'
            };

            return res.status(200).json({
                success:    true,
                mode:       'redirect',
                orderId,
                paymentUrl: redirectUrl,
                payload:    pfPayload,
            });

        } catch (error) {
            console.error('[PayFast] Error initiating payment:', error);
            res.status(500).json({ message: error.message || 'Server error initiating payment' });
        }
    },

    // ─── PayFast IPN Webhook (notify_url callback from GoPayFast servers) ───
    payFastWebhook: async (req, res) => {
        try {
            // Support both GET query parameters and POST body parameters
            const params = { ...req.query, ...req.body };
            console.log('[PayFast IPN] Received parameters:', params);

            const orderId        = params.basket_id;
            const errCode        = params.err_code;
            const errMsg         = params.err_msg || 'No error message';
            const transactionId  = params.transaction_id;
            const validationHash = params.validation_hash;

            if (!orderId) {
                console.warn('[PayFast IPN] Missing basket_id');
                return res.status(400).send('basket_id missing');
            }

            // Verify the validation_hash
            const merchantId  = process.env.PAYFAST_MERCHANT_ID || '14833';
            const secureKey   = process.env.PAYFAST_SECURE_KEY || 'rPcy4T7GQkSCFsHBLdn26s';

            if (validationHash) {
                // String sequence: “your_basket_id|your_merchant_secret_key|your_merchant_id|payasft_err_code”
                const stringToHash = `${orderId}|${secureKey}|${merchantId}|${errCode}`;
                const calculatedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

                if (calculatedHash !== validationHash.toLowerCase()) {
                    console.error('[PayFast IPN] Hash validation failed. Calculated:', calculatedHash, 'Received:', validationHash);
                    if (merchantId === '14833') {
                        console.warn('[PayFast IPN] WARNING: Bypassing signature hash mismatch because we are in UAT sandbox mode.');
                    } else {
                        return res.status(400).send('Invalid signature hash');
                    }
                } else {
                    console.log('[PayFast IPN] Hash validation successful.');
                }
            } else {
                console.warn('[PayFast IPN] No validation_hash provided in the webhook payload.');
            }

            console.log(`[PayFast IPN] Order #${orderId} - Status Code: ${errCode} - Msg: ${errMsg} - Txn ID: ${transactionId}`);

            if (errCode === '000') {
                // Payment was successful! Update order to 'pending'
                await Order.updateStatus(orderId, 'pending');

                // Clear buyer's cart
                const result = await pool.query(
                    'SELECT buyer_id FROM marketplace_orders WHERE id = $1', [orderId]
                );
                if (result.rows.length > 0) {
                    await Cart.clearCart(result.rows[0].buyer_id);
                }

                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');

                console.log(`[PayFast IPN] Order #${orderId} successfully processed and paid.`);
            } else {
                console.warn(`[PayFast IPN] Payment failed/cancelled for Order #${orderId}. Reason: ${errMsg}`);
                
                // Update order to 'cancelled'
                await Order.updateStatus(orderId, 'cancelled');

                // Restock items
                const itemsResult = await pool.query(
                    'SELECT item_id, quantity FROM marketplace_order_items WHERE order_id = $1',
                    [orderId]
                );
                for (const item of itemsResult.rows) {
                    if (item.item_id) {
                        await pool.query(
                            `UPDATE marketplace_items SET quantity = quantity + $1, status = 'available' WHERE id = $2`,
                            [item.quantity, item.item_id]
                        );
                    }
                }

                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('[PayFast IPN] Error processing webhook:', error);
            res.status(500).send('Server Error');
        }
    },

    // ─── Verify PayFast Payment from Client Redirect Callback ───
    verifyPayFastPayment: async (req, res) => {
        try {
            const params = { ...req.query, ...req.body };
            console.log('[PayFast Verify] Received parameters:', params);

            const orderId        = params.basket_id || params.order_id;
            const errCode        = params.err_code;
            const errMsg         = params.err_msg || 'No error message';
            const transactionId  = params.transaction_id;
            const validationHash = params.validation_hash;

            if (!orderId) {
                console.warn('[PayFast Verify] Missing basket_id or order_id');
                return res.status(400).json({ success: false, message: 'basket_id/order_id missing' });
            }

            // 1. Check order status in DB first to handle idempotency (e.g. if webhook already processed it)
            const orderQuery = await pool.query('SELECT status, buyer_id FROM marketplace_orders WHERE id = $1', [orderId]);
            if (orderQuery.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const currentStatus = orderQuery.rows[0].status;
            const buyerId = orderQuery.rows[0].buyer_id;

            if (currentStatus === 'pending') {
                console.log(`[PayFast Verify] Order #${orderId} is already paid (status: pending). Returning success.`);
                return res.status(200).json({ success: true, orderId, status: 'pending' });
            }

            if (currentStatus === 'cancelled' || currentStatus === 'cancelled_by_buyer') {
                console.log(`[PayFast Verify] Order #${orderId} is already cancelled (status: ${currentStatus}). Returning failure.`);
                return res.status(200).json({ success: false, orderId, status: currentStatus });
            }

            // Verify the validation_hash
            const merchantId  = process.env.PAYFAST_MERCHANT_ID || '14833';
            const secureKey   = process.env.PAYFAST_SECURE_KEY || 'rPcy4T7GQkSCFsHBLdn26s';

            if (validationHash) {
                const stringToHash = `${orderId}|${secureKey}|${merchantId}|${errCode}`;
                const calculatedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

                if (calculatedHash !== validationHash.toLowerCase()) {
                    console.error('[PayFast Verify] Hash validation failed. Calculated:', calculatedHash, 'Received:', validationHash);
                    if (merchantId === '14833') {
                        console.warn('[PayFast Verify] WARNING: Bypassing signature hash mismatch because we are in UAT sandbox mode.');
                    } else {
                        return res.status(400).json({ success: false, message: 'Invalid signature hash' });
                    }
                } else {
                    console.log('[PayFast Verify] Hash validation successful.');
                }
            } else {
                console.warn('[PayFast Verify] No validation_hash provided. Rejecting verification.');
                return res.status(400).json({ success: false, message: 'No validation hash provided' });
            }

            if (errCode === '000') {
                // Payment was successful! Update order to 'pending'
                await Order.updateStatus(orderId, 'pending');

                // Clear buyer's cart
                await Cart.clearCart(buyerId);

                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');

                console.log(`[PayFast Verify] Order #${orderId} successfully verified and paid.`);
                return res.status(200).json({ success: true, orderId, status: 'pending' });
            } else {
                console.warn(`[PayFast Verify] Payment failed/cancelled for Order #${orderId}. Reason: ${errMsg}`);
                
                // Update order to 'cancelled'
                await Order.updateStatus(orderId, 'cancelled');

                // Restock items
                const itemsResult = await pool.query(
                    'SELECT item_id, quantity FROM marketplace_order_items WHERE order_id = $1',
                    [orderId]
                );
                for (const item of itemsResult.rows) {
                    if (item.item_id) {
                        await pool.query(
                            `UPDATE marketplace_items SET quantity = quantity + $1, status = 'available' WHERE id = $2`,
                            [item.quantity, item.item_id]
                        );
                    }
                }

                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');

                return res.status(200).json({ success: false, orderId, status: 'cancelled', message: errMsg });
            }
        } catch (error) {
            console.error('[PayFast Verify] Error verifying payment:', error);
            res.status(500).json({ success: false, message: 'Server Error verifying payment' });
        }
    },

    // Get current user's placed orders

    getMyOrders: async (req, res) => {
        try {
            const buyer_id = req.user.userId;
            const orders = await Order.findByBuyerId(buyer_id);
            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching user orders:', error);
            res.status(500).json({ message: 'Server error fetching your orders' });
        }
    },

    // Get orders received by the seller (or all orders for Admins)
    getReceivedOrders: async (req, res) => {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;

            let orders;
            if (userRole === 'Admin') {
                orders = await Order.findAll();
            } else {
                orders = await Order.findBySellerId(userId);
            }
            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching received orders:', error);
            res.status(500).json({ message: 'Server error fetching received orders' });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, otp } = req.body;

            // If marking as completed, verify OTP
            if (status === 'completed') {
                if (!otp) {
                    return res.status(400).json({ message: 'Delivery OTP is required to complete the order' });
                }
                const isValid = await Order.verifyOTP(id, otp);
                if (!isValid) {
                    return res.status(400).json({ message: 'Invalid delivery OTP' });
                }
            }

            const updatedOrder = await Order.updateStatus(id, status);
            res.status(200).json(updatedOrder);
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ message: 'Server error updating order' });
        }
    },

    // Cancel order (by buyer)
    cancelOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const buyer_id = req.user.userId;

            await Order.cancel(id, buyer_id);
            
            // Emit real-time inventory update
            const io = req.app.get('io');
            if (io) {
                io.emit('inventory_updated');
            }

            res.status(200).json({ message: 'Order cancelled and items restocked' });
        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(400).json({ message: error.message || 'Failed to cancel order' });
        }
    },

    // ================= CART =================
    getCart: async (req, res) => {
        try {
            const cartItems = await Cart.getCart(req.user.userId);
            res.status(200).json(cartItems);
        } catch (error) {
            console.error('Error fetching cart:', error);
            res.status(500).json({ message: 'Server error fetching cart' });
        }
    },

    addToCart: async (req, res) => {
        try {
            const { item_id, quantity } = req.body;
            const item = await Cart.addItem(req.user.userId, item_id, quantity);
            res.status(200).json(item);
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ message: 'Server error adding to cart' });
        }
    },

    removeFromCart: async (req, res) => {
        try {
            const { itemId } = req.params;
            await Cart.removeItem(req.user.userId, itemId);
            res.status(200).json({ message: 'Item removed from cart' });
        } catch (error) {
            console.error('Error removing from cart:', error);
            res.status(500).json({ message: 'Server error removing from cart' });
        }
    },

    updateCartQuantity: async (req, res) => {
        try {
            const { itemId } = req.params;
            const { quantity } = req.body;
            
            if (quantity === undefined) {
                return res.status(400).json({ message: 'Quantity is required' });
            }

            const updatedItem = await Cart.updateQuantity(req.user.userId, itemId, parseInt(quantity, 10));
            res.status(200).json(updatedItem || { message: 'Item removed from cart' });
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            res.status(500).json({ message: 'Server error updating cart quantity' });
        }
    },

    clearCart: async (req, res) => {
        try {
            await Cart.clearCart(req.user.userId);
            res.status(200).json({ message: 'Cart cleared' });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ message: 'Server error clearing cart' });
        }
    },



    // ================= SELLER PROFILE =================
    getSellerProfile: async (req, res) => {
        try {
            const { id } = req.params;
            const items = await MarketplaceItem.findBySellerId(id);
            
            let sellerInfo = null;
            if (items.length > 0) {
                sellerInfo = {
                    id: id,
                    name: items[0].seller_name
                };
            }
            
            res.status(200).json({ seller: sellerInfo, items });
        } catch (error) {
            console.error('Error fetching seller profile:', error);
            res.status(500).json({ message: 'Server error fetching seller profile' });
        }
    }
};

module.exports = marketplaceController;
