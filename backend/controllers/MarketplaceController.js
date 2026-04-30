const MarketplaceItem = require('../models/MarketplaceItem');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const marketplaceController = {
    // Get all items
    getAllItems: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const filters = {
                category: req.query.category,
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

    // Place an order
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
