const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/MarketplaceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (or protected depending on requirements, assuming protected for platform users)
router.use(auth); // All marketplace actions require login

// Get all items (with optional filters in query params)
router.get('/', marketplaceController.getAllItems);

// Get current user's items
router.get('/my-items', marketplaceController.getMyItems);

// Cart routes
router.get('/cart', marketplaceController.getCart);
router.post('/cart', marketplaceController.addToCart);
router.put('/cart/:itemId', marketplaceController.updateCartQuantity);
router.delete('/cart/:itemId', marketplaceController.removeFromCart);
router.delete('/cart', marketplaceController.clearCart);

// Order routes
router.get('/orders/me', marketplaceController.getMyOrders);
router.get('/orders/received', marketplaceController.getReceivedOrders);
router.post('/orders', marketplaceController.placeOrder);
router.put('/orders/:id/status', marketplaceController.updateOrderStatus);
router.put('/orders/:id/cancel', marketplaceController.cancelOrder);

// Seller Profile route
router.get('/seller/:id', marketplaceController.getSellerProfile);

// Get single item
router.get('/:id', marketplaceController.getItemById);

// Create new item with image upload
router.post('/', upload.single('image'), marketplaceController.createItem);

// Update item status
router.put('/:id/status', marketplaceController.updateItemStatus);

// Update item details
router.put('/:id', upload.single('image'), marketplaceController.updateItem);

// Delete item
router.delete('/:id', marketplaceController.deleteItem);

module.exports = router;
