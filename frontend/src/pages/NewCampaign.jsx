import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const CAMPAIGN_TYPES = [
  { id: 'brand_awareness', label: 'Brand Awareness', icon: '🏷', desc: 'Build brand recognition and emotional connection' },
  { id: 'product_ad',      label: 'Product Ad',      icon: '📦', desc: 'Showcase a specific product — features, demo, CTA' },
  { id: 'tutorial',        label: 'Tutorial / How-To', icon: '🎓', desc: 'Teach how to use your product or service' },
  { id: 'testimonial',     label: 'Testimonial',     icon: '⭐', desc: 'Customer story or social proof format' },
  { id: 'ugc',             label: 'UGC Style',       icon: '🤳', desc: 'User-generated content feel — raw and authentic' },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const AI_PROVIDERS = [
  { id: 'gemini', label: 'Gemini', icon: '💎', desc: 'Free tier, fast'    },
  { id: 'claude', label: 'Claude', icon: '🤖', desc: 'Creative & precise' },
  { id: 'openai', label: 'GPT-4o', icon: '🧠', desc: 'Versatile'          },
];

const CAPTION_FORMATS = [
  { id: 'TWITTER_POST',   label: 'Twitter/X', icon: '𝕏',  color: 'border-sky-500/30 bg-sky-500/10 text-sky-400'         },
  { id: 'INSTAGRAM_POST', label: 'Instagram', icon: '📸', color: 'border-pink-500/30 bg-pink-500/10 text-pink-400'       },
  { id: 'TIKTOK_SCRIPT',  label: 'TikTok',    icon: '🎵', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'       },
  { id: 'FACEBOOK_POST',  label: 'Facebook',  icon: '📘', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400'       },
  { id: 'LINKEDIN_POST',  label: 'LinkedIn',  icon: '💼', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' },
  { id: 'YOUTUBE_AD',     label: 'YouTube',   icon: '▶',  color: 'border-red-500/30 bg-red-500/10 text-red-400'          },
];

const VIDEO_FORMATS = [
  { id: 'single_narrator',   label: 'Single Narrator',       icon: '🎤', desc: 'One presenter speaks directly to camera' },
  { id: 'two_character',     label: 'Two-Character Conv.',   icon: '💬', desc: 'Dialogue between two characters'         },
  { id: 'multi_character',   label: 'Multi-Character Scene', icon: '👥', desc: 'Ensemble scene with 3+ people'           },
  { id: 'voiceover',         label: 'Voiceover Only',        icon: '🎙', desc: 'No on-screen presenter, visual story'    },
  { id: 'interview',         label: 'Interview Style',       icon: '🎬', desc: 'Q&A format, host and guest'              },
];

const GENDERS       = ['Male', 'Female', 'Either'];
const AGE_RANGES    = ['20s', '30s', '40s', '50s+', 'Any'];
const ETHNICITIES   = ['African', 'East Asian', 'South Asian', 'Middle Eastern', 'Latino', 'Caucasian', 'Mixed', 'Not specified'];
const MARKETS       = ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Tanzania', 'Egypt', 'China', 'India', 'Japan', 'UAE', 'Saudi Arabia', 'UK', 'USA', 'Canada', 'Australia', 'Brazil', 'Global'];
const SETTINGS      = ['Urban', 'Rural', 'Corporate / Office', 'Lifestyle / Home', 'Nature / Outdoors', 'Studio / Clean', 'Luxury', 'Street / Market'];
const ENERGY_LEVELS = ['Calm & Trusted', 'Warm & Friendly', 'Bold & Direct', 'Exciting & Energetic', 'Inspirational', 'Humorous & Light'];
const MUSIC_MOODS   = ['No music specified', 'Afrobeats', 'Western Pop', 'R&B / Soul', 'Traditional / Cultural', 'Corporate / Neutral', 'Cinematic / Epic', 'Acoustic / Warm', 'Electronic / Modern'];

// ── Brand URL analyzer — calls backend which runs Claude Vision ───────────────
const analyzeBrandUrl = async (websiteUrl) => {
  if (!websiteUrl) return null;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/brand/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url: websiteUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.intelligence || null;
  } catch {
    return null;
  }
};

// ── Section wrapper component ─────────────────────────────────────────────────
const FormSection = ({ icon, title, subtitle, children, accent = 'emerald' }) => {
  const colors = {
    emerald: 'border-emerald-500/30',
    amber:   'border-amber-500/30',
    violet:  'border-violet-500/30',
    sky:     'border-sky-500/30',
    red:     'border-red-500/30',
  };
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 ${colors[accent] ? `dark:border-l-4 dark:${colors[accent]}` : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

// ── Select button group ───────────────────────────────────────────────────────
const SelectGroup = ({ options, value, onChange, color = 'emerald' }) => {
  const activeClass = color === 'emerald'
    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
    : color === 'amber'
    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
    : 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400';

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
            value === opt
              ? activeClass
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [brands,         setBrands]         = useState([]);
  const [brandsLoading,  setBrandsLoading]  = useState(true);
  const [logoPreview,      setLogoPreview]      = useState(null);
  const [scrapingLogo,     setScrapingLogo]     = useState(false);
  const [brandIntelligence, setBrandIntelligence] = useState(null);

  const [formData, setFormData] = useState({
    // Core
    name:           '',
    brandProfileId: '',
    brandName:      '',
    websiteUrl:     '',
    description:    '',
    targetAudience: '',
    aiProvider:     'gemini',
    captionFormats: [],

    // Production Brief
    production: {
      videoFormat:     'single_narrator',
      // Narrator (used for single_narrator, voiceover)
      narratorGender:  'Either',
      narratorAge:     'Any',
      narratorEthnicity: 'Not specified',
      // Energy & tone
      energyLevel:     'Warm & Friendly',
      musicMood:       'No music specified',
      // Cultural context
      primaryMarket:   'Global',
      settingStyle:    'Urban',
      // Logo (auto-scraped or from brand profile)
      logoUrl:         '',
      logoDescription: '',
    },
  });

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const setProd = (key, val) => setFormData(prev => ({
    ...prev,
    production: { ...prev.production, [key]: val },
  }));

  // ── Fetch brands ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        const list  = Array.isArray(data.brands) ? data.brands : data.brand ? [data.brand] : [];
        setBrands(list.filter(Boolean));
        const def = list.find(b => b.is_default);
        if (def) set('brandProfileId', def.id); set('brandName', def?.brand_name || '');
      } catch { setBrands([]); }
      finally { setBrandsLoading(false); }
    };
    fetchBrands();
  }, []);

  // ── Load products when brand changes ────────────────────────────────────────
  useEffect(() => {
    if (!formData.brandProfileId) { setProducts([]); return; }
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/products?brand_id=${formData.brandProfileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProducts(data.products || []);
      } catch { setProducts([]); }
    };
    loadProducts();
  }, [formData.brandProfileId]);

  // ── Auto-analyze brand when URL changes ────────────────────────────────────
  useEffect(() => {
    if (!formData.websiteUrl) return;
    const timer = setTimeout(async () => {
      setScrapingLogo(true);
      setBrandIntelligence(null);
      try {
        const intelligence = await analyzeBrandUrl(formData.websiteUrl);
        if (intelligence) {
          setBrandIntelligence(intelligence);
          setProd('logoUrl', intelligence.logo_url || '');
          setProd('logoDescription', intelligence.visual_identity?.logo_description || '');
          setLogoPreview(intelligence.logo_url || null);
          // Auto-fill brand name if empty
          if (!formData.brandName && intelligence.brand_name) {
            setFormData(prev => ({ ...prev, brandName: intelligence.brand_name }));
          }
        }
      } catch {}
      finally { setScrapingLogo(false); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData.websiteUrl]);

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
      setError('Please fill in all required fields'); return;
    }
    setLoading(true); setError('');
    try {
      const outputFormats = ['VIDEO_SCRIPT', ...formData.captionFormats];
      const response = await createCampaign({
        ...formData,
        outputFormats,
        productionBrief:   formData.production,
        brandIntelligence: brandIntelligence || null,
        campaignType:      formData.campaignType || 'brand_awareness',
        productId:         formData.productId   || null,
      });
      navigate(`/campaigns/${response.campaign.id}`, { state: { from: 'campaigns' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      setLoading(false);
    }
  };

  const inp  = 'w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm';
  const lbl  = 'block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest';
  const hint = 'text-xs text-gray-500 dark:text-gray-400 mt-1.5';

  const prod = formData.production;

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
          {/* Engine flow */}
          <div className="flex items-center gap-1.5 mt-4 p-3 bg-gray-800/40 dark:bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
            {['Brief + Production', '→', 'Audience Psychology', '→', 'Competitive Gap', '→', 'Narrative Arc', '→', 'Hook Lab', '→', '3 Scripts Scored'].map((s, i) => (
              s === '→'
                ? <span key={i} className="text-gray-600 text-xs flex-shrink-0">→</span>
                : <span key={i} className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 bg-gray-700/50 px-2 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── CAMPAIGN BASICS ── */}
          <FormSection icon="📋" title="Campaign Basics" subtitle="What are you promoting?">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Campaign Name *</label>
                <input type="text" required value={formData.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g., MOONRALDS SAFARI LAUNCH 2025"
                  className={inp} />
              </div>

              {/* Campaign type */}
              <div>
                <label className={lbl}>Campaign Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAMPAIGN_TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setFormData(p => ({ ...p, campaignType: t.id, productId: '' }))}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        formData.campaignType === t.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}>
                      <span className="text-lg flex-shrink-0">{t.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${formData.campaignType === t.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product selector — only for product_ad and tutorial */}
              {['product_ad', 'tutorial'].includes(formData.campaignType) && (
                <div>
                  <label className={lbl}>Select Product *</label>
                  {products.length > 0 ? (
                    <div className="space-y-2">
                      {products.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, productId: p.id }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            formData.productId === p.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}>
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.product_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xl">📦</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${formData.productId === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>{p.product_name}</p>
                            {p.price && <p className="text-xs text-gray-500">{p.price}</p>}
                            {p.features?.filter(f=>f).length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">{p.features.filter(f=>f).slice(0,2).join(' · ')}</p>
                            )}
                          </div>
                          {formData.productId === p.id && <span className="text-emerald-500 text-sm flex-shrink-0">✓</span>}
                        </button>
                      ))}
                    </div>
                  ) : formData.brandProfileId ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                      <p className="text-xs text-gray-500 mb-2">No products found for this brand.</p>
                      <a href="/dashboard" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                        Add products in Dashboard → Brands → Products →
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">Select a brand profile first to see its products.</p>
                  )}
                </div>
              )}

              <div>
                <label className={lbl}>Product / Service Description *</label>
                <textarea required rows={4} value={formData.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Be specific — include key features, what makes it unique, the mood or feeling you want to convey. The more specific you are, the better the script."
                  className={`${inp} resize-none leading-relaxed`} />
                <p className={hint}>This is the foundation of your video script</p>
              </div>
              <div>
                <label className={lbl}>Target Audience *</label>
                <input type="text" required value={formData.targetAudience}
                  onChange={e => set('targetAudience', e.target.value)}
                  placeholder="e.g., Affluent Kenyan adults 30–55, adventure seekers, luxury travel enthusiasts"
                  className={inp} />
                <p className={hint}>IVey uses this to excavate psychology and choose the hook angle</p>
              </div>
              <div>
                <label className={lbl}>Website URL <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <div className="relative">
                  <input type="url" value={formData.websiteUrl}
                    onChange={e => set('websiteUrl', e.target.value)}
                    placeholder="https://www.example.com"
                    className={inp} />
                  {scrapingLogo && (
                    <div className="absolute right-3 top-3">
                      <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    </div>
                  )}
                </div>
                {scrapingLogo && (
                  <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1.5">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Analyzing brand identity...
                  </p>
                )}
                {brandIntelligence && !scrapingLogo && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                    <div className="flex items-start gap-3">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-gray-700 p-1 flex-shrink-0 border border-gray-200 dark:border-gray-600"
                          onError={() => setLogoPreview(null)} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">✓ Brand Intelligence Extracted</p>
                        <div className="space-y-0.5">
                          {brandIntelligence.visual_identity?.logo_description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">🎨 {brandIntelligence.visual_identity.logo_description}</p>
                          )}
                          {brandIntelligence.visual_identity?.primary_color && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={{background: brandIntelligence.visual_identity.primary_color}}/>
                              Primary: {brandIntelligence.visual_identity.primary_color}
                            </p>
                          )}
                          {brandIntelligence.brand_voice && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">🎙 Voice: {brandIntelligence.brand_voice}</p>
                          )}
                          {brandIntelligence.visual_identity?.visual_style && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">✨ Style: {brandIntelligence.visual_identity.visual_style}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!brandIntelligence && !scrapingLogo && (
                  <p className={hint}>IVey will extract your logo, colors, and brand identity automatically</p>
                )}
              </div>
            </div>
          </FormSection>

          {/* ── BRAND PROFILE ── */}
          <FormSection icon="🎨" title="Brand Profile" subtitle="Guides voice, mood, and identity">
            {brandsLoading ? (
              <div className={`${inp} text-gray-400`}>Loading brands...</div>
            ) : brands.length > 0 ? (
              <>
                <select value={formData.brandProfileId} onChange={e => handleBrandSelect(e.target.value)} className={inp}>
                  <option value="">— No brand profile / enter manually —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}{b.is_default ? ' (default)' : ''}</option>)}
                </select>
                <p className={hint}>Brand voice, mood, and identity guide every word of the script</p>
              </>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                <span>⚠️</span><span>No brand profiles yet.</span>
                <button type="button" onClick={() => navigate('/dashboard?section=brands')} className="underline font-semibold">Create one →</button>
              </div>
            )}
            {!formData.brandProfileId && (
              <input type="text" value={formData.brandName}
                onChange={e => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="Brand name (optional)"
                className={`${inp} mt-3`} />
            )}
          </FormSection>

          {/* ── PRODUCTION BRIEF ── */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-violet-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">🎭</div>
              <div>
                <h3 className="font-black text-white text-sm">Production Brief</h3>
                <p className="text-xs text-gray-400 mt-0.5">IVey uses this to design characters, setting, and visual notes</p>
              </div>
              <span className="ml-auto px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-bold rounded-full border border-violet-500/30">IVey decides characters</span>
            </div>

            <div className="space-y-6">

              {/* Video format */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Video Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VIDEO_FORMATS.map(f => (
                    <button key={f.id} type="button" onClick={() => setProd('videoFormat', f.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        prod.videoFormat === f.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}>
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <div className={`text-xs font-bold ${prod.videoFormat === f.id ? 'text-violet-400' : 'text-gray-300'}`}>{f.label}</div>
                        <div className="text-xs text-gray-500">{f.desc}</div>
                      </div>
                      {prod.videoFormat === f.id && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
                {(prod.videoFormat === 'two_character' || prod.videoFormat === 'multi_character' || prod.videoFormat === 'interview') && (
                  <div className="mt-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                    <p className="text-xs text-violet-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"/>
                      IVey will design the characters based on your audience psychology profile — who they are, their relationship, and their roles in the story
                    </p>
                  </div>
                )}
              </div>

              {/* Narrator profile — shown for single narrator, voiceover, interview */}
              {['single_narrator', 'voiceover', 'interview'].includes(prod.videoFormat) && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {prod.videoFormat === 'voiceover' ? 'Voice Profile' : 'Narrator / Presenter'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Gender</label>
                      <div className="flex flex-col gap-1.5">
                        {GENDERS.map(g => (
                          <button key={g} type="button" onClick={() => setProd('narratorGender', g)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              prod.narratorGender === g
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}>{g}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Age Range</label>
                      <div className="flex flex-col gap-1.5">
                        {AGE_RANGES.map(a => (
                          <button key={a} type="button" onClick={() => setProd('narratorAge', a)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              prod.narratorAge === a
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}>{a}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Ethnicity</label>
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {ETHNICITIES.map(e => (
                          <button key={e} type="button" onClick={() => setProd('narratorEthnicity', e)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all text-left ${
                              prod.narratorEthnicity === e
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}>{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cultural context */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Cultural Context</label>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Primary Market</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKETS.map(m => (
                      <button key={m} type="button" onClick={() => setProd('primaryMarket', m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          prod.primaryMarket === m
                            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Setting Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SETTINGS.map(s => (
                      <button key={s} type="button" onClick={() => setProd('settingStyle', s)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          prod.settingStyle === s
                            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tone & delivery */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Tone & Delivery</label>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Energy Level</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ENERGY_LEVELS.map(e => (
                      <button key={e} type="button" onClick={() => setProd('energyLevel', e)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          prod.energyLevel === e
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Music Mood</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_MOODS.map(m => (
                      <button key={m} type="button" onClick={() => setProd('musicMood', m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          prod.musicMood === m
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── PLATFORM CAPTIONS ── */}
          <FormSection icon="📱" title="Platform Captions" subtitle="Optional — generated alongside your video script">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAPTION_FORMATS.map(fmt => {
                const selected = formData.captionFormats.includes(fmt.id);
                return (
                  <button key={fmt.id} type="button" onClick={() => toggleCaption(fmt.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selected ? `${fmt.color} scale-[1.02]` : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <span>{fmt.icon}</span><span>{fmt.label}</span>
                    {selected && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* ── AI PROVIDER ── */}
          <FormSection icon="🤖" title="AI Provider" subtitle="Gemini is free — Claude and GPT-4o unlock with paid plan">
            <div className="grid grid-cols-3 gap-3">
              {AI_PROVIDERS.map(p => (
                <button key={p.id} type="button"
                  onClick={() => set('aiProvider', p.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    formData.aiProvider === p.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <span className="text-2xl">{p.icon}</span>
                  <span className={`text-xs font-bold ${formData.aiProvider === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{p.label}</span>
                  <span className="text-xs text-gray-400 text-center">{p.desc}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              <span>⚠️</span>{error}
            </div>
          )}

          {/* What gets generated */}
          <div className="flex items-start gap-3 px-4 py-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <span className="text-lg flex-shrink-0">⚡</span>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">IVey will generate:</p>
              <ul className="space-y-1">
                {[
                  'Audience psychology profile (8 excavation questions)',
                  'Competitive gap analysis',
                  `${prod.videoFormat === 'two_character' ? 'Two-character conversation' : prod.videoFormat === 'multi_character' ? 'Multi-character scene' : 'Video'} script — IVey selects 30/45/60s bracket`,
                  '5 hooks scored and ranked — A/B test variants',
                  '3 script drafts (Emotional / Direct / Narrative) — best delivered',
                  'Viral score + predicted reach',
                  ...(formData.captionFormats.length > 0 ? [`Captions: ${formData.captionFormats.map(id => CAPTION_FORMATS.find(f => f.id === id)?.label).join(', ')}`] : []),
                ].map((item, i) => (
                  <li key={i} className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"/>
                    {item}
                  </li>
                ))}
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
            { emoji:'🧠', title:'Deep Intelligence',    desc:'5 layers run before a word is written — audience psychology, competitive gap, narrative arc, hook lab.' },
            { emoji:'🎭', title:'Production-Ready',     desc:'Characters, cultural setting, music, narrator profile — all baked into every visual note in the script.' },
            { emoji:'📊', title:'3 Drafts, Best Wins',  desc:'IVey writes Emotional, Direct, and Narrative versions. Scores all three. Delivers the strongest.' },
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