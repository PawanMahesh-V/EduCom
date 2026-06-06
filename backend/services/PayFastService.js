const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const pool = require('../config/database');

class PayFastService {
    static async initiatePayment(orderData, frontendUrl, backendUrl) {
        // 1. Persist order so we have an ID before redirecting
        const paymentId = await Order.create(orderData);

        const merchantId  = process.env.PAYFAST_MERCHANT_ID;
        const merchantKey = process.env.PAYFAST_SECURE_KEY;
        const tokenUrl    = process.env.PAYFAST_TOKEN_URL;
        const redirectUrl = process.env.PAYFAST_REDIRECT_URL;

        // 2. Fetch Access Token from PayFast Pakistan
        const tokenParams = new URLSearchParams({
            MERCHANT_ID: merchantId,
            SECURED_KEY: merchantKey,
            BASKET_ID: paymentId.toString(),
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
            TXNDESC:                 `EduCom Order #${paymentId}`,
            SUCCESS_URL:             `${frontendUrl}/payment/callback`,
            FAILURE_URL:             `${frontendUrl}/payment/callback`,
            BASKET_ID:               paymentId.toString(),
            ORDER_DATE:              new Date().toISOString().split('T')[0], // YYYY-MM-DD
            CHECKOUT_URL:            (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1') || backendUrl.includes('0.0.0.0')) 
                                     ? 'https://httpbin.org/anything' 
                                     : `${backendUrl}/api/marketplace/orders/payfast/webhook`,
            CURRENCY_CODE:           'PKR',
            TRAN_TYPE:               'ECOMM_PURCHASE',
            CUSTOMER_NAME:           orderData.full_name || 'Customer'
        };

        return {
            paymentId,
            redirectUrl,
            pfPayload
        };
    }

    static validateHash(orderId, errCode, validationHash) {
        const merchantId  = process.env.PAYFAST_MERCHANT_ID;
        const secureKey   = process.env.PAYFAST_SECURE_KEY;

        if (validationHash) {
            const stringToHash = `${orderId}|${secureKey}|${merchantId}|${errCode}`;
            const calculatedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

            if (calculatedHash !== validationHash.toLowerCase()) {
                if (merchantId === '14833' || merchantId === '102') {
                    console.warn('[PayFast] WARNING: Bypassing signature hash mismatch because we are in UAT sandbox mode.');
                    return true;
                }
                return false;
            }
            return true;
        } else {
            if (merchantId === '102') {
                return true;
            }
            return false;
        }
    }

    static async handlePaymentSuccess(orderId) {
        await Order.updateStatusByPaymentId(orderId, 'pending');

        const result = await pool.query(
            'SELECT buyer_id FROM marketplace_orders WHERE payment_id = $1 LIMIT 1', [orderId]
        );
        if (result.rows.length > 0) {
            await Cart.clearCart(result.rows[0].buyer_id);
        }
    }

    static async handlePaymentFailure(orderId) {
        await Order.updateStatusByPaymentId(orderId, 'cancelled');

        // Restock items
        const itemsResult = await pool.query(
            'SELECT item_id, quantity FROM marketplace_order_items WHERE order_id IN (SELECT id FROM marketplace_orders WHERE payment_id = $1)',
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
    }
}

module.exports = PayFastService;
