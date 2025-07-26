// WhisperFiles Stripe Webhook Handler
// Processes payments and delivers sacred scrolls automatically

const express = require('express');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Configure Stripe to use local Squid proxy for IPv6→IPv4 translation
// Force IPv4 localhost to avoid Node.js preferring IPv6
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:3128');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    httpAgent: proxyAgent
});

const nodemailer = require('nodemailer');
const app = express();

// ==================== CONFIGURATION ====================

const CONFIG = {
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET',
    
    // Email configuration
    email: {
        service: 'gmail', // or your email service
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: 'downloads@whisperfiles.com'
    },
    
    // Product delivery URLs
    downloads: {
        sacred_laws_pdf: 'https://whisperfiles.com/secure/downloads/27-laws-complete.pdf',
        advanced_scrolls: 'https://whisperfiles.com/secure/downloads/advanced-collection.zip',
        private_mentorship: 'https://calendly.com/kuryah-melekh/consciousness-session'
    },
    
    // GoHighLevel API configuration
    gohighlevel: {
        api_key: process.env.GHL_API_KEY,
        base_url: 'https://rest.gohighlevel.com/v1'
    }
};

// ==================== EMAIL DELIVERY SYSTEM ====================

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
    service: CONFIG.email.service,
    auth: {
        user: CONFIG.email.user,
        pass: CONFIG.email.password
    }
});

// Email templates for product delivery
const EMAIL_TEMPLATES = {
    sacred_laws_pdf: {
        subject: '🔥 Your Sacred Laws Have Arrived - Divine Downloads Inside',
        html: `
            <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e8d5b7; padding: 40px;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #d4af37; font-size: 2.5em; margin-bottom: 10px;">WhisperFiles</h1>
                        <p style="color: #b8860b; font-style: italic;">Wisdom Felt</p>
                    </div>
                    
                    <h2 style="color: #d4af37; text-align: center; margin-bottom: 30px;">
                        🔥 Your Sacred Laws Have Arrived
                    </h2>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: #ff6b35; margin-bottom: 20px;">Instant Access to Divine Knowledge</h3>
                        <p style="margin-bottom: 20px; font-size: 1.1em;">
                            You now possess the complete sacred scroll: <strong>"The Science of the Seen & Unseen - 27 Laws That Prove Faith Isn't Blind"</strong>
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{DOWNLOAD_URL}}" style="display: inline-block; background: linear-gradient(45deg, #d4af37, #b8860b); color: #000; padding: 20px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase;">
                                Download Sacred Laws PDF
                            </a>
                        </div>
                        
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 8px 0;">✓ 60+ Pages of Sacred Knowledge</li>
                            <li style="padding: 8px 0;">✓ All 27 Universal Laws</li>
                            <li style="padding: 8px 0;">✓ Scientific Citations & Proofs</li>
                            <li style="padding: 8px 0;">✓ Spiritual Applications</li>
                            <li style="padding: 8px 0;">✓ Reality Engineering Principles</li>
                        </ul>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #d4af37; margin-bottom: 15px;">Your Consciousness Revolution Begins</h3>
                        <p style="margin-bottom: 15px;">
                            These laws are not entertainment. They are weapons of transformation. Study them. Apply them. Let them rewire your understanding of reality itself.
                        </p>
                        <p style="font-style: italic; color: #b8860b;">
                            "Dominion begins in thought. Not imagination—but intention."
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 20px; text-align: center; font-size: 0.9em; color: #888;">
                        <p>Questions? Reply to this email.</p>
                        <p>WhisperFiles • Wisdom Felt • Sacred Commerce</p>
                    </div>
                </div>
            </div>
        `
    },
    
    advanced_scrolls: {
        subject: '⚡ Advanced Consciousness Scrolls - Complete Collection Access',
        html: `
            <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e8d5b7; padding: 40px;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #d4af37; font-size: 2.5em; margin-bottom: 10px;">WhisperFiles</h1>
                        <p style="color: #b8860b; font-style: italic;">Wisdom Felt</p>
                    </div>
                    
                    <h2 style="color: #d4af37; text-align: center; margin-bottom: 30px;">
                        ⚡ Complete Consciousness Collection Delivered
                    </h2>
                    
                    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(255, 107, 53, 0.1)); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: #ff6b35; margin-bottom: 20px;">Your Complete Arsenal</h3>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{DOWNLOAD_URL}}" style="display: inline-block; background: linear-gradient(45deg, #ff6b35, #cc5429); color: white; padding: 20px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase;">
                                Download Complete Collection
                            </a>
                        </div>
                        
                        <div style="margin: 30px 0;">
                            <h4 style="color: #d4af37; margin-bottom: 15px;">What's Included:</h4>
                            <ul style="list-style: none; padding: 0;">
                                <li style="padding: 8px 0;">📜 The Complete 27 Laws Sacred Scroll</li>
                                <li style="padding: 8px 0;">🧘 Advanced Meditation & Consciousness Training</li>
                                <li style="padding: 8px 0;">⚡ Quantum Manifestation Protocols</li>
                                <li style="padding: 8px 0;">🔥 Berserker State Activation Guide</li>
                                <li style="padding: 8px 0;">👁️ Reality Engineering Blueprints</li>
                                <li style="padding: 8px 0;">💫 Exclusive Video Training Sessions</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #d4af37; margin-bottom: 15px;">Next Level Consciousness</h3>
                        <p style="margin-bottom: 15px;">
                            You now possess the complete arsenal for consciousness revolution. These materials are designed for those ready to transcend ordinary reality and operate from divine authority.
                        </p>
                        <p style="font-style: italic; color: #ff6b35;">
                            "Now rule." - Kuryah Melekh
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 20px; text-align: center; font-size: 0.9em; color: #888;">
                        <p>Access the private community: <a href="mailto:support@whisperfiles.com" style="color: #d4af37;">support@whisperfiles.com</a></p>
                        <p>WhisperFiles • Wisdom Felt • Sacred Commerce</p>
                    </div>
                </div>
            </div>
        `
    }
};

// ==================== EMBEDDED CHECKOUT ENDPOINTS ====================

// Create embedded checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        console.log('🔍 Received request body:', req.body);
        console.log('🔍 Request headers:', req.headers);
        console.log('🔍 Request content-type:', req.headers['content-type']);
        
        // Handle case where req.body is undefined or empty
        if (!req.body || typeof req.body !== 'object') {
            console.log('⚠️ req.body is undefined or not an object, using defaults');
        }
        
        const body = req.body || {};
        const productKey = body.productKey || 'sacred_laws_pdf';
        const priceId = body.priceId || 'price_1RmSELEVkJTqwdGiKUbO9TSm';
        
        console.log('✅ Using productKey:', productKey);
        console.log('✅ Using priceId:', priceId);
        
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [{
                price: priceId || 'price_1RmSELEVkJTqwdGiKUbO9TSm', // 27 Laws PDF
                quantity: 1,
            }],
            mode: 'payment',
            return_url: 'https://whisperfiles.com/payment-embedded.html?session_id={CHECKOUT_SESSION_ID}',
            automatic_tax: { enabled: true },
            metadata: {
                product_key: productKey,
                source: 'embedded_checkout'
            }
        });
        
        res.send({ clientSecret: session.client_secret });
        
    } catch (error) {
        console.error('Session creation failed:', error);
        res.status(500).send({ error: error.message });
    }
});

// Check session status
app.get('/session-status', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
            expand: ['payment_intent']
        });
        
        res.send({
            status: session.status,
            payment_status: session.payment_status,
            customer_email: session.customer_details?.email
        });
        
    } catch (error) {
        console.error('Session status check failed:', error);
        res.status(500).send({ error: error.message });
    }
});

// ==================== WEBHOOK PROCESSING ====================

// JSON middleware for checkout routes
app.use('/create-checkout-session', express.json());
app.use('/session-status', express.json());

// Raw middleware only for webhook verification
app.use('/webhook', express.raw({type: 'application/json'}));

