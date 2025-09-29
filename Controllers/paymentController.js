const axios = require('axios');
const crypto = require('crypto');
const Order = require('../Models/orders');

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

async function getAuthToken() {
    try {
        const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
            api_key: PAYMOB_API_KEY
        });
        return response.data.token;
    } catch (error) {
        console.error('Error getting auth token:', error.response?.data || error.message);
        throw error;
    }
}

async function createOrder(authToken, amountCents, merchantOrderId, currency = 'EGP') {
    try {
        const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: currency,
            items: [],
            merchant_order_id: merchantOrderId
        });
        return response.data; // includes id
    } catch (error) {
        console.error('Error creating order:', error.response?.data || error.message);
        throw error;
    }
}

async function createPaymentKey(authToken, orderId, amountCents, billingData) {
    try {
        const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: 'EGP',
            integration_id: PAYMOB_INTEGRATION_ID
        });
        return response.data.token;
    } catch (error) {
        console.error('Error creating payment key:', error.response?.data || error.message);
        throw error;
    }
}

function buildBillingDataFromUser(user, fallback = {}) {
    // Paymob requires many fields; use safe fallbacks where unknown
    const name = (user?.name || 'Customer').split(' ');
    const first_name = name[0] || 'Customer';
    const last_name = name.slice(1).join(' ') || 'User';

    return {
        apartment: fallback.apartment || 'NA',
        email: user?.email || fallback.email || 'na@example.com',
        floor: fallback.floor || 'NA',
        first_name,
        street: fallback.street || 'NA',
        building: fallback.building || 'NA',
        phone_number: user?.phoneNumber || fallback.phone_number || '01000000000',
        shipping_method: 'NA',
        postal_code: fallback.postal_code || 'NA',
        city: fallback.city || 'Cairo',
        country: fallback.country || 'EG',
        last_name,
        state: fallback.state || 'NA'
    };
}

function verifyPaymobHmac(params) {
    if (!PAYMOB_HMAC_SECRET) return false;
    if (!params) return false;

    const hmac = params.hmac || params?.obj?.hmac;
    if (!hmac) return false;

    // Select payload base: flat (callback) or nested under obj (webhook)
    const base = params.obj && typeof params.obj === 'object' ? params.obj : params;

    // According to Paymob docs, sort the following keys in this exact order
    const keysOrder = [
        'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success'
    ];

    const data = keysOrder.map(k => {
        const v = k.includes('.') ? k.split('.').reduce((acc, key) => acc?.[key], base) : base[k];
        return v === undefined || v === null ? '' : String(v);
    }).join('');

    const calculated = crypto.createHmac('sha512', PAYMOB_HMAC_SECRET).update(data).digest('hex');
    return calculated === hmac;
}

// Create payment starting from a local order ID
async function createPayment(req, res) {
    try {
        if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_API_URL || !PAYMOB_IFRAME_ID) {
            return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
        }
        const { orderId, billingData: billingDataInput } = req.body;
        if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

        // Fetch order and ensure it belongs to current user
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (!req.user || (String(order.userId) !== String(req.user.id) && String(order.userId) !== String(req.user._id))) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ success: true, alreadyPaid: true, redirect: `/order/confirmation?id=${order._id}` });
        }

        const amountCents = Math.round(Number(order.totalPrice) * 100);
        const authToken = await getAuthToken();

        // Create Paymob order with local order id as merchant_order_id
        const paymobOrder = await createOrder(authToken, amountCents, String(order._id));
        const billingData = buildBillingDataFromUser(req.user, billingDataInput || {});
        const paymentKey = await createPaymentKey(authToken, paymobOrder.id, amountCents, billingData);

        // Persist provider metadata on order
        order.paymentProvider = 'paymob';
        order.providerOrderId = String(paymobOrder.id);
        order.paymentKey = paymentKey;
        await order.save();

        return res.status(200).json({
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
            providerOrderId: paymobOrder.id
        });
    } catch (error) {
        console.error('Payment initiation failed:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Payment initiation failed', error: error.message });
    }
}

// Synchronous redirect callback (when configured in Paymob dashboard)
async function paymobCallback(req, res) {
    try {
        const params = req.query || {};
        const valid = verifyPaymobHmac(params);
        const success = params.success === 'true' || params.success === true;
        const paymobOrderId = (params['order'] && typeof params['order'] === 'object' ? params['order'].id : null)
            || params['order.id'] || params.order || params.order_id || params.orderId || '';
        const providerTxId = params.id;
        const merchantOrderId = params.merchant_order_id || params.merchantOrderId || '';

        if (!valid) {
            return res.status(400).render('error', { code: 400, title: 'Payment Error', message: 'Invalid payment signature' });
        }

        // Prefer merchant_order_id to map to our local order id
        const orderId = merchantOrderId || undefined;
        let order = null;
        if (orderId) {
            order = await Order.findById(orderId);
        } else if (paymobOrderId) {
            order = await Order.findOne({ providerOrderId: String(paymobOrderId) });
        }

        if (!order) {
            return res.status(404).render('error', { code: 404, title: 'Order Not Found', message: 'Order not found for payment' });
        }

        if (success) {
            order.paymentStatus = 'paid';
            order.transactionId = String(providerTxId || '');
            await order.save();
            return res.redirect(`/order/confirmation?id=${order._id}`);
        } else {
            return res.status(400).render('error', { code: 400, title: 'Payment Failed', message: 'Payment failed' });
        }
    } catch (err) {
        console.error('Callback error:', err);
        return res.status(500).render('error', { code: 500, title: 'Payment Processing Error', message: 'Payment processing error' });
    }
}

// Asynchronous webhook (recommended)
async function paymobWebhook(req, res) {
    try {
        const params = req.body || {};
        const valid = verifyPaymobHmac(params);
        if (!valid) return res.status(400).json({ received: true, valid: false });

        const base = params.obj && typeof params.obj === 'object' ? params.obj : params;
        const success = base.success === true || base.success === 'true';
        const paymobOrderId = base.order?.id || base['order.id'] || base.order_id || '';
        const merchantOrderId = base.merchant_order_id || '';
        const providerTxId = base.id;

        // Map to local order
        let order = null;
        if (merchantOrderId) {
            order = await Order.findById(merchantOrderId);
        }
        if (!order && paymobOrderId) {
            order = await Order.findOne({ providerOrderId: String(paymobOrderId) });
        }
        if (!order) return res.status(200).json({ received: true }); // Ignore unknown orders

        if (success) {
            order.paymentStatus = 'paid';
            order.transactionId = String(providerTxId || '');
            await order.save();
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return res.status(500).json({ received: false });
    }
}

module.exports = {
    createPayment,
    paymobCallback,
    paymobWebhook
};