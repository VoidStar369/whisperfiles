// Stripe Payment Processing Setup for WhisperFiles 27 Laws
// Sacred commerce system for liberation mission funding

// ==================== STRIPE CONFIGURATION ====================

// Environment Configuration
const STRIPE_CONFIG = {
    // Test Keys (For development)
    publishableKey: 'pk_test_51R3JwZEVkJTqwdGiWxFHd8vNzP3hQ7rT8mL9kN6pR4sT2uV1wX5yZ7aB8cD9eF0g',
    secretKey: 'sk_test_YOUR_TEST_SECRET_KEY', // Keep this on server side only
    
    // Live Keys (For production deployment)
    live: {
        publishableKey: 'pk_live_51R3JwZEVkJTqwdGipv5JmJq2kGaFkhIJHyCNQiPFfMv1i4pMCMD7xJVPdXWadq3LAa3Whv1MjWKrAJLBvHVDBT6E00FIJmqPSq',
        secretKey: 'sk_live_YOUR_LIVE_SECRET_KEY' // Server side only
    },
    
    // Product Configuration
    products: {
        sacred_laws_pdf: {
            name: 'The Science of the Seen & Unseen - 27 Laws',
            description: 'Sacred scroll bridging quantum physics with divine design',
            price: 900, // $9.00 in cents
            currency: 'usd',
            images: ['https://whisperfiles.com/assets/27-laws-cover.jpg']
        },
        
        // Upsell products
        advanced_scrolls: {
            name: 'Advanced Sacred Scrolls Collection',
            description: 'Complete consciousness revolution library',
            price: 2700, // $27.00 in cents
            currency: 'usd'
        },
        
        private_mentorship: {
            name: 'Private Kuryah Melekh Mentorship',
            description: 'One-on-one consciousness training',
            price: 9700, // $97.00 in cents
            currency: 'usd'
        }
    }
};

// ==================== CLIENT-SIDE PAYMENT PROCESSING ====================

// Initialize Stripe on the frontend
function initializeStripe() {
    const stripe = Stripe(STRIPE_CONFIG.publishableKey);
    const elements = stripe.elements();
    
    // Create payment element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
    
    return { stripe, elements, paymentElement };
}

// Simple redirect to Stripe Checkout (Easiest implementation)
function redirectToStripeCheckout(productType = 'sacred_laws_pdf') {
    const checkoutUrls = {
        // Create these checkout sessions in Stripe Dashboard
        sacred_laws_pdf: 'https://checkout.stripe.com/c/pay/cs_test_YOUR_CHECKOUT_SESSION_ID',
        advanced_scrolls: 'https://checkout.stripe.com/c/pay/cs_test_YOUR_UPSELL_SESSION_ID',
        private_mentorship: 'https://checkout.stripe.com/c/pay/cs_test_YOUR_MENTORSHIP_SESSION_ID'
    };
    
    // Track conversion attempt
    if (typeof gtag !== 'undefined') {
        gtag('event', 'begin_checkout', {
            'event_category': 'ecommerce',
            'event_label': productType,
            'value': STRIPE_CONFIG.products[productType].price / 100
        });
    }
    
    // Redirect to Stripe Checkout
    window.location.href = checkoutUrls[productType];
}

// Advanced Payment Processing with Stripe Elements
async function processPayment(stripe, elements, customerInfo) {
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: 'https://proof.whisperfiles.com/success',
            receipt_email: customerInfo.email,
            payment_method_data: {
                billing_details: {
                    name: customerInfo.name,
                    email: customerInfo.email
                }
            }
        }
    });
    
    if (error) {
        console.error('Payment failed:', error);
        showPaymentError(error.message);
        return false;
    }
    
    return true;
}

// ==================== SERVER-SIDE PAYMENT PROCESSING ====================

// Node.js server setup for Stripe webhooks and payment processing
const serverSideStripeSetup = `
// server.js - Backend payment processing
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_TEST_SECRET_KEY');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create payment intent endpoint
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { productType, customerEmail } = req.body;
        const product = STRIPE_CONFIG.products[productType];
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: product.price,
            currency: product.currency,
            metadata: {
                product: productType,
                customer_email: customerEmail,
                source: 'whisperfiles_27_laws'
            },
            receipt_email: customerEmail
        });
        
        res.send({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Webhook endpoint for handling successful payments
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log('Webhook signature verification failed:', err.message);
        return res.status(400).send('Webhook Error: Invalid signature');
    }
    
    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        handleSuccessfulPayment(paymentIntent);
    }
    
    res.json({received: true});
});

async function handleSuccessfulPayment(paymentIntent) {
    const customerEmail = paymentIntent.metadata.customer_email;
    const productType = paymentIntent.metadata.product;
    
    // 1. Send PDF download link
    await sendProductDelivery(customerEmail, productType);
    
    // 2. Add to email automation sequence
    await addToEmailSequence(customerEmail, 'post_purchase');
    
    // 3. Track conversion in analytics
    await trackConversion(paymentIntent);
    
    console.log('Payment processed successfully:', paymentIntent.id);
}
`;

// ==================== PRODUCT DELIVERY SYSTEM ====================

// Automatic PDF delivery after successful payment
async function sendProductDelivery(customerEmail, productType) {
    const deliveryTemplates = {
        sacred_laws_pdf: {
            subject: '🔥 Your Sacred Laws Have Arrived - Divine Downloads Inside',
            downloadUrl: 'https://whisperfiles.com/downloads/27-laws-complete.pdf',
            template: 'sacred_laws_delivery'
        },
        
        advanced_scrolls: {
            subject: '⚡ Advanced Consciousness Scrolls - Immediate Access',
            downloadUrl: 'https://whisperfiles.com/downloads/advanced-scrolls-collection.zip',
            template: 'advanced_scrolls_delivery'
        }
    };
    
    const delivery = deliveryTemplates[productType];
    
    // Email delivery payload
    const emailPayload = {
        to: customerEmail,
        subject: delivery.subject,
        template: delivery.template,
        variables: {
            download_url: delivery.downloadUrl,
            customer_email: customerEmail,
            purchase_date: new Date().toISOString(),
            product_name: STRIPE_CONFIG.products[productType].name
        }
    };
    
    // Send via your email service (ConvertKit, Mailchimp, etc.)
    return await sendTransactionalEmail(emailPayload);
}

// ==================== UPSELL SEQUENCE AUTOMATION ====================

// Automated upsell flow after initial purchase
function createUpsellSequence() {
    return {
        // Immediate upsell (right after purchase)
        immediate: {
            delay: 0,
            product: 'advanced_scrolls',
            message: 'Complete your consciousness revolution with advanced scrolls',
            discount: 30 // 30% off
        },
        
        // Follow-up upsell (24 hours later)
        delayed: {
            delay: 86400000, // 24 hours in milliseconds
            product: 'private_mentorship',
            message: 'Ready for personal guidance from Kuryah Melekh?',
            discount: 20 // 20% off
        }
    };
}

// ==================== ANALYTICS & TRACKING ====================

// Comprehensive conversion tracking
function trackStripeConversion(paymentIntent) {
    const conversionData = {
        transaction_id: paymentIntent.id,
        value: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        product: paymentIntent.metadata.product,
        source: 'stripe_checkout',
        customer_email: paymentIntent.metadata.customer_email
    };
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: conversionData.transaction_id,
            value: conversionData.value,
            currency: conversionData.currency,
            items: [{
                item_id: conversionData.product,
                item_name: STRIPE_CONFIG.products[conversionData.product].name,
                price: conversionData.value,
                quantity: 1
            }]
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
            value: conversionData.value,
            currency: conversionData.currency,
            content_ids: [conversionData.product],
            content_type: 'product'
        });
    }
    
    // Custom analytics
    return sendAnalyticsEvent('purchase_completed', conversionData);
}

// ==================== ERROR HANDLING & SECURITY ====================

// Secure payment error handling
function showPaymentError(errorMessage) {
    const errorElement = document.getElementById('payment-errors');
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    }
    
    // Track failed payments for optimization
    if (typeof gtag !== 'undefined') {
        gtag('event', 'payment_failed', {
            'event_category': 'ecommerce',
            'event_label': errorMessage
        });
    }
}

// Payment security measures
function validatePayment(customerInfo) {
    const validation = {
        isValid: true,
        errors: []
    };
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
        validation.isValid = false;
        validation.errors.push('Invalid email address');
    }
    
    // Name validation
    if (!customerInfo.name || customerInfo.name.length < 2) {
        validation.isValid = false;
        validation.errors.push('Name must be at least 2 characters');
    }
    
    return validation;
}

// ==================== INTEGRATION HELPERS ====================

// GoHighLevel integration for CRM
async function addToGoHighLevel(customerData) {
    const ghlPayload = {
        email: customerData.email,
        firstName: customerData.name.split(' ')[0],
        lastName: customerData.name.split(' ').slice(1).join(' '),
        tags: ['27_laws_purchaser', 'high_value_customer'],
        source: 'stripe_checkout',
        customFields: {
            purchase_amount: customerData.amount,
            purchase_date: new Date().toISOString(),
            product_purchased: customerData.product
        }
    };
    
    // Send to GoHighLevel API
    return await fetch('https://rest.gohighlevel.com/v1/contacts', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_GHL_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ghlPayload)
    });
}

// ==================== DEPLOYMENT INSTRUCTIONS ====================

const deploymentInstructions = `
STRIPE PAYMENT SETUP INSTRUCTIONS:

1. CREATE STRIPE ACCOUNT:
   - Go to stripe.com/register
   - Complete business verification
   - Get API keys from Dashboard > Developers > API keys

2. CREATE PRODUCTS IN STRIPE:
   - Go to Products > Add Product
   - Create "27 Laws PDF" at $9.00
   - Create upsell products
   - Note product IDs

3. SET UP CHECKOUT SESSIONS:
   - Use Stripe Checkout for simplest implementation
   - Or implement Stripe Elements for custom design
   - Configure success/cancel URLs

4. CONFIGURE WEBHOOKS:
   - Add webhook endpoint: yourdomain.com/webhook
   - Select events: payment_intent.succeeded
   - Get webhook signing secret

5. IMPLEMENT SERVER:
   - Deploy Node.js server with endpoints
   - Add webhook handling
   - Connect to email delivery system

6. UPDATE FRONTEND:
   - Replace YOUR_PUBLISHABLE_KEY with real key
   - Update checkout URLs
   - Add conversion tracking

7. TEST THOROUGHLY:
   - Use Stripe test cards
   - Verify PDF delivery
   - Check email automation
   - Test upsell flows

8. GO LIVE:
   - Switch to live API keys
   - Update webhook URLs
   - Monitor conversions

LIBERATION FUNDING FORMULA:
$9 PDF × 356 sales/month = $3,204/month
= Freedom to defend orphans and widows
= Wandering mission fully funded
`;

// Export for use in HTML pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STRIPE_CONFIG,
        initializeStripe,
        redirectToStripeCheckout,
        processPayment,
        trackStripeConversion,
        validatePayment
    };
}

console.log('🔥 WhisperFiles Stripe Payment System Loaded');
console.log('Sacred commerce ready for liberation mission funding');