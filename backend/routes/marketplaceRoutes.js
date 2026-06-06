const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/MarketplaceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// PayFast IPN webhook — MUST be public (no JWT) so GoPayFast servers can call it
router.get('/orders/payfast/webhook', marketplaceController.payFastWebhook);
router.post('/orders/payfast/webhook', marketplaceController.payFastWebhook);
router.get('/orders/payfast/verify', marketplaceController.verifyPayFastPayment);
router.post('/orders/payfast/verify', marketplaceController.verifyPayFastPayment);

// All other marketplace routes require login
router.use(auth);

// Get all items (with optional filters in query params)
router.get('/', marketplaceController.getAllItems);

// Get current user's items
router.get('/my-items', marketplaceController.getMyItems);

const cartController = require('../controllers/CartController');

// Cart routes
router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.put('/cart/:itemId', cartController.updateCartQuantity);
router.delete('/cart/:itemId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);
// Order routes
router.get('/orders/me', marketplaceController.getMyOrders);
router.get('/orders/received', marketplaceController.getReceivedOrders);
router.post('/orders', marketplaceController.placeOrder);
router.post('/orders/payfast/initiate', marketplaceController.initiatePayFastPayment);
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
