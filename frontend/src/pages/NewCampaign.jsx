import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── AI Provider options ───────────────────────────────────────────────────────
const AI_PROVIDERS = [
  { id: 'gemini', label: 'Gemini',  icon: '💎', desc: 'Google — free tier, fast'       },
  { id: 'claude', label: 'Claude',  icon: '🤖', desc: 'Anthropic — creative & precise' },
  { id: 'openai', label: 'GPT-4o',  icon: '🧠', desc: 'OpenAI — versatile'            },
];

// ── Platform caption formats ──────────────────────────────────────────────────
const CAPTION_FORMATS = [
  { id: 'TWITTER_POST',    label: 'Twitter/X',    icon: '𝕏',  color: 'border-sky-500/30 bg-sky-500/10 text-sky-400'       },
  { id: 'INSTAGRAM_POST',  label: 'Instagram',    icon: '📸', color: 'border-pink-500/30 bg-pink-500/10 text-pink-400'     },
  { id: 'TIKTOK_SCRIPT',   label: 'TikTok',       icon: '🎵', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'     },
  { id: 'FACEBOOK_POST',   label: 'Facebook',     icon: '📘', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400'     },
  { id: 'LINKEDIN_POST',   label: 'LinkedIn',     icon: '💼', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'},
  { id: 'YOUTUBE_AD',      label: 'YouTube',      icon: '▶',  color: 'border-red-500/30 bg-red-500/10 text-red-400'        },
];

const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [brands,        setBrands]        = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name:           '',
    brandProfileId: '',
    brandName:      '',
    websiteUrl:     '',
    description:    '',
    targetAudience: '',
    aiProvider:     'gemini',
    captionFormats: [],   // optional caption formats
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        const list  = Array.isArray(data.brands) ? data.brands : data.brand ? [data.brand] : [];
        setBrands(list.filter(Boolean));
        const def = list.find(b => b.is_default);
        if (def) setFormData(prev => ({ ...prev, brandProfileId: def.id, brandName: def.brand_name || '' }));
      } catch { setBrands([]); }
      finally { setBrandsLoading(false); }
    };
    fetchBrands();
  }, []);

  const handleBrandSelect = (brandId) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({ ...prev, brandProfileId: brandId, brandName: selected?.brand_name || '' }));
  };

  const toggleCaption = (id) => setFormData(prev => ({
    ...prev,
    captionFormats: prev.captionFormats.includes(id)
      ? prev.captionFormats.filter(f => f !== id)
      : [...prev.captionFormats, id],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.targetAudience.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Video script is always included — IVey is video-first
      // Caption formats are optional extras
      const outputFormats = ['VIDEO_SCRIPT', ...formData.captionFormats];
      const response = await createCampaign({
        ...formData,
        outputFormats,
      });
      navigate(`/campaigns/${response.campaign.id}`, { state: { from: 'campaigns' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      setLoading(false);
    }
  };

  const inp  = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm';
  const lbl  = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';
  const hint = 'text-xs text-gray-500 dark:text-gray-400 mt-1.5';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mb-8 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Campaigns
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🎬</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Campaign</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">IVey generates your video script — take it to HeyGen to produce</p>
            </div>
          </div>

          {/* How it works strip */}
          <div className="flex items-center gap-2 mt-4 p-3 bg-gray-800/50 dark:bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
            {[
              { n:'1', label:'Brief your campaign' },
              { n:'→', label:null },
              { n:'2', label:'IVey selects bracket' },
              { n:'→', label:null },
              { n:'3', label:'AI writes script' },
              { n:'→', label:null },
              { n:'4', label:'Take to HeyGen' },
            ].map((s, i) => s.label ? (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center flex-shrink-0">{s.n}</div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{s.label}</span>
              </div>
            ) : (
              <span key={i} className="text-gray-600 flex-shrink-0 text-xs">{s.n}</span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Campaign Name ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>Campaign Name *</label>
            <input type="text" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., MOONRALDS SAFARI LAUNCH 2025"
              className={inp} />
            <p className={hint}>Give it a clear, memorable name</p>
          </div>

          {/* ── Brand Profile ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>Brand Profile</label>
            {brandsLoading ? (
              <div className={`${inp} text-gray-400`}>Loading brands...</div>
            ) : brands.length > 0 ? (
              <>
                <select value={formData.brandProfileId} onChange={e => handleBrandSelect(e.target.value)} className={inp}>
                  <option value="">— No brand profile / enter manually —</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.brand_name}{b.is_default ? ' (default)' : ''}</option>
                  ))}
                </select>
                <p className={hint}>Brand voice, mood, and identity guides every word of the script</p>
              </>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                <span>⚠️</span>
                <span>No brand profiles yet.</span>
                <button type="button" onClick={() => navigate('/dashboard?section=brands')} className="underline font-semibold">Create one →</button>
              </div>
            )}
            {!formData.brandProfileId && (
              <div className="mt-3">
                <input type="text" value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Brand name (optional)"
                  className={inp} />
              </div>
            )}
          </div>

          {/* ── Description ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>Product / Service Description *</label>
            <textarea required rows={5} value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you are promoting. Be specific — include key features, what makes it unique, the mood or feeling you want to convey, and any important context. The more specific you are, the better IVey's script will be."
              className={`${inp} resize-none leading-relaxed`} />
            <p className={hint}>This is the foundation of your video script — be as specific as possible</p>
          </div>

          {/* ── Target Audience ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>Target Audience *</label>
            <input type="text" required value={formData.targetAudience}
              onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="e.g., Health-conscious women 25–40, urban professionals who care about wellness and quality"
              className={inp} />
            <p className={hint}>IVey uses this to choose the right hook angle and emotional tone</p>
          </div>

          {/* ── Website URL (optional) ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>Website URL <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="url" value={formData.websiteUrl}
              onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://www.example.com"
              className={inp} />
            <p className={hint}>Used for additional context in strategy generation</p>
          </div>

          {/* ── Video Script — always on, IVey selects bracket ── */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl shadow-emerald-500/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">🎬</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-white text-base">Video Script</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Always included</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  IVey analyzes your campaign and automatically selects the best bracket — 30, 45, or 60 seconds — then writes a production-ready script optimized for HeyGen.
                </p>
                {/* Bracket preview */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { secs: '30s', label: 'Flash', desc: 'Single benefit, impulse buy', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                    { secs: '45s', label: 'Sharp', desc: '2-3 benefits, needs context',  color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                    { secs: '60s', label: 'Full',  desc: 'Complex product, full story',  color: 'border-sky-500/30 bg-sky-500/5 text-sky-400' },
                  ].map(b => (
                    <div key={b.secs} className={`p-3 rounded-xl border ${b.color}`}>
                      <div className="font-black text-sm mb-0.5">{b.secs} — {b.label}</div>
                      <div className="text-xs opacity-70">{b.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                  IVey selects the bracket automatically based on your campaign
                </p>
              </div>
            </div>
          </div>

          {/* ── Optional caption formats ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className={`${lbl} mb-0`}>
                  Platform Captions
                  <span className="ml-2 font-normal text-gray-400 text-xs">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Generate AI captions for these platforms alongside your video script
                </p>
              </div>
              {formData.captionFormats.length > 0 && (
                <button type="button" onClick={() => setFormData(p => ({ ...p, captionFormats: [] }))}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAPTION_FORMATS.map(fmt => {
                const selected = formData.captionFormats.includes(fmt.id);
                return (
                  <button key={fmt.id} type="button" onClick={() => toggleCaption(fmt.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selected
                        ? `${fmt.color} scale-[1.02]`
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <span>{fmt.icon}</span>
                    <span>{fmt.label}</span>
                    {selected && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── AI Provider ── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <label className={lbl}>AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {AI_PROVIDERS.map(p => (
                <button key={p.id} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, aiProvider: p.id }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    formData.aiProvider === p.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <span className="text-2xl">{p.icon}</span>
                  <span className={`text-xs font-bold ${formData.aiProvider === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{p.label}</span>
                  <span className="text-xs text-gray-400 text-center leading-tight">{p.desc}</span>
                </button>
              ))}
            </div>
            <p className={hint}>Gemini is free and fast — switch to Claude or GPT-4o for premium output</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              <span>⚠️</span>{error}
            </div>
          )}

          {/* What gets generated summary */}
          <div className="flex items-start gap-3 px-4 py-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <span className="text-lg flex-shrink-0">⚡</span>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                IVey will generate:
              </p>
              <ul className="mt-1.5 space-y-1">
                <li className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"/>
                  Video script (30/45/60s — IVey selects based on campaign)
                </li>
                <li className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"/>
                  Hook angle analysis + 3 hook variants for A/B testing
                </li>
                <li className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"/>
                  Viral score + predicted reach
                </li>
                {formData.captionFormats.length > 0 && (
                  <li className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"/>
                    Captions for: {formData.captionFormats.map(id => CAPTION_FORMATS.find(f => f.id === id)?.label).join(', ')}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Creating campaign...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🎬 Create Campaign
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { emoji:'🎯', title:'Smart Bracket Selection', desc:'IVey analyzes your campaign and picks 30, 45, or 60 seconds based on complexity and audience.' },
            { emoji:'🎬', title:'HeyGen-Ready Scripts',    desc:'Every script is formatted with visual notes and timing — paste directly into HeyGen to produce.' },
            { emoji:'📊', title:'Viral Score',             desc:'Every script is automatically scored for viral potential with predicted views and optimization tips.' },
          ].map(c => (
            <div key={c.title} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl mb-2">{c.emoji}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewCampaign;