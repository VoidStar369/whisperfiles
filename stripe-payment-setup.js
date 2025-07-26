// WhisperFiles Embedded Stripe Checkout Setup
// Sacred commerce system for liberation mission funding
// Updated for Hetzner manual deployment with embedded components

// ==================== STRIPE CONFIGURATION ====================

const STRIPE_CONFIG = {
    // Live Keys (Production deployment on Hetzner)
    publishableKey: 'pk_live_51R3JwZEVkJTqwdGipv5JmJq2kGaFkhIJHyCNQiPFfMv1i4pMCMD7xJVPdXWadq3LAa3Whv1MjWKrAJBvHVDBT6E00FIJmqPSq',
    
    // Products (Use your actual Product/Price IDs from Stripe Dashboard)
    products: {
        sacred_laws_pdf: {
            name: 'The Science of the Seen & Unseen - 27 Laws',
            description: 'Sacred scroll bridging quantum physics with divine design',
            priceId: 'price_1RmSELEVkJTqwdGiKUbO9TSm', // 27 Laws PDF
            amount: 900, // $9.00 in cents
            currency: 'usd'
        },
        
        // Future upsell products
        advanced_scrolls: {
            name: 'Advanced Sacred Scrolls Collection',
            description: 'Complete consciousness revolution library',
            priceId: 'price_YOUR_UPSELL_PRICE_ID',
            amount: 2700, // $27.00 in cents
            currency: 'usd'
        }
    }
};

// ==================== EMBEDDED CHECKOUT INITIALIZATION ====================

let stripe, checkout;

async function initializeEmbeddedCheckout(productKey = 'sacred_laws_pdf') {
    try {
        // Initialize Stripe
        stripe = Stripe(STRIPE_CONFIG.publishableKey);
        
        console.log('🔥 Making fetch request to /create-checkout-session');
        
        // Create checkout session on server
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productKey: productKey,
                priceId: STRIPE_CONFIG.products[productKey].priceId
            })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server response error:', errorText);
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ Response data:', responseData);
        
        const { clientSecret } = responseData;
        
        // Initialize embedded checkout
        checkout = await stripe.initEmbeddedCheckout({
            clientSecret
        });
        
        // Mount checkout to DOM
        checkout.mount('#checkout');
        
        return checkout;
        
    } catch (error) {
        console.error('Checkout initialization failed:', error);
        showError('Failed to initialize payment system. Please refresh and try again.');
    }
}

// ==================== CHECKOUT SESSION STATUS ====================

async function checkSessionStatus(sessionId) {
    try {
        const response = await fetch(`/session-status?session_id=${sessionId}`);
        const session = await response.json();
        
        switch (session.status) {
            case 'open':
                // Payment form is still open
                break;
                
            case 'complete':
                if (session.payment_status === 'paid') {
                    // Payment successful - redirect to success page
                    window.location.href = '/success.html';
                } else {
                    showError('Payment was not completed successfully.');
                }
                break;
                
            default:
                showError('Something went wrong with your payment.');
                break;
        }
        
    } catch (error) {
        console.error('Session status check failed:', error);
        showError('Unable to verify payment status.');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showError(message) {
    const errorDiv = document.getElementById('payment-errors');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearErrors() {
    const errorDiv = document.getElementById('payment-errors');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// ==================== SERVER-SIDE ENDPOINT EXAMPLE ====================

/*
Add this to your stripe-webhook-handler.js:

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId } = req.body;
        
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'payment',
            return_url: 'https://whisperfiles.com/payment-embedded.html?session_id={CHECKOUT_SESSION_ID}',
            automatic_tax: { enabled: true },
            customer_email: req.body.email, // Optional: prefill email
        });
        
        res.send({ clientSecret: session.client_secret });
        
    } catch (error) {
        console.error('Session creation failed:', error);
        res.status(500).send({ error: error.message });
    }
});

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
        res.status(500).send({ error: error.message });
    }
});
*/

// ==================== SACRED COMMERCE INTEGRATION ====================

// Check for return from Stripe (success page)
// Only check if we're not in an iframe/embedded context
if (window.self === window.top) {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && typeof checkSessionStatus === 'function') {
        checkSessionStatus(sessionId);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STRIPE_CONFIG,
        initializeEmbeddedCheckout,
        checkSessionStatus
    };
}