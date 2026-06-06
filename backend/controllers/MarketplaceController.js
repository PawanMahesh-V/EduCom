const MarketplaceItem = require('../models/MarketplaceItem');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const pool = require('../config/database');
const crypto = require('crypto');
const axios = require('axios');
const ModerationService = require('../services/ModerationService');

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
                // Convert buffer to Base64 data URI
                const base64Str = req.file.buffer.toString('base64');
                image_url = `data:${req.file.mimetype};base64,${base64Str}`;
            }

            // Basic validation
            if (!title || !price) {
                return res.status(400).json({ message: 'Title and price are required' });
            }

            // Moderation check
            const textToModerate = `${title} ${description || ''}`;
            const moderation = await ModerationService.moderateText(textToModerate);
            if (moderation.toxic) {
                return res.status(400).json({ 
                    message: 'Item creation blocked: can not use inappropriate words.',
                    toxic: true,
                    confidence: moderation.confidence 
                });
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
            const io = req.app.get('io');
            if (io) io.emit('inventory_updated');
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
            const io = req.app.get('io');
            if (io) io.emit('inventory_updated');
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

            // Moderation check
            const textToModerate = `${title} ${description || ''}`;
            const moderation = await ModerationService.moderateText(textToModerate);
            if (moderation.toxic) {
                return res.status(400).json({ 
                    message: 'Item update blocked: Content flagged by moderation system.',
                    toxic: true,
                    confidence: moderation.confidence 
                });
            }

            let image_url = null;
            if (req.file) {
                const base64Str = req.file.buffer.toString('base64');
                image_url = `data:${req.file.mimetype};base64,${base64Str}`;
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
            const io = req.app.get('io');
            if (io) io.emit('inventory_updated');
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
            const io = req.app.get('io');
            if (io) io.emit('inventory_updated');
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

            const frontendUrl = req.headers.origin || 'http://localhost:5173';
            const backendUrl  = process.env.API_URL  || `${req.protocol}://${req.get('host')}`;

            const PayFastService = require('../services/PayFastService');
            const { paymentId, redirectUrl, pfPayload } = await PayFastService.initiatePayment(orderData, frontendUrl, backendUrl);

            return res.status(200).json({
                success:    true,
                mode:       'redirect',
                orderId:    paymentId,
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

            const PayFastService = require('../services/PayFastService');
            const isValid = PayFastService.validateHash(orderId, errCode, validationHash);

            if (!isValid) {
                console.error('[PayFast IPN] Hash validation failed.');
                return res.status(400).send('Invalid signature hash');
            }

            console.log(`[PayFast IPN] Order #${orderId} - Status Code: ${errCode} - Msg: ${errMsg} - Txn ID: ${transactionId}`);

            if (errCode === '000') {
                await PayFastService.handlePaymentSuccess(orderId);
                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');
                console.log(`[PayFast IPN] Order #${orderId} successfully processed and paid.`);
            } else {
                console.warn(`[PayFast IPN] Payment failed/cancelled for Order #${orderId}. Reason: ${errMsg}`);
                await PayFastService.handlePaymentFailure(orderId);
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

            const orderQuery = await pool.query('SELECT status, buyer_id FROM marketplace_orders WHERE payment_id = $1 LIMIT 1', [orderId]);
            if (orderQuery.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const currentStatus = orderQuery.rows[0].status;

            if (currentStatus === 'pending') {
                return res.status(200).json({ success: true, orderId, status: 'pending' });
            }

            if (currentStatus === 'cancelled' || currentStatus === 'cancelled_by_buyer') {
                return res.status(200).json({ success: false, orderId, status: currentStatus });
            }

            const PayFastService = require('../services/PayFastService');
            const isValid = PayFastService.validateHash(orderId, errCode, validationHash);

            if (!isValid) {
                console.error('[PayFast Verify] Hash validation failed.');
                return res.status(400).json({ success: false, message: 'Invalid signature hash' });
            }

            if (errCode === '000') {
                await PayFastService.handlePaymentSuccess(orderId);
                const io = req.app.get('io');
                if (io) io.emit('inventory_updated');
                console.log(`[PayFast Verify] Order #${orderId} successfully verified and paid.`);
                return res.status(200).json({ success: true, orderId, status: 'pending' });
            } else {
                console.warn(`[PayFast Verify] Payment failed/cancelled for Order #${orderId}. Reason: ${errMsg}`);
                await PayFastService.handlePaymentFailure(orderId);
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

    // Get orders received by the seller
    getReceivedOrders: async (req, res) => {
        try {
            const userId = req.user.userId;
            const orders = await Order.findBySellerId(userId);
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
            const io = req.app.get('io');
            if (io) io.emit('inventory_updated');
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
