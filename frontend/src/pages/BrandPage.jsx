import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  'Food & Beverage', 'Fashion & Apparel', 'Health & Wellness', 'Beauty & Cosmetics',
  'Technology', 'Real Estate', 'Education', 'Finance', 'Entertainment & Media',
  'Travel & Hospitality', 'Sports & Fitness', 'Home & Decor', 'Agriculture',
  'Automotive', 'Non-Profit', 'Other',
];

const PHOTOGRAPHY_STYLES = [
  { id: 'lifestyle',   label: 'Lifestyle',     desc: 'Real people, real moments',    emoji: '🌿' },
  { id: 'studio',      label: 'Studio',        desc: 'Clean, controlled, precise',   emoji: '💡' },
  { id: 'documentary', label: 'Documentary',   desc: 'Raw, authentic, storytelling', emoji: '🎞' },
  { id: 'bold_graphic',label: 'Bold Graphic',  desc: 'Strong colors, flat design',   emoji: '🟥' },
  { id: 'minimalist',  label: 'Minimalist',    desc: 'Less is more, white space',    emoji: '⬜' },
];

const VISUAL_MOODS = [
  'Warm', 'Cool', 'Minimal', 'Vibrant', 'Dark', 'Earthy', 'Luxurious',
  'Playful', 'Bold', 'Soft', 'Industrial', 'Natural',
];

const BRAND_VOICES = [
  { id: 'professional',   label: 'Professional',   desc: 'Authoritative and trustworthy' },
  { id: 'conversational', label: 'Conversational', desc: 'Friendly and approachable'     },
  { id: 'bold',           label: 'Bold',           desc: 'Confident and direct'           },
  { id: 'playful',        label: 'Playful',        desc: 'Fun, energetic, light-hearted'  },
  { id: 'inspiring',      label: 'Inspiring',      desc: 'Motivational and uplifting'     },
  { id: 'authoritative',  label: 'Authoritative',  desc: 'Expert-led and commanding'      },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️' },
  { id: 'twitter',   label: 'Twitter/X', emoji: '𝕏'  },
  { id: 'facebook',  label: 'Facebook',  emoji: '📘' },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
];

const EMPTY_BRAND = {
  brand_name: '', tagline: '', industry: '', brand_story: '',
  brand_colors: ['#10b981', '#0f172a', '#f59e0b'],
  photography_style: '', visual_mood: [],
  brand_voice: '', words_always: [], words_never: [],
  target_personas: '', pain_points: '', audience_desires: '',
  default_video_length: 60, preferred_platforms: [],
  is_default: false,
};

// ─── Live Brand Card Preview ──────────────────────────────────────────────────
const BrandPreview = ({ form }) => {
  const primary   = form.brand_colors[0] || '#10b981';
  const secondary = form.brand_colors[1] || '#0f172a';
  const accent    = form.brand_colors[2] || '#f59e0b';
  const isDark = (() => {
    const r = parseInt(secondary.slice(1,3),16);
    const g = parseInt(secondary.slice(3,5),16);
    const b = parseInt(secondary.slice(5,7),16);
    return (r*299+g*587+b*114)/1000 < 128;
  })();
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor  = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="sticky top-24">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Preview</p>

      {/* Brand card */}
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: secondary }}>
        {/* Header bar */}
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />

        <div className="p-6">
          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg"
              style={{ background: primary, color: secondary }}>
              {(form.brand_name || 'B')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-black text-base" style={{ color: textColor }}>
                {form.brand_name || 'Your Brand'}
              </div>
              {form.tagline && (
                <div className="text-xs mt-0.5" style={{ color: subColor }}>{form.tagline}</div>
              )}
            </div>
          </div>

          {/* Industry pill */}
          {form.industry && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: primary + '25', color: primary, border: `1px solid ${primary}40` }}>
              {form.industry}
            </div>
          )}

          {/* Story snippet */}
          {form.brand_story && (
            <p className="text-xs leading-relaxed mb-5 line-clamp-3" style={{ color: subColor }}>
              {form.brand_story}
            </p>
          )}

          {/* Color swatches */}
          <div className="flex gap-2 mb-4">
            {form.brand_colors.filter(Boolean).map((c, i) => (
              <div key={i} title={c}
                className="w-8 h-8 rounded-lg shadow-inner border border-white/10"
                style={{ background: c }} />
            ))}
          </div>

          {/* Voice + mood pills */}
          <div className="flex flex-wrap gap-1.5">
            {form.brand_voice && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: accent + '20', color: accent }}>
                {BRAND_VOICES.find(v => v.id === form.brand_voice)?.label || form.brand_voice}
              </span>
            )}
            {form.visual_mood.slice(0, 3).map(m => (
              <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: primary + '15', color: primary }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        {form.preferred_platforms.length > 0 && (
          <div className="px-6 pb-4 flex gap-2">
            {form.preferred_platforms.map(p => {
              const platform = PLATFORMS.find(pl => pl.id === p);
              return platform ? (
                <span key={p} className="text-lg" title={platform.label}>{platform.emoji}</span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Video length preview */}
      {form.default_video_length && (
        <div className="mt-4 p-4 rounded-xl border border-gray-800 bg-gray-900">
          <p className="text-xs text-gray-500 mb-1">Default video length</p>
          <p className="text-lg font-black text-white">
            {form.default_video_length >= 60
              ? `${Math.floor(form.default_video_length / 60)}m ${form.default_video_length % 60 > 0 ? `${form.default_video_length % 60}s` : ''}`
              : `${form.default_video_length}s`}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Tag Input ────────────────────────────────────────────────────────────────
const TagInput = ({ tags, onChange, placeholder, color = '#10b981' }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };
  const remove = (tag) => onChange(tags.filter(t => t !== tag));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
            {tag}
            <button onClick={() => remove(tag)} className="hover:opacity-70 transition-opacity ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none placeholder-gray-500" />
        <button onClick={add} type="button"
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
          Add
        </button>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ number, title, subtitle }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-black text-emerald-400">{number}</span>
    </div>
    <div>
      <h2 className="text-base font-black text-white">{title}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const inputCls = 'w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all';
const sectionCls = 'bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4';

// ─── Main Page ────────────────────────────────────────────────────────────────
const BrandPage = () => {
  const navigate = useNavigate();
  const [brands,     setBrands]     = useState([]);
  const [selected,   setSelected]   = useState(null); // brand id being edited
  const [form,       setForm]       = useState(EMPTY_BRAND);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [showNew,    setShowNew]    = useState(false);
  const colorRefs   = [useRef(), useRef(), useRef()];

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const list = data.brands || [];
      setBrands(list);
      // Auto-select default or first
      const def = list.find(b => b.is_default) || list[0];
      if (def) { setSelected(def.id); setForm(toForm(def)); }
      else { setShowNew(true); }
    } catch { setError('Failed to load brands'); }
    finally { setLoading(false); }
  };

  const toForm = (b) => ({
    brand_name:           b.brand_name || '',
    tagline:              b.tagline || '',
    industry:             b.industry || '',
    brand_story:          b.brand_story || '',
    brand_colors:         b.brand_colors?.length ? b.brand_colors : ['#10b981', '#0f172a', '#f59e0b'],
    photography_style:    b.photography_style || '',
    visual_mood:          b.visual_mood || [],
    brand_voice:          b.brand_voice || '',
    words_always:         b.words_always || [],
    words_never:          b.words_never || [],
    target_personas:      b.target_personas || '',
    pain_points:          b.pain_points || '',
    audience_desires:     b.audience_desires || '',
    default_video_length: b.default_video_length || 60,
    preferred_platforms:  b.preferred_platforms || [],
    is_default:           b.is_default || false,
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setColor = (idx, val) => {
    const colors = [...form.brand_colors];
    colors[idx] = val;
    setForm(prev => ({ ...prev, brand_colors: colors }));
  };
  const toggleMood = (mood) => set('visual_mood',
    form.visual_mood.includes(mood)
      ? form.visual_mood.filter(m => m !== mood)
      : [...form.visual_mood, mood]
  );
  const togglePlatform = (id) => set('preferred_platforms',
    form.preferred_platforms.includes(id)
      ? form.preferred_platforms.filter(p => p !== id)
      : [...form.preferred_platforms, id]
  );

  const handleSave = async () => {
    if (!form.brand_name.trim()) { setError('Brand name is required'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const token = localStorage.getItem('token');
      const isNew = !selected || showNew;
      const url    = isNew ? `${API_URL}/brand` : `${API_URL}/brand/${selected}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSaved(true);
      setShowNew(false);
      await fetchBrands();
      setSelected(data.brand.id);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand profile?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/brand/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await fetchBrands();
      setSelected(null); setForm(EMPTY_BRAND); setShowNew(true);
    } catch { setError('Failed to delete'); }
  };

  const handleSetDefault = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/brand/${id}/set-default`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      await fetchBrands();
    } catch { setError('Failed to set default'); }
  };

  const handleSelectBrand = (brand) => {
    setSelected(brand.id);
    setForm(toForm(brand));
    setShowNew(false);
    setError('');
    setSaved(false);
  };

  const handleNew = () => {
    setSelected(null);
    setForm(EMPTY_BRAND);
    setShowNew(true);
    setError('');
    setSaved(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading brand profiles...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <span className="text-gray-700">·</span>
            <h1 className="text-sm font-bold text-white">Brand Identity</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all">
              + New Brand
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 disabled:opacity-50'
              }`}>
              {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Brand'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

          {/* ── Left: brand list ── */}
          <div className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <p className="hidden lg:block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Your Brands</p>
            <div className="space-y-2">
              {brands.map(b => (
                <button key={b.id} onClick={() => handleSelectBrand(b)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all group ${
                    selected === b.id && !showNew
                      ? 'bg-emerald-900/20 border-emerald-600/40 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-black"
                      style={{ background: b.brand_colors?.[0] || '#10b981', color: b.brand_colors?.[1] || '#0f172a' }}>
                      {(b.brand_name || 'B')[0]}
                    </div>
                    <span className="text-xs font-semibold truncate">{b.brand_name || 'Untitled'}</span>
                  </div>
                  {b.is_default && (
                    <span className="text-xs text-emerald-500 mt-1 block">Default</span>
                  )}
                </button>
              ))}
              {brands.length === 0 && (
                <p className="text-xs text-gray-600 px-1">No brands yet</p>
              )}
            </div>
          </div>

          {/* ── Center: form ── */}
          <div className="lg:col-span-7 space-y-4">

            {/* Brand actions bar */}
            {selected && !showNew && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded"
                    style={{ background: form.brand_colors[0] || '#10b981' }} />
                  <span className="text-sm font-bold text-white">{form.brand_name || 'Untitled Brand'}</span>
                  {form.is_default && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!form.is_default && (
                    <button onClick={() => handleSetDefault(selected)}
                      className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">
                      Set as default
                    </button>
                  )}
                  <button onClick={() => handleDelete(selected)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-sm">{error}</div>
            )}

            {/* ── Section 1: Identity ── */}
            <div className={sectionCls}>
              <SectionHeader number="01" title="Brand Identity" subtitle="The core of who you are" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Brand Name *</label>
                    <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)}
                      placeholder="e.g. SCOBBY QUEEN" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Tagline</label>
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
                      placeholder="e.g. Brewed with love" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Industry</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} className={inputCls}>
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Brand Story</label>
                  <textarea value={form.brand_story} onChange={e => set('brand_story', e.target.value)}
                    placeholder="Tell us about your brand in 2-3 sentences. What do you stand for? What makes you different?"
                    rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">
                    Set as Default Brand
                  </label>
                  <button onClick={() => set('is_default', !form.is_default)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.is_default
                        ? 'bg-emerald-900/20 border-emerald-600/40 text-emerald-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      form.is_default ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'
                    }`}>
                      {form.is_default && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    Use this brand by default in all campaigns
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section 2: Visual Theme ── */}
            <div className={sectionCls}>
              <SectionHeader number="02" title="Visual Theme" subtitle="Colors, photography style, and mood" />
              <div className="space-y-5">

                {/* Colors */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-3">Brand Colors</label>
                  <div className="flex items-center gap-4">
                    {['Primary', 'Background', 'Accent'].map((label, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div
                            className="w-14 h-14 rounded-xl cursor-pointer shadow-lg border-2 border-white/10 hover:scale-105 transition-transform"
                            style={{ background: form.brand_colors[i] || '#888' }}
                            onClick={() => colorRefs[i].current?.click()}
                          />
                          <input ref={colorRefs[i]} type="color" value={form.brand_colors[i] || '#888888'}
                            onChange={e => setColor(i, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        </div>
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-mono text-gray-600">{form.brand_colors[i] || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photography style */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-3">Photography Style</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PHOTOGRAPHY_STYLES.map(s => (
                      <button key={s.id} type="button" onClick={() => set('photography_style', s.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.photography_style === s.id
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}>
                        <div className="text-xl mb-1">{s.emoji}</div>
                        <div className="text-xs font-bold text-white">{s.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual mood */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-3">Visual Mood <span className="text-gray-600 font-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {VISUAL_MOODS.map(mood => (
                      <button key={mood} type="button" onClick={() => toggleMood(mood)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          form.visual_mood.includes(mood)
                            ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                        }`}>
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Voice & Tone ── */}
            <div className={sectionCls}>
              <SectionHeader number="03" title="Voice & Tone" subtitle="How your brand speaks" />
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-3">Brand Voice</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BRAND_VOICES.map(v => (
                      <button key={v.id} type="button" onClick={() => set('brand_voice', v.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.brand_voice === v.id
                            ? 'border-amber-500 bg-amber-900/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}>
                        <div className={`text-sm font-bold mb-0.5 ${form.brand_voice === v.id ? 'text-amber-400' : 'text-white'}`}>
                          {v.label}
                        </div>
                        <div className="text-xs text-gray-500">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">Words We Always Use</label>
                  <TagInput tags={form.words_always} onChange={v => set('words_always', v)}
                    placeholder="e.g. authentic, vibrant... (press Enter)" color="#10b981" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">Words We Never Use</label>
                  <TagInput tags={form.words_never} onChange={v => set('words_never', v)}
                    placeholder="e.g. cheap, basic... (press Enter)" color="#f43f5e" />
                </div>
              </div>
            </div>

            {/* ── Section 4: Audience ── */}
            <div className={sectionCls}>
              <SectionHeader number="04" title="Target Audience" subtitle="Who you're speaking to" />
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Primary Audience</label>
                  <input value={form.target_personas} onChange={e => set('target_personas', e.target.value)}
                    placeholder="e.g. Health-conscious women 25-40, urban professionals who care about wellness"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Their Pain Points</label>
                  <textarea value={form.pain_points} onChange={e => set('pain_points', e.target.value)}
                    placeholder="What problems do they face? What frustrates them?"
                    rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Their Desires & Aspirations</label>
                  <textarea value={form.audience_desires} onChange={e => set('audience_desires', e.target.value)}
                    placeholder="What do they want to achieve? What does success look like for them?"
                    rows={2} className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>

            {/* ── Section 5: Content Defaults ── */}
            <div className={sectionCls}>
              <SectionHeader number="05" title="Content Defaults" subtitle="Sets the baseline for all your campaigns" />
              <div className="space-y-5">

                {/* Video length slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-400">Default Video Length</label>
                    <span className="text-sm font-black text-white">
                      {form.default_video_length >= 60
                        ? `${Math.floor(form.default_video_length / 60)}m ${form.default_video_length % 60 > 0 ? `${form.default_video_length % 60}s` : ''}`
                        : `${form.default_video_length}s`}
                    </span>
                  </div>
                  <input type="range" min={15} max={600} step={15}
                    value={form.default_video_length}
                    onChange={e => set('default_video_length', parseInt(e.target.value))}
                    className="w-full accent-emerald-500" />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>15s</span><span>1min</span><span>3min</span><span>5min</span><span>10min</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    ~{Math.round(form.default_video_length * 130 / 60)} words · AI will calibrate the script to this duration
                  </p>
                </div>

                {/* Preferred platforms */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-3">Preferred Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                          form.preferred_platforms.includes(p.id)
                            ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                        }`}>
                        <span>{p.emoji}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Captions will default to these platforms when sharing content
                  </p>
                </div>
              </div>
            </div>

            {/* Save button bottom */}
            <button onClick={handleSave} disabled={saving}
              className={`w-full py-4 rounded-xl font-black text-sm transition-all shadow-lg ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 disabled:opacity-50'
              }`}>
              {saving ? '⏳ Saving...' : saved ? '✅ Brand Saved!' : '💾 Save Brand Profile'}
            </button>

          </div>

          {/* ── Right: live preview ── */}
          <div className="lg:col-span-3 hidden lg:block">
            <BrandPreview form={form} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default BrandPage;