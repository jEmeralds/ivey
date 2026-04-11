// backend/src/middleware/plan.middleware.js
// ─────────────────────────────────────────────────────────────────────────────
// Plan enforcement middleware for IVey
// Checks user plan before allowing access to paid features
// Plans: free | trial | starter | creator | studio
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    name:          'Free',
    videos:        0,
    posts:         0,
    brands:        1,
    products:      3,
    ai_providers:  ['gemini'],
    strategy:      false,
    distribution:  false,
    video_gen:     false,
  },
  trial: {
    name:          'Free Trial',
    videos:        2,
    posts:         20,
    brands:        5,
    products:      999,
    ai_providers:  ['gemini', 'claude', 'claude-haiku', 'openai', 'openai-mini'],
    strategy:      true,
    distribution:  true,
    video_gen:     true,
    duration_days: 7,
  },
  starter: {
    name:          'Starter',
    price:         19,
    videos:        0,
    posts:         20,
    brands:        2,
    products:      10,
    ai_providers:  ['gemini', 'claude-haiku'],
    strategy:      true,
    distribution:  true,
    video_gen:     false,
  },
  creator: {
    name:          'Creator',
    price:         49,
    videos:        5,
    posts:         50,
    brands:        5,
    products:      999,
    ai_providers:  ['gemini', 'claude-haiku', 'claude'],
    strategy:      true,
    distribution:  true,
    video_gen:     true,
  },
  studio: {
    name:          'Studio',
    price:         99,
    videos:        20,
    posts:         999,
    brands:        999,
    products:      999,
    ai_providers:  ['gemini', 'claude-haiku', 'claude', 'openai', 'openai-mini'],
    strategy:      true,
    distribution:  true,
    video_gen:     true,
  },
};

// ── Get user with plan info ───────────────────────────────────────────────────
export const getUserPlan = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, plan, plan_expires_at, trial_started_at, trial_used, videos_used, posts_used, usage_reset_at')
    .eq('id', userId)
    .single();

  if (error || !user) return null;

  // Check if trial expired
  let effectivePlan = user.plan || 'free';
  if (effectivePlan === 'trial' && user.plan_expires_at) {
    if (new Date(user.plan_expires_at) < new Date()) {
      effectivePlan = 'free';
      // Update DB
      await supabase.from('users').update({ plan: 'free', plan_expires_at: null }).eq('id', userId);
    }
  }

  // Check if paid plan expired
  if (['starter', 'creator', 'studio'].includes(effectivePlan) && user.plan_expires_at) {
    if (new Date(user.plan_expires_at) < new Date()) {
      effectivePlan = 'free';
      await supabase.from('users').update({ plan: 'free', plan_expires_at: null }).eq('id', userId);
    }
  }

  // Reset monthly usage if needed
  const lastReset = user.usage_reset_at ? new Date(user.usage_reset_at) : new Date(0);
  const now       = new Date();
  const needsReset = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
  if (needsReset) {
    await supabase.from('users').update({
      videos_used:    0,
      posts_used:     0,
      usage_reset_at: now.toISOString(),
    }).eq('id', userId);
    user.videos_used = 0;
    user.posts_used  = 0;
  }

  return {
    ...user,
    plan:          effectivePlan,
    limits:        PLANS[effectivePlan] || PLANS.free,
  };
};

// ── Middleware: require minimum plan ─────────────────────────────────────────
export const requirePlan = (...allowedPlans) => async (req, res, next) => {
  try {
    const userPlan = await getUserPlan(req.userId);
    if (!userPlan) return res.status(401).json({ error: 'User not found' });

    req.userPlan = userPlan;

    if (!allowedPlans.includes(userPlan.plan)) {
      return res.status(403).json({
        error:    'Plan upgrade required',
        message:  `This feature requires a ${allowedPlans[0]} plan or higher.`,
        required: allowedPlans[0],
        current:  userPlan.plan,
        upgrade:  true,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Middleware: check video generation limit ──────────────────────────────────
export const checkVideoLimit = async (req, res, next) => {
  try {
    const userPlan = await getUserPlan(req.userId);
    if (!userPlan) return res.status(401).json({ error: 'User not found' });

    req.userPlan = userPlan;

    const limit = userPlan.limits.videos;

    if (!userPlan.limits.video_gen) {
      return res.status(403).json({
        error:   'Video generation not available on your plan',
        message: 'Upgrade to Creator or Studio to generate videos with HeyGen.',
        upgrade: true,
        current: userPlan.plan,
      });
    }

    if (limit !== 999 && userPlan.videos_used >= limit) {
      return res.status(403).json({
        error:   'Monthly video limit reached',
        message: `You have used all ${limit} videos for this month. Resets on the 1st.`,
        used:    userPlan.videos_used,
        limit,
        upgrade: true,
        current: userPlan.plan,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Middleware: check distribution/post limit ─────────────────────────────────
export const checkPostLimit = async (req, res, next) => {
  try {
    const userPlan = await getUserPlan(req.userId);
    if (!userPlan) return res.status(401).json({ error: 'User not found' });

    req.userPlan = userPlan;

    const limit = userPlan.limits.posts;

    if (!userPlan.limits.distribution) {
      return res.status(403).json({
        error:   'Distribution not available on your plan',
        message: 'Upgrade to Starter or higher to distribute videos.',
        upgrade: true,
        current: userPlan.plan,
      });
    }

    if (limit !== 999 && userPlan.posts_used >= limit) {
      return res.status(403).json({
        error:   'Monthly post limit reached',
        message: `You have used all ${limit} posts for this month. Resets on the 1st.`,
        used:    userPlan.posts_used,
        limit,
        upgrade: true,
        current: userPlan.plan,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Increment usage counters ──────────────────────────────────────────────────
export const incrementVideoUsage = async (userId) => {
  await supabase.rpc('increment_videos_used', { user_id_input: userId })
    .catch(() =>
      supabase.from('users')
        .update({ videos_used: supabase.raw('videos_used + 1') })
        .eq('id', userId)
    );
};

export const incrementPostUsage = async (userId) => {
  const { data: user } = await supabase.from('users').select('posts_used').eq('id', userId).single();
  if (user) {
    await supabase.from('users').update({ posts_used: (user.posts_used || 0) + 1 }).eq('id', userId);
  }
};

// ── Start trial ───────────────────────────────────────────────────────────────
export const startTrial = async (userId) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await supabase.from('users').update({
    plan:             'trial',
    plan_expires_at:  expires.toISOString(),
    trial_started_at: new Date().toISOString(),
    trial_used:       true,
  }).eq('id', userId);
};