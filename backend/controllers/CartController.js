const Cart = require('../models/Cart');

const cartController = {
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
    }
};

module.exports = cartController;
