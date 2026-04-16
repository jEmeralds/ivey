// frontend/src/pages/AdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// IVey Admin Dashboard — full control panel
// Accessible at /admin — protected, admin role only
// Tabs: Overview | Users | Payments | Actions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
const token   = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });
const jHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

// ── Plan badge ────────────────────────────────────────────────────────────────
const PlanBadge = ({ plan }) => {
  const map = {
    free:    'bg-gray-100 dark:bg-gray-700 text-gray-500',
    trial:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    starter: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    creator: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    studio:  'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${map[plan] || map.free}`}>
      {plan}
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'text-gray-900 dark:text-white' }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── User detail modal ─────────────────────────────────────────────────────────
const UserModal = ({ user, onClose, onUpdate }) => {
  const [plan,        setPlan]        = useState(user.plan || 'free');
  const [expiresAt,   setExpiresAt]   = useState(user.plan_expires_at ? user.plan_expires_at.slice(0,10) : '');
  const [resetUsage,  setResetUsage]  = useState(false);
  const [note,        setNote]        = useState('');
  const [waiverType,  setWaiverType]  = useState('reset_all');
  const [waiverDays,  setWaiverDays]  = useState(7);
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState('plan');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const handlePlanUpdate = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API_URL}/admin/users/${user.id}/plan`, {
        method: 'PUT', headers: jHeaders(),
        body: JSON.stringify({ plan, expires_at: expiresAt || null, reset_usage: resetUsage, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`✅ Plan updated to ${plan}`);
      onUpdate();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleActivation = async (active) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API_URL}/admin/users/${user.id}/activate`, {
        method: 'PUT', headers: jHeaders(),
        body: JSON.stringify({ active, reason: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(active ? '✅ Account activated' : '✅ Account suspended');
      onUpdate();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleWaiver = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API_URL}/admin/users/${user.id}/waiver`, {
        method: 'POST', headers: jHeaders(),
        body: JSON.stringify({ type: waiverType, value: waiverDays, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`✅ Waiver issued: ${waiverType}`);
      onUpdate();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{user.name || 'No name'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge plan={user.plan}/>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['plan', 'waiver', 'account'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 ${
                tab === t ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t === 'plan' ? '⚡ Plan' : t === 'waiver' ? '🎁 Waiver' : '👤 Account'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── PLAN TAB ── */}
          {tab === 'plan' && (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Current Plan</p>
                  <PlanBadge plan={user.plan}/>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Expires</p>
                  <p>{user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Videos Used</p>
                  <p>{user.videos_used || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Posts Used</p>
                  <p>{user.posts_used || 0}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Set Plan</label>
                <select value={plan} onChange={e => setPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  {['free', 'trial', 'starter', 'creator', 'studio'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Expires On (optional)</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resetUsage} onChange={e => setResetUsage(e.target.checked)} className="rounded"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">Reset usage counters</span>
              </label>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for change..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
              </div>

              <button onClick={handlePlanUpdate} disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
                {loading ? '⏳ Saving...' : '⚡ Update Plan'}
              </button>
            </>
          )}

          {/* ── WAIVER TAB ── */}
          {tab === 'waiver' && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">Issue a waiver to extend access or reset limits without changing the plan.</p>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Waiver Type</label>
                <select value={waiverType} onChange={e => setWaiverType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="reset_all">Reset all usage counters</option>
                  <option value="reset_videos">Reset video counter only</option>
                  <option value="reset_posts">Reset post counter only</option>
                  <option value="extend_plan">Extend plan by days</option>
                </select>
              </div>

              {waiverType === 'extend_plan' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Extend by (days)</label>
                  <input type="number" value={waiverDays} onChange={e => setWaiverDays(e.target.value)} min={1} max={365}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for waiver..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
              </div>

              <button onClick={handleWaiver} disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
                {loading ? '⏳ Issuing...' : '🎁 Issue Waiver'}
              </button>
            </>
          )}

          {/* ── ACCOUNT TAB ── */}
          {tab === 'account' && (
            <>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'User ID',      value: user.id },
                  { label: 'Email',        value: user.email },
                  { label: 'Name',         value: user.name || '—' },
                  { label: 'Role',         value: user.role },
                  { label: 'Joined',       value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
                  { label: 'Trial Used',   value: user.trial_used ? 'Yes' : 'No' },
                  { label: 'Provider',     value: user.payment_provider || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
                    <span className="text-gray-900 dark:text-white text-xs font-medium truncate max-w-xs">{value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {user.role !== 'suspended' ? (
                  <button onClick={() => handleActivation(false)} disabled={loading}
                    className="w-full py-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 disabled:opacity-50 transition-all">
                    {loading ? '⏳...' : '🚫 Suspend Account'}
                  </button>
                ) : (
                  <button onClick={() => handleActivation(true)} disabled={loading}
                    className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/20 disabled:opacity-50 transition-all">
                    {loading ? '⏳...' : '✅ Reactivate Account'}
                  </button>
                )}
              </div>
            </>
          )}

          {error   && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-xl">⚠️ {error}</p>}
          {success && <p className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 px-3 py-2 rounded-xl">{success}</p>}
        </div>
      </div>
    </div>
  );
};

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();
  const [tab,        setTab]        = useState('overview');
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [actions,    setActions]    = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subFilter,   setSubFilter]   = useState('pending');
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    // Verify admin access
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.role || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, paymentsRes, subsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`,                          { headers: headers() }),
        fetch(`${API_URL}/admin/users?limit=200`,                { headers: headers() }),
        fetch(`${API_URL}/admin/payments`,                       { headers: headers() }),
        fetch(`${API_URL}/library/admin/submissions?status=all`, { headers: headers() }),
      ]);
      if (!statsRes.ok) { setError('Admin access denied'); setLoading(false); return; }
      const [s, u, p, sub] = await Promise.all([statsRes.json(), usersRes.json(), paymentsRes.json(), subsRes.json()]);
      setStats(s);
      setUsers(u.users || []);
      setPayments(p.payments || []);
      setSubmissions(sub.submissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const TABS = [
    { id: 'overview',    label: '📊 Overview'     },
    { id: 'users',       label: '👥 Users'         },
    { id: 'submissions', label: '🖼 Submissions'   },
    { id: 'payments',    label: '💳 Payments'      },
    { id: 'actions',     label: '📋 Audit Log'     },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg font-bold mb-2">⚠️ {error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-emerald-500 hover:underline text-sm">← Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">👑 Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Full control — users, plans, revenue, audit</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              🔄 Refresh
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition-all">
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users"    value={stats.totalUsers}    sub={`${stats.recentSignups} new this month`} />
              <StatCard label="Paid Users"     value={stats.paidUsers}     sub={`${stats.trialUsers} on trial`}         color="text-emerald-600 dark:text-emerald-400" />
              <StatCard label="MRR"            value={`$${stats.mrr}`}     sub="Monthly recurring revenue"              color="text-amber-600 dark:text-amber-400" />
              <StatCard label="Total Posts"    value={stats.totalPosts}    sub="Via Ayrshare distribution" />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Plan Distribution</h2>
              <div className="space-y-3">
                {Object.entries(stats.planBreakdown || {}).map(([plan, count]) => {
                  const total = stats.totalUsers || 1;
                  const pct   = Math.round((count / total) * 100);
                  const colors = { free: 'bg-gray-400', trial: 'bg-amber-500', starter: 'bg-blue-500', creator: 'bg-emerald-500', studio: 'bg-violet-500' };
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <PlanBadge plan={plan}/>
                        </div>
                        <span className="text-xs text-gray-500">{count} users ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[plan] || 'bg-gray-400'} rounded-full`} style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 min-w-48 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="all">All Plans ({users.length})</option>
                {['free', 'trial', 'starter', 'creator', 'studio', 'suspended'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 self-center">{filteredUsers.length} of {users.length} users</span>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {['User', 'Plan', 'Videos', 'Posts', 'Trial', 'Joined', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name || '—'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3"><PlanBadge plan={u.plan}/></td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.videos_used || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.posts_used || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${u.trial_used ? 'text-gray-400' : 'text-emerald-500'}`}>
                            {u.trial_used ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(u)}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all">
                            Manage →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">No users found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {tab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['pending','approved','rejected','all'].map(s => (
                <button key={s} onClick={() => setSubFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    subFilter === s
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}>
                  {s} ({submissions.filter(x => s === 'all' || x.status === s).length})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {submissions.filter(x => subFilter === 'all' || x.status === subFilter).map(sub => (
                <div key={sub.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    {sub.video_url && (
                      <video src={sub.video_url} className="w-24 h-16 object-cover rounded-lg flex-shrink-0"/>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{sub.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub.users?.email} · {new Date(sub.submitted_at).toLocaleDateString()}</p>
                      {sub.description && <p className="text-xs text-gray-400 mt-1">"{sub.description}"</p>}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full text-center ${
                        sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        sub.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>{sub.status}</span>
                      {sub.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={async () => {
                            const res = await fetch(`${API_URL}/library/admin/submissions/${sub.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                              body: JSON.stringify({ action: 'approve' }),
                            });
                            if (res.ok) { setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'approved' } : s)); }
                          }} className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold hover:bg-emerald-500/20">✅</button>
                          <button onClick={async () => {
                            const note = window.prompt('Reason for rejection (optional):');
                            const res = await fetch(`${API_URL}/library/admin/submissions/${sub.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                              body: JSON.stringify({ action: 'reject', note }),
                            });
                            if (res.ok) { setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'rejected' } : s)); }
                          }} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20">❌</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {submissions.filter(x => subFilter === 'all' || x.status === subFilter).length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                  No {subFilter} submissions
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {tab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['User', 'Plan', 'Amount', 'Currency', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {payments.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{p.users?.email || p.user_id?.slice(0,8)}</td>
                      <td className="px-4 py-3"><PlanBadge plan={p.plan}/></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.amount?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                          p.status === 'pending'   ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-500 text-sm">No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDIT LOG TAB ── */}
        {tab === 'actions' && (
          <div className="space-y-2">
            {actions.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                No admin actions yet
              </div>
            )}
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-sm flex-shrink-0">
                  {a.action === 'plan_override' ? '⚡' : a.action === 'waiver' ? '🎁' : a.action === 'activate' ? '✅' : '🚫'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{a.action.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{a.users?.email || a.target_id}</p>
                  {a.details?.note && <p className="text-xs text-gray-400 mt-0.5 italic">"{a.details.note}"</p>}
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User management modal */}
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { fetchAll(); setSelected(null); }}
        />
      )}
    </div>
  );
};

export default AdminPage;