// frontend/src/components/PlanGate.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Wraps any feature that requires a paid plan
// Shows upgrade prompt if user's plan is insufficient
// Shows trial activation if user hasn't used trial yet
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLAN_ORDER = { free: 0, trial: 4, starter: 1, creator: 2, studio: 3 };

const PLAN_LABELS = {
  starter: { name: 'Starter', price: '$19/mo', color: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300'    },
  creator: { name: 'Creator', price: '$49/mo', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  studio:  { name: 'Studio',  price: '$99/mo', color: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300'  },
};

// ── Hook: get user plan ───────────────────────────────────────────────────────
export const useUserPlan = () => {
  const [plan,      setPlan]      = useState(null);
  const [trialUsed, setTrialUsed] = useState(true);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const res  = await fetch(`${API_URL}/payments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPlan(data.plan || 'free');
        setTrialUsed(data.trial_used || false);
      } catch {
        setPlan('free');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const canAccess = (requiredPlan) => {
    if (!plan) return false;
    return PLAN_ORDER[plan] >= PLAN_ORDER[requiredPlan];
  };

  return { plan, trialUsed, loading, canAccess };
};

// ── PlanGate component ────────────────────────────────────────────────────────
const PlanGate = ({
  children,
  requiredPlan = 'starter',   // minimum plan required
  feature = 'This feature',   // feature name for display
  description = '',           // optional description
}) => {
  const navigate                = useNavigate();
  const { plan, trialUsed, loading, canAccess } = useUserPlan();
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [trialError,      setTrialError]      = useState('');
  const [trialDone,       setTrialDone]       = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"/>
    </div>
  );

  // User has access — render children normally
  if (canAccess(requiredPlan) || trialDone) return children;

  const planMeta     = PLAN_LABELS[requiredPlan] || PLAN_LABELS.starter;
  const showTrial    = !trialUsed && plan === 'free';

  const handleTrial = async () => {
    setActivatingTrial(true); setTrialError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/settings/trial`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setTrialDone(true);
      // Reload page after short delay to refresh plan state
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setTrialError(err.message);
    } finally {
      setActivatingTrial(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Blurred preview of content */}
      <div className="select-none pointer-events-none opacity-30 blur-sm">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="text-center px-6 py-8 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mx-auto mb-4">
            🔒
          </div>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
            {feature} requires {planMeta.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            {description || `Upgrade to ${planMeta.name} (${planMeta.price}) to unlock this feature.`}
          </p>

          {trialError && (
            <p className="text-xs text-red-400 mb-3">⚠️ {trialError}</p>
          )}

          <div className="space-y-2">
            {/* Start trial CTA — only for free users who haven't trialed */}
            {showTrial && (
              <button onClick={handleTrial} disabled={activatingTrial}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50">
                {activatingTrial ? '⏳ Activating...' : '🎁 Start 7-Day Free Trial'}
              </button>
            )}

            {/* Upgrade CTA */}
            <button onClick={() => navigate('/dashboard?section=settings&tab=plan')}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                showTrial
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-800 shadow-lg'
              }`}>
              {showTrial ? `View Plans →` : `⚡ Upgrade to ${planMeta.name}`}
            </button>

            {/* Current plan indicator */}
            <p className="text-xs text-gray-400 mt-2">
              You're on the <span className="font-semibold capitalize">{plan}</span> plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanGate;