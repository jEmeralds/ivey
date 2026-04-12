// backend/src/routes/payments.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Paystack payment integration
// Handles subscription checkout, webhook verification, plan activation
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '../middleware/plan.middleware.js';
import crypto from 'crypto';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ivey-steel.vercel.app';
const PS_SECRET    = () => process.env.PAYSTACK_SECRET_KEY;

// ── Plan codes from Paystack dashboard ───────────────────────────────────────
const PLAN_CODES = {
  starter: 'PLN_2dnxej2pqh11g8z',
  creator: 'PLN_ybpfcexh8y4v4n4',
  studio:  'PLN_3gbocggawufp87b',
};

const PLAN_PRICES = { starter: 19, creator: 49, studio: 99 };

// ── Helper: activate plan in DB ───────────────────────────────────────────────
const activatePlan = async (userId, plan) => {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  await supabase.from('users').update({
    plan,
    plan_expires_at:  expires.toISOString(),
    payment_provider: 'paystack',
  }).eq('id', userId);
  console.log(`✅ Plan activated: user ${userId} → ${plan}`);
};

// ── Paystack API helper ───────────────────────────────────────────────────────
const paystack = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PS_SECRET()}`,
      'Content-Type':  'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res  = await fetch(`https://api.paystack.co${endpoint}`, options);
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Paystack error');
  return data;
};

// ── GET /api/payments/status ──────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    configured: !!PS_SECRET(),
    provider:   'paystack',
  });
});

// ── GET /api/payments/me ──────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('plan, plan_expires_at, trial_used, videos_used, posts_used')
      .eq('id', req.userId)
      .single();

    res.json({
      plan:            user?.plan            || 'free',
      plan_expires_at: user?.plan_expires_at || null,
      trial_used:      user?.trial_used      || false,
      videos_used:     user?.videos_used     || 0,
      posts_used:      user?.posts_used      || 0,
      limits:          PLANS[user?.plan || 'free'],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/checkout ───────────────────────────────────────────────
// Initialises a Paystack subscription checkout
// Body: { plan, currency } — 'KES' or 'USD'
router.post('/checkout', auth, async (req, res) => {
  if (!PS_SECRET()) {
    return res.status(503).json({
      error:      'Payments not configured',
      message:    'Add PAYSTACK_SECRET_KEY to Railway environment variables.',
      configured: false,
    });
  }

  const { plan, currency = 'KES' } = req.body;

  if (!['starter', 'creator', 'studio'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const { data: user } = await supabase
      .from('users').select('email, name').eq('id', req.userId).single();

    const planCode = PLAN_CODES[plan];
    const priceUSD = PLAN_PRICES[plan];
    const KES_RATE = 130;

    // Paystack amounts are in the smallest currency unit
    // KES: amount in cents (1 KES = 100 cents)
    // USD: amount in cents (1 USD = 100 cents)
    const priceKES = Math.round(priceUSD * KES_RATE);
    const amount   = currency === 'KES'
      ? priceKES * 100   // KES in cents
      : priceUSD * 100;  // USD in cents

    const txRef = `ivey-${req.userId}-${plan}-${Date.now()}`;

    const data = await paystack('POST', '/transaction/initialize', {
      email:       user?.email || '',
      amount,
      currency,
      plan:        planCode,
      ref:         txRef,
      callback_url: `${FRONTEND_URL}/dashboard?section=settings&upgrade=success&plan=${plan}`,
      metadata: {
        ivey_user_id: req.userId,
        plan,
        currency,
        custom_fields: [
          { display_name: 'Plan',     variable_name: 'plan',     value: plan    },
          { display_name: 'User ID',  variable_name: 'user_id',  value: req.userId },
        ],
      },
    });

    // Log the transaction reference
    await supabase.from('payment_refs').insert({
      user_id:    req.userId,
      tx_ref:     txRef,
      plan,
      provider:   'paystack',
      amount:     amount / 100,
      currency,
      status:     'pending',
      created_at: new Date().toISOString(),
    }).catch(() => {});

    res.json({
      url:   data.data.authorization_url,
      txRef: data.data.reference,
    });
  } catch (err) {
    console.error('Paystack checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/verify/:reference ──────────────────────────────────────
// Verifies payment after user returns from Paystack
router.get('/verify/:reference', auth, async (req, res) => {
  if (!PS_SECRET()) return res.status(503).json({ error: 'Payments not configured' });

  try {
    const data   = await paystack('GET', `/transaction/verify/${req.params.reference}`);
    const txData = data.data;

    if (txData.status !== 'success') {
      return res.status(400).json({
        error:  'Payment not completed',
        status: txData.status,
      });
    }

    const userId = txData.metadata?.ivey_user_id;
    const plan   = txData.metadata?.plan;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'Missing payment metadata' });
    }

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Payment verification mismatch' });
    }

    await activatePlan(userId, plan);

    await supabase.from('payment_refs')
      .update({ status: 'completed' })
      .eq('tx_ref', req.params.reference)
      .catch(() => {});

    res.json({ success: true, plan, message: `${plan} plan activated!` });
  } catch (err) {
    console.error('Paystack verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Paystack webhook — handles subscription events
// Webhook URL: https://ivey-production.up.railway.app/api/payments/webhook
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const secret    = PS_SECRET();
  const signature = req.headers['x-paystack-signature'];

  // Verify webhook signature
  if (secret && signature) {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Paystack webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { event: eventName, data } = event;
  console.log(`📦 Paystack webhook: ${eventName}`);

  try {
    switch (eventName) {

      // ── Initial payment success ───────────────────────────────────────────
      case 'charge.success': {
        const userId = data?.metadata?.ivey_user_id;
        const plan   = data?.metadata?.plan;
        if (userId && plan && data?.status === 'success') {
          await activatePlan(userId, plan);
          await supabase.from('payment_refs')
            .update({ status: 'completed' })
            .eq('tx_ref', data?.reference)
            .catch(() => {});
        }
        break;
      }

      // ── Subscription created / renewed ────────────────────────────────────
      case 'subscription.create':
      case 'invoice.payment_failed':
      case 'invoice.update': {
        // Find user by customer email
        const email = data?.customer?.email;
        if (!email) break;

        const { data: user } = await supabase
          .from('users').select('id').eq('email', email).single();
        if (!user) break;

        // Map plan code to plan name
        const planCode = data?.plan?.plan_code;
        const plan = Object.entries(PLAN_CODES).find(([, code]) => code === planCode)?.[0];
        if (!plan) break;

        if (eventName === 'subscription.create' || eventName === 'invoice.update') {
          await activatePlan(user.id, plan);
        }
        break;
      }

      // ── Subscription disabled / cancelled ─────────────────────────────────
      case 'subscription.disable': {
        const email = data?.customer?.email;
        if (!email) break;
        const { data: user } = await supabase
          .from('users').select('id').eq('email', email).single();
        if (user) {
          await supabase.from('users').update({
            plan:            'free',
            plan_expires_at: null,
          }).eq('id', user.id);
          console.log(`❌ Subscription cancelled: ${email} → free`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Paystack webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/history ─────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('payment_refs')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json({ payments: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;