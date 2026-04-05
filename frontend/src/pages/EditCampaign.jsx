import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaignById, updateCampaign } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

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
  { id: 'single_narrator', label: 'Single Narrator',     icon: '🎤', desc: 'One presenter speaks directly to camera' },
  { id: 'two_character',   label: 'Two-Character Conv.', icon: '💬', desc: 'Dialogue between two characters'         },
  { id: 'multi_character', label: 'Multi-Character',     icon: '👥', desc: 'Ensemble scene with 3+ people'           },
  { id: 'voiceover',       label: 'Voiceover Only',      icon: '🎙', desc: 'No on-screen presenter'                  },
  { id: 'interview',       label: 'Interview Style',     icon: '🎬', desc: 'Q&A format, host and guest'              },
];

const GENDERS    = ['Male', 'Female', 'Either'];
const AGES       = ['20s', '30s', '40s', '50s+', 'Any'];
const ETHNICS    = ['African', 'East Asian', 'South Asian', 'Middle Eastern', 'Latino', 'Caucasian', 'Mixed', 'Not specified'];
const MARKETS    = ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Tanzania', 'Egypt', 'China', 'India', 'Japan', 'UAE', 'Saudi Arabia', 'UK', 'USA', 'Canada', 'Australia', 'Brazil', 'Global'];
const SETTINGS   = ['Urban', 'Rural', 'Corporate / Office', 'Lifestyle / Home', 'Nature / Outdoors', 'Studio / Clean', 'Luxury', 'Street / Market'];
const ENERGIES   = ['Calm & Trusted', 'Warm & Friendly', 'Bold & Direct', 'Exciting & Energetic', 'Inspirational', 'Humorous & Light'];
const MUSICS     = ['No music specified', 'Afrobeats', 'Western Pop', 'R&B / Soul', 'Traditional / Cultural', 'Corporate / Neutral', 'Cinematic / Epic', 'Acoustic / Warm', 'Electronic / Modern'];

const DEFAULT_PROD = {
  videoFormat: 'single_narrator', narratorGender: 'Either', narratorAge: 'Any',
  narratorEthnicity: 'Not specified', energyLevel: 'Warm & Friendly',
  musicMood: 'No music specified', primaryMarket: 'Global', settingStyle: 'Urban',
  logoUrl: '', logoDescription: '',
};

const analyzeBrandUrl = async (url) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/brand/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return (await res.json()).intelligence || null;
  } catch { return null; }
};

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [logoPreview,       setLogoPreview]       = useState(null);
  const [scrapingLogo,      setScrapingLogo]      = useState(false);
  const [brandIntelligence, setBrandIntelligence] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', targetAudience: '', websiteUrl: '',
    aiProvider: 'claude', captionFormats: [], outputFormats: [],
    production: { ...DEFAULT_PROD },
  });

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setProd = (k, v) => setForm(p => ({ ...p, production: { ...p.production, [k]: v } }));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getCampaignById(id);
        const c    = data.campaign;
        const all  = Array.isArray(c.output_formats) ? c.output_formats : [];
        const pb   = c.production_brief || {};
        setForm({
          name:           c.name || '',
          description:    c.description || c.product_description || '',
          targetAudience: c.target_audience || '',
          websiteUrl:     c.website_url || '',
          aiProvider:     c.ai_provider || 'claude',
          captionFormats: all.filter(f => f !== 'VIDEO_SCRIPT'),
          outputFormats:  all,
          production: {
            videoFormat:       pb.videoFormat       || 'single_narrator',
            narratorGender:    pb.narratorGender    || 'Either',
            narratorAge:       pb.narratorAge       || 'Any',
            narratorEthnicity: pb.narratorEthnicity || 'Not specified',
            energyLevel:       pb.energyLevel       || 'Warm & Friendly',
            musicMood:         pb.musicMood         || 'No music specified',
            primaryMarket:     pb.primaryMarket     || 'Global',
            settingStyle:      pb.settingStyle      || 'Urban',
            logoUrl:           pb.logoUrl           || '',
            logoDescription:   pb.logoDescription   || '',
          },
        });
        if (pb.logoUrl) setLogoPreview(pb.logoUrl);
      } catch { setError('Failed to load campaign'); }
      finally  { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (!form.websiteUrl) return;
    const t = setTimeout(async () => {
      setScrapingLogo(true); setBrandIntelligence(null);
      try {
        const intel = await analyzeBrandUrl(form.websiteUrl);
        if (intel) {
          setBrandIntelligence(intel);
          setProd('logoUrl', intel.logo_url || '');
          setProd('logoDescription', intel.visual_identity?.logo_description || '');
          setLogoPreview(intel.logo_url || null);
        }
      } catch {}
      finally { setScrapingLogo(false); }
    }, 1500);
    return () => clearTimeout(t);
  }, [form.websiteUrl]);

  const toggleCaption = (id) => setForm(p => ({
    ...p, captionFormats: p.captionFormats.includes(id)
      ? p.captionFormats.filter(f => f !== id)
      : [...p.captionFormats, id],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.targetAudience.trim()) {
      setError('Please fill in all required fields'); return;
    }
    setSaving(true); setError('');
    try {
      await updateCampaign(id, {
        name: form.name, description: form.description,
        targetAudience: form.targetAudience, websiteUrl: form.websiteUrl,
        aiProvider: form.aiProvider,
        outputFormats: ['VIDEO_SCRIPT', ...form.captionFormats],
        productionBrief: form.production,
        brandIntelligence: brandIntelligence || null,
      });
      navigate(`/campaigns/${id}`, { state: { from: 'campaigns' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update campaign');
      setSaving(false);
    }
  };

  const inp  = 'w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm';
  const lbl  = 'block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest';
  const hint = 'text-xs text-gray-500 dark:text-gray-400 mt-1.5';
  const prod = form.production;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"/>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading campaign...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mb-8 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Campaign
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Edit Campaign</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Changes take effect on the next script generation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basics */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">📋</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Campaign Basics</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Campaign Name *</label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className={inp}/>
              </div>
              <div>
                <label className={lbl}>Product / Service Description *</label>
                <textarea required rows={4} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe what you are promoting — be specific..."
                  className={`${inp} resize-none leading-relaxed`}/>
                <p className={hint}>This drives the video script</p>
              </div>
              <div>
                <label className={lbl}>Target Audience *</label>
                <input type="text" required value={form.targetAudience}
                  onChange={e => set('targetAudience', e.target.value)} className={inp}/>
              </div>
              <div>
                <label className={lbl}>Website URL <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <div className="relative">
                  <input type="url" value={form.websiteUrl}
                    onChange={e => set('websiteUrl', e.target.value)}
                    placeholder="https://www.example.com" className={inp}/>
                  {scrapingLogo && (
                    <div className="absolute right-3 top-3">
                      <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {brandIntelligence && !scrapingLogo && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                    <div className="flex items-start gap-3">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo"
                          className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-gray-700 p-1 flex-shrink-0 border border-gray-200 dark:border-gray-600"
                          onError={() => setLogoPreview(null)}/>
                      )}
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">✓ Brand Intelligence Updated</p>
                        {brandIntelligence.visual_identity?.logo_description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">🎨 {brandIntelligence.visual_identity.logo_description}</p>
                        )}
                        {brandIntelligence.brand_voice && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">🎙 {brandIntelligence.brand_voice}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {logoPreview && !brandIntelligence && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded object-contain bg-gray-100 dark:bg-gray-700 p-1" onError={() => setLogoPreview(null)}/>
                    <span className="text-xs text-emerald-500">✓ Logo from previous analysis</span>
                  </div>
                )}
                <p className={hint}>IVey extracts logo, colors, and brand identity automatically</p>
              </div>
            </div>
          </div>

          {/* Production Brief */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-violet-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">🎭</div>
              <div>
                <h3 className="font-black text-white text-sm">Production Brief</h3>
                <p className="text-xs text-gray-400 mt-0.5">Characters, setting, and tone for the next generation</p>
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
                        prod.videoFormat === f.id ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 hover:border-gray-600'
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
              </div>
              {/* Narrator */}
              {['single_narrator', 'voiceover', 'interview'].includes(prod.videoFormat) && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Narrator Profile</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['Gender', 'narratorGender', GENDERS], ['Age', 'narratorAge', AGES], ['Ethnicity', 'narratorEthnicity', ETHNICS]].map(([lbl2, key, opts]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-2">{lbl2}</label>
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                          {opts.map(o => (
                            <button key={o} type="button" onClick={() => setProd(key, o)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all text-left ${prod[key] === o ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{o}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Cultural context */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Cultural Context</label>
                <label className="block text-xs text-gray-500 mb-2">Primary Market</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {MARKETS.map(m => (
                    <button key={m} type="button" onClick={() => setProd('primaryMarket', m)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${prod.primaryMarket === m ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{m}</button>
                  ))}
                </div>
                <label className="block text-xs text-gray-500 mb-2">Setting Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {SETTINGS.map(s => (
                    <button key={s} type="button" onClick={() => setProd('settingStyle', s)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${prod.settingStyle === s ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{s}</button>
                  ))}
                </div>
              </div>
              {/* Tone */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Tone & Delivery</label>
                <label className="block text-xs text-gray-500 mb-2">Energy Level</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ENERGIES.map(e => (
                    <button key={e} type="button" onClick={() => setProd('energyLevel', e)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${prod.energyLevel === e ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{e}</button>
                  ))}
                </div>
                <label className="block text-xs text-gray-500 mb-2">Music Mood</label>
                <div className="flex flex-wrap gap-1.5">
                  {MUSICS.map(m => (
                    <button key={m} type="button" onClick={() => setProd('musicMood', m)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${prod.musicMood === m ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Captions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">📱</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Platform Captions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Optional — generated alongside your script</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAPTION_FORMATS.map(fmt => {
                const sel = form.captionFormats.includes(fmt.id);
                return (
                  <button key={fmt.id} type="button" onClick={() => toggleCaption(fmt.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${sel ? `${fmt.color} scale-[1.02]` : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <span>{fmt.icon}</span><span>{fmt.label}</span>
                    {sel && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Provider */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">🤖</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Provider</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AI_PROVIDERS.map(p => (
                <button key={p.id} type="button" onClick={() => set('aiProvider', p.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${form.aiProvider === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <span className="text-2xl">{p.icon}</span>
                  <span className={`text-xs font-bold ${form.aiProvider === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{p.label}</span>
                  <span className="text-xs text-gray-400 text-center">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              <span>⚠️</span>{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-sm">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCampaign;