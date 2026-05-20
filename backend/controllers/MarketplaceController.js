const MarketplaceItem = require('../models/MarketplaceItem');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const pool = require('../config/database');

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

    // Initiate PayFast Payment
    initiatePayFastPayment: async (req, res) => {
        try {
            const buyer_id = req.user.userId;
            const orderData = {
                buyer_id,
                ...req.body,
                status: 'pending_payment' // Set initial status to pending_payment
            };

            // 1. Create the order in the database
            const orderId = await Order.create(orderData);
            
            // 2. Prepare PayFast Payload
            const merchantId = process.env.PAYFAST_MERCHANT_ID;
            const secureKey = process.env.PAYFAST_SECURE_KEY;
            const isLive = process.env.PAYFAST_ENV === 'live';
            
            // Determine base URL (for callbacks)
            const baseUrl = req.protocol + '://' + req.get('host');
            
            // If credentials aren't set, we use a simulation flow
            if (!merchantId || merchantId === 'your_merchant_id_here') {
                console.log('[PayFast Sim] Generating simulated payment URL for Order ID:', orderId);
                // Return a mock URL that the frontend will redirect to for simulation
                return res.status(200).json({ 
                    success: true, 
                    isSimulated: true,
                    orderId: orderId,
                    paymentUrl: `/payment/callback?order_id=${orderId}&status=success&simulated=true`
                });
            }

            // --- REAL PAYFAST INTEGRATION STRUCTURE ---
            const frontendUrl = req.headers.origin || 'http://localhost:5173';
            const backendUrl = req.protocol + '://' + req.get('host');

            // Construct the payload specific to standard PayFast (South Africa)
            const paymentPayload = {
                merchant_id: merchantId,
                merchant_key: secureKey,
                return_url: `${frontendUrl}/payment/callback?order_id=${orderId}&status=success`,
                cancel_url: `${frontendUrl}/payment/callback?order_id=${orderId}&status=failed`,
                notify_url: `${backendUrl}/api/marketplace/orders/payfast/webhook?order_id=${orderId}`,
                name_first: orderData.full_name,
                email_address: orderData.email,
                m_payment_id: orderId.toString(),
                amount: parseFloat(orderData.total_amount).toFixed(2),
                item_name: `EduCom Order #${orderId}`
            };

            // Use the environment variable for the endpoint, defaulting to sandbox if not set
            const payfastEndpoint = process.env.PAYFAST_ENV || 'https://sandbox.payfast.co.za/eng/process';

            res.status(200).json({
                success: true,
                isSimulated: false,
                orderId: orderId,
                paymentUrl: payfastEndpoint,
                payload: paymentPayload // Frontend will POST this via a hidden form
            });

        } catch (error) {
            console.error('Error initiating PayFast payment:', error);
            res.status(500).json({ message: 'Server error initiating payment' });
        }
    },

    // PayFast Webhook Callback (IPN)
    payFastWebhook: async (req, res) => {
        try {
            // PayFast sends the payment status to this endpoint
            const payload = req.body;
            const orderId = req.query.order_id || payload.order_id;
            
            console.log('[PayFast Webhook] Received IPN for Order:', orderId, payload);

            if (!orderId) {
                return res.status(400).json({ message: 'Order ID is missing' });
            }

            // In a real scenario, you MUST verify the signature sent by PayFast to prevent fraud
            // const isValidSignature = verifyPayFastSignature(payload, process.env.PAYFAST_SECURE_KEY);
            // if (!isValidSignature) return res.status(400).send('Invalid Signature');

            // Update order status to 'pending' (which means paid and pending fulfillment)
            // Or 'cancelled' if payment failed
            const paymentStatus = payload.status || req.query.status;
            
            if (paymentStatus === 'success' || paymentStatus === '00') {
                await Order.updateStatus(orderId, 'pending');
                
                // Clear the buyer's cart now that payment succeeded
                const order = await pool.query('SELECT buyer_id FROM marketplace_orders WHERE id = $1', [orderId]);
                if (order.rows.length > 0) {
                    await Cart.clearCart(order.rows[0].buyer_id);
                }

                // Emit real-time inventory update since order is confirmed
                const io = req.app.get('io');
                if (io) {
                    io.emit('inventory_updated');
                }
            } else {
                await Order.updateStatus(orderId, 'cancelled');
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error handling PayFast webhook:', error);
            res.status(500).send('Server Error');
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
