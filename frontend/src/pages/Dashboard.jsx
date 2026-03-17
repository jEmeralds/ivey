import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCampaigns } from '../services/api';
import BrandSettings from '../components/BrandSettings';
import GallerySubmitButton from '../components/GallerySubmitButton';
import SocialConnect from '../components/SocialConnect';

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',   icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { id: 'campaigns',  label: 'Campaigns',  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  )},
  { id: 'brands',     label: 'Brands',     icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  )},
  { id: 'social',     label: 'Social',     icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )},
  { id: 'gallery',    label: 'Gallery',    icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )},
  { id: 'analytics',  label: 'Analytics',  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
];

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  </div>
);

// ── Campaign status badge ─────────────────────────────────────────────────────
const StatusBadge = ({ campaign }) => {
  if (campaign.strategy_generated && campaign.content_count > 0)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">Complete</span>;
  if (campaign.strategy_generated)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">Strategy Ready</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Draft</span>;
};

// ── Analytics coming soon panel ───────────────────────────────────────────────
const AnalyticsPanel = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-4">
      Track your social post performance, campaign reach, and content engagement.
    </p>
    <button onClick={() => onNavigate('social')}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
      View Social Activity →
    </button>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [campaigns,     setCampaigns]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [user,          setUser]          = useState(null);
  const [stats,         setStats]         = useState({ totalCampaigns: 0, contentGenerated: 0, strategiesCreated: 0 });
  const navigate  = useNavigate();
  const location  = useLocation();

  // Allow linking to a section via ?section=campaigns
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('section');
    if (s && NAV_ITEMS.find(n => n.id === s)) setActiveSection(s);
  }, [location.search]);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData || userData === 'undefined' || userData === 'null') { navigate('/login'); return; }
    try { setUser(JSON.parse(userData)); } catch { navigate('/login'); return; }
    fetchCampaigns();
  }, [navigate]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await getCampaigns();
      const list = response.campaigns || [];
      setCampaigns(list);
      setStats({
        totalCampaigns:    list.length,
        contentGenerated:  list.reduce((a, c) => a + (c.content_count || 0), 0),
        strategiesCreated: list.filter(c => c.strategy_generated).length,
      });
    } catch { setError('Failed to load campaigns.'); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const navigate_section = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-transform duration-300 ease-in-out
        w-60
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto md:h-auto
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base">IVey</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => navigate_section(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}>
                <span className={`w-5 h-5 flex-shrink-0 ${activeSection === item.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
                {item.id === 'campaigns' && campaigns.length > 0 && (
                  <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {campaigns.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User info bottom */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  // ── Section: Overview ──────────────────────────────────────────────────────
  const OverviewSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your campaigns</p>
        </div>
        <Link to="/new-campaign"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          value={stats.totalCampaigns}
          label="Total Campaigns"
          color="bg-emerald-100 dark:bg-emerald-900/30"
          icon={<svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>}
        />
        <StatCard
          value={stats.strategiesCreated}
          label="Strategies Created"
          color="bg-amber-100 dark:bg-amber-900/30"
          icon={<svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <StatCard
          value={stats.contentGenerated}
          label="Content Pieces"
          color="bg-indigo-100 dark:bg-indigo-900/30"
          icon={<svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>}
        />
      </div>

      {/* Recent campaigns preview */}
      {campaigns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Campaigns</h2>
            <button onClick={() => navigate_section('campaigns')}
              className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline">
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {campaigns.slice(0, 3).map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{c.name}</span>
                    <StatusBadge campaign={c} />
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <button onClick={() => navigate(`/campaigns/${c.id}`)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap hover:underline">
                  Open →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Campaign', icon: '🚀', action: () => navigate('/new-campaign'), color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
          { label: 'Manage Brands', icon: '🎨', action: () => navigate_section('brands'), color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
          { label: 'Social Accounts', icon: '🔗', action: () => navigate_section('social'), color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
          { label: 'Gallery', icon: '🏆', action: () => navigate_section('gallery'), color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
        ].map(q => (
          <button key={q.label} onClick={q.action}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all hover:scale-105 ${q.color}`}>
            <span className="text-xl">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Section: Campaigns ─────────────────────────────────────────────────────
  const CampaignsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/new-campaign"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Campaign
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-xs mx-auto">Create your first campaign and generate viral content with AI in seconds.</p>
            <Link to="/new-campaign" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm">
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left">
                        {campaign.name}
                      </button>
                      <StatusBadge campaign={campaign} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-1">
                      {campaign.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{formatDate(campaign.created_at)}</span>
                      <span>·</span>
                      <span>Target: {campaign.target_audience || 'Not set'}</span>
                      {campaign.output_formats?.length > 0 && <><span>·</span><span>{campaign.output_formats.length} formats</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-sm font-medium">
                      Open →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span className="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar (mobile only) */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="font-semibold text-gray-900 dark:text-white capitalize">{activeSection}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto">
          {activeSection === 'overview'  && <OverviewSection />}
          {activeSection === 'campaigns' && <CampaignsSection />}
          {activeSection === 'brands'    && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Brand Profiles</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage your brand identities for AI content generation</p>
              </div>
              <BrandSettings />
            </div>
          )}
          {activeSection === 'social'    && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Connect your accounts and manage posts</p>
              </div>
              <SocialConnect />
            </div>
          )}
          {activeSection === 'gallery'   && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gallery</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Share your best content in the public gallery</p>
              </div>
              <GallerySubmitButton campaigns={campaigns} />
            </div>
          )}
          {activeSection === 'analytics' && <AnalyticsPanel onNavigate={navigate_section} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;