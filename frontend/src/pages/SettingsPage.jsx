// frontend/src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Plan config (mirrors backend) ─────────────────────────────────────────────
const PLAN_META = {
  free:    { label: 'Free',    color: 'text-gray-400',    badge: 'bg-gray-700 text-gray-300',           price: '$0'   },
  trial:   { label: 'Trial',   color: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300',      price: 'Free' },
  starter: { label: 'Starter', color: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300',        price: '$19'  },
  creator: { label: 'Creator', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300',  price: '$49'  },
  studio:  { label: 'Studio',  color: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300',    price: '$99'  },
};

const PLAN_FEATURES = {
  free:    ['Unlimited AI scripts', 'Gemini AI only', '1 brand', '3 products', 'No video generation', 'No distribution'],
  trial:   ['Everything in Studio', 'All AI providers', '2 HeyGen videos', '20 posts', '7 days only'],
  starter: ['Unlimited AI scripts', 'Gemini + Claude Haiku', '2 brands', '10 products', 'No video generation', '20 posts/month'],
  creator: ['Unlimited AI scripts', 'Gemini + Claude Haiku + Sonnet', '5 brands', 'Unlimited products', '5 HeyGen videos/month', '50 posts/month'],
  studio:  ['Unlimited AI scripts', 'All AI providers', 'Unlimited brands', 'Unlimited products', '20 HeyGen videos/month', 'Unlimited posts'],
};

// ── Usage Bar ─────────────────────────────────────────────────────────────────
const UsageBar = ({ label, used, limit, color = 'bg-emerald-500' }) => {
  const isUnlimited = limit === 999;
  const pct         = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isHigh      = pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`text-xs font-bold ${isHigh ? 'text-red-400' : 'text-gray-400 dark:text-gray-300'}`}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isHigh ? 'bg-red-500' : color}`}
            style={{ width: `${pct}%` }} />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full h-1.5 bg-emerald-500/20 rounded-full">
          <div className="h-full w-full bg-emerald-500/40 rounded-full" />
        </div>
      )}
    </div>
  );
};

// ── Plan Card ─────────────────────────────────────────────────────────────────
const PlanCard = ({ planKey, current, onUpgrade, loading }) => {
  const meta     = PLAN_META[planKey];
  const features = PLAN_FEATURES[planKey];
  const isCurrent = current === planKey;
  const isDowngrade = ['studio', 'creator', 'starter'].indexOf(current) >
                      ['studio', 'creator', 'starter'].indexOf(planKey);

  return (
    <div className={`relative p-5 rounded-2xl border-2 transition-all ${
      isCurrent
        ? 'border-emerald-500 bg-emerald-500/5'
        : planKey === 'creator'
          ? 'border-violet-500/40 bg-violet-500/5'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
    }`}>
      {planKey === 'creator' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-xs font-black rounded-full">
          MOST POPULAR
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-lg font-black ${meta.color}`}>{meta.label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
            {meta.price}<span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
        </div>
        {isCurrent && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${meta.badge}`}>Current</span>
        )}
      </div>
      <ul className="space-y-2 mb-5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>
      {!isCurrent && planKey !== 'free' && planKey !== 'trial' && (
        <button onClick={() => onUpgrade(planKey)} disabled={loading === planKey}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
            isDowngrade
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : planKey === 'creator'
                ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-lg'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-800'
          } disabled:opacity-50`}>
          {loading === planKey
            ? '⏳ Loading...'
            : isDowngrade ? 'Downgrade' : `Upgrade to ${meta.label}`}
        </button>
      )}
      {isCurrent && planKey !== 'free' && (
        <button onClick={() => onUpgrade('portal')} disabled={loading === 'portal'}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50">
          {loading === 'portal' ? '⏳ Loading...' : '⚙️ Manage Billing'}
        </button>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const SettingsPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData,      setUserData]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(null);
  const [trialLoading,  setTrialLoading]  = useState(false);
  const [nameEdit,      setNameEdit]      = useState('');
  const [savingName,    setSavingName]    = useState(false);
  const [toast,         setToast]         = useState('');
  const [activeTab,     setActiveTab]     = useState('account');

  useEffect(() => {
    fetchMe();
    // Handle redirect back from Stripe
    const params = new URLSearchParams(location.search);
    if (params.get('upgrade') === 'success') {
      showToast(`🎉 Plan upgraded to ${params.get('plan')}! Welcome aboard.`);
      fetchMe();
    }
    if (params.get('upgrade') === 'cancelled') {
      showToast('Upgrade cancelled — no changes made.', 'info');
    }
  }, []);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/settings/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserData(data.user);
      setNameEdit(data.user.name || '');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 4000);
  };

  const handleSaveName = async () => {
    if (!nameEdit.trim()) return;
    setSavingName(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/settings/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nameEdit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserData(prev => ({ ...prev, name: data.user.name }));
      showToast('Profile updated ✅');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSavingName(false); }
  };

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/settings/trial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      showToast(data.message);
      await fetchMe();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setTrialLoading(false); }
  };

  const handleUpgrade = async (plan) => {
    if (plan === 'portal') {
      setUpgradeLoading('portal');
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/settings/portal`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        window.location.href = data.url;
      } catch (err) { showToast(err.message, 'error'); }
      finally { setUpgradeLoading(null); }
      return;
    }

    setUpgradeLoading(plan);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/settings/checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      if (data.configured === false) {
        showToast('Stripe not configured yet — coming soon!', 'info');
        return;
      }
      window.location.href = data.url;
    } catch (err) { showToast(err.message, 'error'); }
    finally { setUpgradeLoading(null); }
  };

  const planMeta   = userData ? PLAN_META[userData.plan] || PLAN_META.free : null;
  const limits     = userData?.limits || {};
  const trialDays  = userData?.plan === 'trial' && userData?.plan_expires_at
    ? Math.max(0, Math.ceil((new Date(userData.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const TABS = [
    { id: 'account',  label: '👤 Account'      },
    { id: 'plan',     label: '⚡ Plan & Billing' },
    { id: 'usage',    label: '📊 Usage'         },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>
  );

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 py-10 px-4'}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account, plan, and usage</p>
        </div>

        {/* Trial banner */}
        {userData?.plan === 'free' && !userData?.trial_used && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-amber-400">🎁 Start your free 7-day trial</p>
              <p className="text-xs text-gray-500 mt-0.5">Get full access to all features — no credit card required</p>
            </div>
            <button onClick={handleStartTrial} disabled={trialLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl text-sm font-bold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 transition-all shadow-lg flex-shrink-0">
              {trialLoading ? '⏳ Activating...' : '🚀 Start Free Trial'}
            </button>
          </div>
        )}

        {/* Trial countdown */}
        {userData?.plan === 'trial' && trialDays !== null && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-amber-400">⏰ Trial expires in {trialDays} day{trialDays !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 mt-0.5">Upgrade before your trial ends to keep full access</p>
            </div>
            <button onClick={() => setActiveTab('plan')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl text-sm font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg flex-shrink-0">
              View Plans →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-5">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                    {(userData?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{userData?.name}</p>
                    <p className="text-xs text-gray-500">{userData?.email}</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${planMeta?.badge}`}>
                      {planMeta?.label} Plan
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Display Name</label>
                  <div className="flex gap-2">
                    <input value={nameEdit} onChange={e => setNameEdit(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
                    <button onClick={handleSaveName} disabled={savingName || nameEdit === userData?.name}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all">
                      {savingName ? '⏳' : 'Save'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Email</label>
                  <input value={userData?.email || ''} disabled
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-500 text-sm rounded-xl cursor-not-allowed"/>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Member Since</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['starter', 'creator', 'studio'].map(plan => (
                <PlanCard key={plan} planKey={plan} current={userData?.plan}
                  onUpgrade={handleUpgrade} loading={upgradeLoading} />
              ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
              <p className="text-xs text-gray-500">
                All plans include a 7-day free trial. Cancel anytime. Billed monthly.
                Questions? <a href="mailto:support@ivey.app" className="text-emerald-500 hover:underline">support@ivey.app</a>
              </p>
            </div>
          </div>
        )}

        {/* ── USAGE TAB ── */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">This Month's Usage</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${planMeta?.badge}`}>
                  {planMeta?.label}
                </span>
              </div>
              <div className="space-y-5">
                <UsageBar
                  label="HeyGen Videos"
                  used={userData?.videos_used || 0}
                  limit={limits.videos || 0}
                  color="bg-violet-500"
                />
                <UsageBar
                  label="Social Posts (Distribution)"
                  used={userData?.posts_used || 0}
                  limit={limits.posts || 0}
                  color="bg-blue-500"
                />
                <UsageBar
                  label="Brands"
                  used={0}
                  limit={limits.brands || 1}
                  color="bg-amber-500"
                />
              </div>
              {userData?.usage_reset_at && (
                <p className="text-xs text-gray-500 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Usage resets on the 1st of every month.
                  Last reset: {new Date(userData.usage_reset_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">AI Providers Available</h2>
              <div className="flex flex-wrap gap-2">
                {(limits.ai_providers || ['gemini']).map(p => (
                  <span key={p} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg capitalize">
                    ✓ {p === 'claude' ? 'Claude Sonnet' : p === 'claude-haiku' ? 'Claude Haiku' : p === 'openai' ? 'GPT-4o' : p === 'openai-mini' ? 'GPT-4o Mini' : 'Gemini'}
                  </span>
                ))}
                {['gemini', 'claude-haiku', 'claude', 'openai', 'openai-mini']
                  .filter(p => !(limits.ai_providers || ['gemini']).includes(p))
                  .map(p => (
                    <span key={p} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 text-xs font-semibold rounded-lg">
                      🔒 {p === 'claude' ? 'Claude Sonnet' : p === 'claude-haiku' ? 'Claude Haiku' : p === 'openai' ? 'GPT-4o' : p === 'openai-mini' ? 'GPT-4o Mini' : 'Gemini'}
                    </span>
                  ))}
              </div>
              {!['creator', 'studio'].includes(userData?.plan) && (
                <button onClick={() => setActiveTab('plan')}
                  className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-semibold">
                  Upgrade to unlock more AI providers →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-300' :
          toast.type === 'info'  ? 'bg-gray-900/90 border-gray-600 text-gray-300' :
                                   'bg-green-900/90 border-emerald-500 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;