// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import IVeyLogo from '../components/IVeyLogo';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCampaigns, deleteCampaign } from '../services/api';
import BrandPage from './BrandPage';
import ProductsPage from './ProductsPage';
import GallerySubmitButton from '../components/GallerySubmitButton';
import SocialConnect, { AnalyticsPanel } from '../components/SocialConnect';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',   icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>) },
  { id: 'campaigns',  label: 'Campaigns',  icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>) },
  { id: 'brands',     label: 'Brands',     icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>) },
  { id: 'products',   label: 'Products',   icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>) },
  { id: 'social',     label: 'Social',     icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>) },
  { id: 'gallery',    label: 'Gallery',    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>) },
  { id: 'analytics',  label: 'Analytics',  icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>) },
];

const StatCard = ({ icon, value, label, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div className="min-w-0">
      <div className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ campaign }) => {
  if (campaign.strategy_generated && campaign.content_count > 0)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 whitespace-nowrap">Complete</span>;
  if (campaign.strategy_generated)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">Strategy Ready</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 whitespace-nowrap">Draft</span>;
};

const DeleteButton = ({ onConfirm, deleting }) => {
  const [confirming, setConfirming] = useState(false);
  if (deleting) return <span className="px-3 py-1.5 text-xs text-red-400 font-medium">Deleting…</span>;
  if (confirming) return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-red-500 dark:text-red-400 font-medium whitespace-nowrap">Sure?</span>
      <button onClick={() => { setConfirming(false); onConfirm(); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors">Yes</button>
      <button onClick={() => setConfirming(false)} className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors">No</button>
    </div>
  );
  return (
    <button onClick={() => setConfirming(true)} className="px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium">Delete</button>
  );
};

// ── Products section — shows brand selector then products ─────────────────────
const ProductsSection = ({ preselectedBrandId = null, onClearBrand }) => {
  const [brands,        setBrands]        = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading,       setLoading]       = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
  const token   = () => localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        const r    = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token()}` } });
        const data = await r.json();
        const list = data.brands || [];
        setBrands(list);
        // If coming from BrandPage "Products" button, preselect that brand
        if (preselectedBrandId) {
          const found = list.find(b => b.id === preselectedBrandId);
          if (found) setSelectedBrand(found);
        } else if (list.length === 1) {
          setSelectedBrand(list[0]);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [preselectedBrandId]);

  const handleBack = () => {
    setSelectedBrand(null);
    if (onClearBrand) onClearBrand();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/>
    </div>
  );

  if (brands.length === 0) return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
      <div className="text-5xl mb-4">🎨</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No brands yet</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Create a brand profile first, then add products to it.</p>
    </div>
  );

  // Show ProductsPage for selected brand
  if (selectedBrand) return (
    <ProductsPage
      brandId={selectedBrand.id}
      embedded
      onBack={handleBack}
    />
  );

  // Brand picker
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select a brand to manage its products</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {brands.map(b => (
          <button key={b.id} onClick={() => setSelectedBrand(b)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
              style={{ background: b.brand_colors?.[0] || '#10b981', color: '#fff' }}>
              {b.brand_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm">{b.brand_name}</p>
              {b.industry && <p className="text-xs text-gray-500 mt-0.5">{b.industry}</p>}
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const location  = useLocation();
  const navigate  = useNavigate();

  const getInitialSection = () => {
    const params = new URLSearchParams(location.search);
    const s = params.get('section');
    return (s && NAV_ITEMS.find(n => n.id === s)) ? s : 'overview';
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [campaigns,     setCampaigns]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [user,          setUser]          = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [stats,         setStats]         = useState({ totalCampaigns: 0, contentGenerated: 0, strategiesCreated: 0 });

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

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteCampaign(id);
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      setStats({
        totalCampaigns:    updated.length,
        contentGenerated:  updated.reduce((a, c) => a + (c.content_count || 0), 0),
        strategiesCreated: updated.filter(c => c.strategy_generated).length,
      });
    } catch { setError('Failed to delete campaign.'); }
    finally { setDeletingId(null); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const goTo = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const CampaignActions = ({ campaign }) => (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
        className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium">Edit</button>
      <DeleteButton deleting={deletingId === campaign.id} onConfirm={() => handleDelete(campaign.id)}/>
      <button onClick={() => navigate(`/campaigns/${campaign.id}`, { state: { from: 'campaigns' } })}
        className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-xs font-medium">Open →</button>
    </div>
  );

  const Sidebar = () => (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)}/>
      )}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 flex flex-col
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-transform duration-300 ease-in-out w-64
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto md:h-auto md:shadow-none
      `}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <IVeyLogo size={28}/>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}>
                <span className={`w-5 h-5 flex-shrink-0 ${activeSection === item.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'campaigns' && campaigns.length > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{campaigns.length}</span>
                )}
              </button>
            ))}
          </div>
        </nav>
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
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

  const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);
  const BottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-stretch safe-area-pb">
      {BOTTOM_NAV.map(item => (
        <button key={item.id} onClick={() => goTo(item.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-xs font-medium transition-colors ${
            activeSection === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <span className={`w-5 h-5 ${activeSection === item.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{item.icon}</span>
          <span className="leading-none">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  const OverviewSection = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Here's what's happening with your campaigns</p>
        </div>
        <Link to="/new-campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.totalCampaigns}    label="Campaigns"  color="bg-emerald-100 dark:bg-emerald-900/30" icon={<svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} />
        <StatCard value={stats.strategiesCreated} label="Strategies" color="bg-amber-100 dark:bg-amber-900/30"   icon={<svg className="w-5 h-5 text-amber-600 dark:text-amber-400"   fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} />
        <StatCard value={stats.contentGenerated}  label="Content"    color="bg-indigo-100 dark:bg-indigo-900/30" icon={<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Campaign', icon: '🚀', action: () => navigate('/new-campaign'), color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
          { label: 'Brands',       icon: '🎨', action: () => goTo('brands'),           color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
          { label: 'Products',     icon: '📦', action: () => goTo('products'),         color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800' },
          { label: 'Gallery',      icon: '🏆', action: () => goTo('gallery'),          color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
        ].map(q => (
          <button key={q.label} onClick={q.action} className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all active:scale-95 hover:scale-105 ${q.color}`}>
            <span className="text-xl">{q.icon}</span>
            <span className="text-center leading-tight">{q.label}</span>
          </button>
        ))}
      </div>

      {campaigns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Campaigns</h2>
            <button onClick={() => goTo('campaigns')} className="text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:underline">View all →</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {campaigns.slice(0, 3).map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{c.name}</span>
                    <StatusBadge campaign={c}/>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <CampaignActions campaign={c}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const CampaignsSection = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/new-campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          New
        </Link>
      </div>
      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">No campaigns yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-xs mx-auto">Create your first campaign and generate AI marketing content in seconds.</p>
            <Link to="/new-campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm">Create First Campaign</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button onClick={() => navigate(`/campaigns/${campaign.id}`, { state: { from: 'campaigns' } })} className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left text-sm">
                        {campaign.name}
                      </button>
                      <StatusBadge campaign={campaign}/>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1.5 line-clamp-1">{campaign.description || 'No description'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      <span>{formatDate(campaign.created_at)}</span>
                      {campaign.target_audience && <><span>·</span><span className="truncate max-w-[120px]">{campaign.target_audience}</span></>}
                      {campaign.output_formats?.length > 0 && <><span>·</span><span>{campaign.output_formats.length} formats</span></>}
                    </div>
                  </div>
                  <CampaignActions campaign={campaign}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span className="text-gray-600 dark:text-gray-400 text-sm">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex pt-16">
      <Sidebar/>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <IVeyLogo size={24}/>
          <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{activeSection}</span>
        </div>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
          {activeSection === 'overview'   && <OverviewSection/>}
          {activeSection === 'campaigns'  && <CampaignsSection/>}
          {activeSection === 'brands'     && <BrandPage embedded onViewProducts={(brandId) => { setActiveBrandId(brandId); goTo('products'); }} />}
          {activeSection === 'products'   && <ProductsSection preselectedBrandId={activeBrandId} onClearBrand={() => setActiveBrandId(null)} />}
          {activeSection === 'social'     && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Connect your accounts and manage posts</p>
              </div>
              <SocialConnect/>
            </div>
          )}
          {activeSection === 'gallery'    && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gallery</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Share your best content in the public gallery</p>
              </div>
              <GallerySubmitButton campaigns={campaigns}/>
            </div>
          )}
          {activeSection === 'analytics'  && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Analysis</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Your social post activity and performance</p>
              </div>
              <AnalyticsPanel isDark={true}/>
            </div>
          )}
        </main>
      </div>
      <BottomNav/>
    </div>
  );
};

export default Dashboard;