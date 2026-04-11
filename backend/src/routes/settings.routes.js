// backend/src/routes/settings.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// User settings, plan management, trial activation
// Stripe webhook handling
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createClient } from '@supabase/supabase-js';
import { PLANS, getUserPlan, startTrial } from '../middleware/plan.middleware.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const STRIPE_SECRET     = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK    = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL      = process.env.FRONTEND_URL || 'https://ivey-steel.vercel.app';

// ── Stripe price IDs — set these in Railway after creating products in Stripe
const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  creator: process.env.STRIPE_PRICE_CREATOR,
  studio:  process.env.STRIPE_PRICE_STUDIO,
};

// ── GET /api/settings/me ──────────────────────────────────────────────────────
// Returns user profile + plan + usage
router.get('/me', auth, async (req, res) => {
  try {
    const userPlan = await getUserPlan(req.userId);
    if (!userPlan) return res.status(404).json({ error: 'User not found' });

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, created_at, role')
      .eq('id', req.userId)
      .single();

    res.json({
      user: {
        ...user,
        plan:           userPlan.plan,
        plan_expires_at: userPlan.plan_expires_at,
        trial_used:     userPlan.trial_used,
        videos_used:    userPlan.videos_used,
        posts_used:     userPlan.posts_used,
        usage_reset_at: userPlan.usage_reset_at,
        limits:         userPlan.limits,
        plans:          PLANS,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/settings/profile ─────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', req.userId)
      .select('id, name, email')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ user: data, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/settings/trial ──────────────────────────────────────────────────
// Activates 7-day free trial — only once per user
router.post('/trial', auth, async (req, res) => {
  try {
    const userPlan = await getUserPlan(req.userId);
    if (!userPlan) return res.status(404).json({ error: 'User not found' });

    if (userPlan.trial_used) {
      return res.status(400).json({ error: 'Trial already used', message: 'You have already used your free trial.' });
    }

    if (['starter', 'creator', 'studio'].includes(userPlan.plan)) {
      return res.status(400).json({ error: 'Already on a paid plan' });
    }

    await startTrial(req.userId);

    res.json({
      message: '7-day free trial activated! Enjoy full access to IVey.',
      plan:    'trial',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/settings/checkout ───────────────────────────────────────────────
// Creates Stripe checkout session for plan upgrade
router.post('/checkout', auth, async (req, res) => {
  if (!STRIPE_SECRET) {
    return res.status(503).json({
      error:      'Stripe not configured',
      message:    'Add STRIPE_SECRET_KEY to Railway environment variables.',
      configured: false,
    });
  }

  const { plan } = req.body;
  if (!['starter', 'creator', 'studio'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return res.status(503).json({
      error:   'Stripe price not configured',
      message: `Add STRIPE_PRICE_${plan.toUpperCase()} to Railway environment variables.`,
    });
  }

  try {
    const stripe = (await import('stripe')).default(STRIPE_SECRET);

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('email, name, stripe_customer_id')
      .eq('id', req.userId)
      .single();

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  user.name,
        metadata: { ivey_user_id: req.userId },
      });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?section=settings&upgrade=success&plan=${plan}`,
      cancel_url:  `${FRONTEND_URL}/dashboard?section=settings&upgrade=cancelled`,
      metadata: { ivey_user_id: req.userId, plan },
      subscription_data: {
        metadata: { ivey_user_id: req.userId, plan },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/settings/portal ─────────────────────────────────────────────────
// Opens Stripe billing portal (manage/cancel subscription)
router.post('/portal', auth, async (req, res) => {
  if (!STRIPE_SECRET) return res.status(503).json({ error: 'Stripe not configured' });

  try {
    const stripe = (await import('stripe')).default(STRIPE_SECRET);

    const { data: user } = await supabase
      .from('users').select('stripe_customer_id').eq('id', req.userId).single();

    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripe_customer_id,
      return_url: `${FRONTEND_URL}/dashboard?section=settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/settings/webhook ────────────────────────────────────────────────
// Stripe webhook — handles subscription events
// Must be registered BEFORE express.json() middleware in server.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!STRIPE_SECRET || !STRIPE_WEBHOOK) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }

  let event;
  try {
    const stripe = (await import('stripe')).default(STRIPE_SECRET);
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const planFromPriceId = (priceId) => {
    for (const [plan, id] of Object.entries(PRICE_IDS)) {
      if (id === priceId) return plan;
    }
    return null;
  };

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session  = event.data.object;
        const userId   = session.metadata?.ivey_user_id;
        const plan     = session.metadata?.plan;
        if (!userId || !plan) break;

        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);

        await supabase.from('users').update({
          plan,
          plan_expires_at: expires.toISOString(),
          stripe_sub_id:   session.subscription,
        }).eq('id', userId);

        console.log(`✅ Plan upgraded: user ${userId} → ${plan}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice  = event.data.object;
        const subId    = invoice.subscription;
        const { data: user } = await supabase.from('users').select('id, plan').eq('stripe_sub_id', subId).single();
        if (!user) break;

        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        await supabase.from('users').update({ plan_expires_at: expires.toISOString() }).eq('id', user.id);
        console.log(`✅ Subscription renewed: user ${user.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata?.ivey_user_id;
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = planFromPriceId(priceId) || 'free';
        const expires = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await supabase.from('users').update({ plan, plan_expires_at: expires }).eq('id', userId);
        console.log(`📝 Subscription updated: user ${userId} → ${plan}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.ivey_user_id;
        if (!userId) break;

        await supabase.from('users').update({
          plan:            'free',
          plan_expires_at: null,
          stripe_sub_id:   null,
        }).eq('id', userId);

        console.log(`❌ Subscription cancelled: user ${userId} → free`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;