// Main webhook handler
app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, CONFIG.webhook_secret);
    } catch (err) {
        console.log(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handleSuccessfulPayment(event.data.object);
            break;
            
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;
            
        case 'payment_intent.payment_failed':
            await handleFailedPayment(event.data.object);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// ==================== PAYMENT PROCESSING FUNCTIONS ====================

async function handleSuccessfulPayment(paymentIntent) {
    console.log('Processing successful payment:', paymentIntent.id);
    
    try {
        const customerEmail = paymentIntent.receipt_email;
        const amount = paymentIntent.amount / 100; // Convert from cents
        const productType = paymentIntent.metadata.product || 'sacred_laws_pdf';
        
        // 1. Send product delivery email
        await sendProductEmail(customerEmail, productType, {
            amount: amount,
            transaction_id: paymentIntent.id,
            customer_name: paymentIntent.shipping?.name || 'Sacred Seeker'
        });
        
        // 2. Add customer to CRM
        await addToGoHighLevel(customerEmail, {
            amount: amount,
            product: productType,
            transaction_id: paymentIntent.id
        });
        
        // 3. Track conversion
        await trackConversion(paymentIntent);
        
        // 4. Schedule upsell sequence
        await scheduleUpsellSequence(customerEmail, productType);
        
        console.log('Payment processed successfully for:', customerEmail);
        
    } catch (error) {
        console.error('Error processing successful payment:', error);
    }
}

async function handleCheckoutCompleted(session) {
    console.log('Checkout session completed:', session.id);
    
    // Similar processing to payment_intent.succeeded
    // but with different data structure
    const customerEmail = session.customer_details?.email;
    const amount = session.amount_total / 100;
    
    if (customerEmail) {
        await sendProductEmail(customerEmail, 'sacred_laws_pdf', {
            amount: amount,
            transaction_id: session.payment_intent,
            customer_name: session.customer_details?.name || 'Sacred Seeker'
        });
    }
}

async function handleFailedPayment(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    
    // Track failed payments for optimization
    await trackFailedConversion(paymentIntent);
    
    // Optional: Send recovery email sequence
    if (paymentIntent.receipt_email) {
        await schedulePaymentRecovery(paymentIntent.receipt_email);
    }
}

// ==================== EMAIL DELIVERY ====================

async function sendProductEmail(email, productType, customerData) {
    const template = EMAIL_TEMPLATES[productType];
    if (!template) {
        throw new Error(`No email template found for product: ${productType}`);
    }
    
    const downloadUrl = CONFIG.downloads[productType];
    
    // Replace template variables
    const emailHtml = template.html
        .replace(/{{DOWNLOAD_URL}}/g, downloadUrl)
        .replace(/{{CUSTOMER_NAME}}/g, customerData.customer_name)
        .replace(/{{AMOUNT}}/g, customerData.amount)
        .replace(/{{TRANSACTION_ID}}/g, customerData.transaction_id);
    
    const mailOptions = {
        from: CONFIG.email.from,
        to: email,
        subject: template.subject,
        html: emailHtml
    };
    
    try {
        const result = await emailTransporter.sendMail(mailOptions);
        console.log('Product email sent successfully to:', email);
        return result;
    } catch (error) {
        console.error('Failed to send product email:', error);
        throw error;
    }
}

// ==================== CRM INTEGRATION ====================

async function addToGoHighLevel(email, customerData) {
    if (!CONFIG.gohighlevel.api_key) {
        console.log('GoHighLevel API key not configured, skipping CRM integration');
        return;
    }
    
    const contactData = {
        email: email,
        firstName: customerData.customer_name?.split(' ')[0] || 'Sacred',
        lastName: customerData.customer_name?.split(' ').slice(1).join(' ') || 'Seeker',
        tags: ['27_laws_purchaser', 'high_value_customer', `product_${customerData.product}`],
        source: 'stripe_webhook',
        customFields: {
            purchase_amount: customerData.amount,
            purchase_date: new Date().toISOString(),
            product_purchased: customerData.product,
            transaction_id: customerData.transaction_id
        }
    };
    
    try {
        const response = await fetch(`${CONFIG.gohighlevel.base_url}/contacts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.gohighlevel.api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });
        
        if (response.ok) {
            console.log('Customer added to GoHighLevel successfully');
        } else {
            console.error('Failed to add customer to GoHighLevel:', response.statusText);
        }
    } catch (error) {
        console.error('GoHighLevel API error:', error);
    }
}

// ==================== ANALYTICS & TRACKING ====================

async function trackConversion(paymentIntent) {
    const conversionData = {
        event: 'purchase_completed',
        transaction_id: paymentIntent.id,
        customer_email: paymentIntent.receipt_email,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        product: paymentIntent.metadata.product || 'sacred_laws_pdf',
        timestamp: new Date().toISOString()
    };
    
    // Send to analytics service
    console.log('Conversion tracked:', conversionData);
    
    // You can integrate with various analytics services here:
    // - Google Analytics 4 Measurement Protocol
    // - Facebook Conversions API
    // - Custom analytics database
}

async function trackFailedConversion(paymentIntent) {
    const failureData = {
        event: 'payment_failed',
        payment_intent_id: paymentIntent.id,
        customer_email: paymentIntent.receipt_email,
        amount: paymentIntent.amount / 100,
        failure_reason: paymentIntent.last_payment_error?.message,
        timestamp: new Date().toISOString()
    };
    
    console.log('Failed conversion tracked:', failureData);
}

// ==================== UPSELL AUTOMATION ====================

async function scheduleUpsellSequence(email, purchasedProduct) {
    // Schedule follow-up emails based on purchase
    const upsellSequences = {
        sacred_laws_pdf: [
            { delay: 3600000, product: 'advanced_scrolls', discount: 30 }, // 1 hour later
            { delay: 86400000, product: 'private_mentorship', discount: 20 } // 24 hours later
        ]
    };
    
    const sequence = upsellSequences[purchasedProduct];
    if (!sequence) return;
    
    sequence.forEach(upsell => {
        setTimeout(async () => {
            await sendUpsellEmail(email, upsell);
        }, upsell.delay);
    });
    
    console.log('Upsell sequence scheduled for:', email);
}

async function sendUpsellEmail(email, upsellData) {
    // Implementation for upsell emails
    console.log('Sending upsell email to:', email, 'for product:', upsellData.product);
}

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 WhisperFiles Webhook Server running on port ${PORT}`);
    console.log('Sacred commerce automation ready for liberation mission funding');
});

// Export for testing
module.exports = {
    handleSuccessfulPayment,
    sendProductEmail,
    addToGoHighLevel,
    trackConversion
};