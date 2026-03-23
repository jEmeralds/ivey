import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import { IMAGE_FORMATS } from '../constants/outputFormats';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const fmtDuration = (secs) => {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [brands, setBrands]               = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name:            '',
    brandProfileId:  '',
    brandName:       '',
    websiteUrl:      '',
    description:     '',
    targetAudience:  '',
    aiProvider:      'openai',
    outputFormats:   [],  // image format keys
    includeVideo:    false,
    videoDuration:   60,  // seconds
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const list = Array.isArray(data.brands) ? data.brands : data.brand ? [data.brand] : [];
        setBrands(list.filter(Boolean));

        // Auto-select default brand
        const def = list.find(b => b.is_default);
        if (def) {
          setFormData(prev => ({
            ...prev,
            brandProfileId:  def.id,
            brandName:       def.brand_name || '',
            videoDuration:   def.default_video_length || 60,
          }));
        }
      } catch { setBrands([]); }
      finally { setBrandsLoading(false); }
    };
    fetchBrands();
  }, []);

  const handleBrandSelect = (brandId) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({
      ...prev,
      brandProfileId: brandId,
      brandName:      selected?.brand_name || '',
      // Pre-fill video duration from brand default
      videoDuration:  selected?.default_video_length || prev.videoDuration,
    }));
  };

  const toggleFormat = (key) => setFormData(prev => ({
    ...prev,
    outputFormats: prev.outputFormats.includes(key)
      ? prev.outputFormats.filter(f => f !== key)
      : [...prev.outputFormats, key],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.outputFormats.length === 0 && !formData.includeVideo) {
      setError('Please select at least one image format or include a video script');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Build final formats list — add VIDEO_SCRIPT key if video is included
      const formats = [
        ...formData.outputFormats,
        ...(formData.includeVideo ? ['VIDEO_SCRIPT'] : []),
      ];
      const response = await createCampaign({
        ...formData,
        outputFormats: formats,
      });
      navigate(`/campaigns/${response.campaign.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none';
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';
  const hintCls  = 'text-xs text-gray-500 dark:text-gray-400 mt-1';

  const wordCount   = Math.round(formData.videoDuration * 130 / 60);
  const hasContent  = formData.outputFormats.length > 0 || formData.includeVideo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mb-6 transition-colors text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create New Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate AI marketing visuals and video scripts from a single brief</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Campaign Name */}
            <div>
              <label className={labelCls}>Campaign Name *</label>
              <input type="text" required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Product Launch 2025" className={inputCls} />
            </div>

            {/* Brand + Brand Name */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Brand Profile</label>
                {brandsLoading ? (
                  <div className={`${inputCls} text-gray-400`}>Loading brands...</div>
                ) : brands.length > 0 ? (
                  <>
                    <select value={formData.brandProfileId} onChange={e => handleBrandSelect(e.target.value)} className={inputCls}>
                      <option value="">— No brand / enter manually —</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}{b.is_default ? ' (default)' : ''}</option>)}
                    </select>
                    <p className={hintCls}>Brand colors, voice, and video length will guide generation</p>
                  </>
                ) : (
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <span>⚠️</span><span>No saved brands yet.</span>
                    <button type="button" onClick={() => navigate('/brand')} className="underline font-medium">Create one →</button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Brand Name {formData.brandProfileId && <span className="ml-2 text-xs text-emerald-500 font-normal">✓ from profile</span>}</label>
                <input type="text" value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value, brandProfileId: '' })}
                  placeholder="e.g., CHI Naturals" className={inputCls} disabled={!!formData.brandProfileId} />
                <p className={hintCls}>{formData.brandProfileId ? 'Auto-filled from brand profile' : 'Optional — defaults to campaign name'}</p>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className={labelCls}>Website URL</label>
              <input type="url" value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://www.example.com" className={inputCls} />
              <p className={hintCls}>Optional — used for context</p>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Product / Service Description *</label>
              <textarea required rows={5} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you are promoting. Include colours, textures, key features, and the mood or feeling you want the visuals and script to convey. The more specific you are, the better the results..."
                className={`${inputCls} resize-none`} />
              <p className={hintCls}>This drives both image generation and the video script</p>
            </div>

            {/* Target Audience */}
            <div>
              <label className={labelCls}>Target Audience *</label>
              <input type="text" required value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Health-conscious women 25–40, urban professionals who care about wellness"
                className={inputCls} />
            </div>

            {/* ── Image Formats ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className={`${labelCls} mb-0`}>
                    🎨 Image Formats
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal">({formData.outputFormats.length} selected)</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Each generates a DALL-E 3 image at the correct dimensions</p>
                </div>
                <div className="flex gap-2 text-sm flex-shrink-0">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, outputFormats: Object.keys(IMAGE_FORMATS) }))} className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700">Select All</button>
                  <span className="text-gray-400">|</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, outputFormats: [] }))} className="text-gray-500 font-medium hover:text-gray-700">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(IMAGE_FORMATS).map(([key, fmt]) => {
                  const selected = formData.outputFormats.includes(key);
                  const maxH = 44, maxW = 68;
                  const ratio = fmt.width / fmt.height;
                  const previewH = Math.round(Math.min(maxH, maxW / ratio));
                  const previewW = Math.round(previewH * ratio);

                  return (
                    <button key={key} type="button" onClick={() => toggleFormat(key)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}>
                      <div className="flex justify-center mb-3" style={{ height: maxH + 4 }}>
                        <div style={{ width: previewW, height: previewH, marginTop: maxH - previewH }}
                          className={`rounded-sm border transition-colors ${selected ? 'bg-emerald-400/30 border-emerald-500/50' : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'}`} />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 dark:border-gray-500'}`}>
                          {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-sm ${selected ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-200'}`}>{fmt.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmt.platform}</div>
                          <div className="text-xs font-mono text-gray-400 mt-0.5">{fmt.aspect} · {fmt.width}×{fmt.height}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Video Script ── */}
            <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
              formData.includeVideo
                ? 'border-red-500/50 bg-red-950/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              {/* Toggle header */}
              <button type="button"
                onClick={() => setFormData(prev => ({ ...prev, includeVideo: !prev.includeVideo }))}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    formData.includeVideo ? 'bg-red-500/10' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>🎬</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Video Script</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      AI generates a full timed production script — take it to HeyGen to produce the video
                    </div>
                  </div>
                </div>
                {/* Toggle switch */}
                <div className={`w-12 h-6 rounded-full transition-all flex-shrink-0 relative ${
                  formData.includeVideo ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    formData.includeVideo ? 'left-7' : 'left-1'
                  }`} />
                </div>
              </button>

              {/* Duration controls — shown when video is toggled on */}
              {formData.includeVideo && (
                <div className="px-5 pb-5 space-y-4 border-t border-red-500/20">
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Video Duration</label>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{fmtDuration(formData.videoDuration)}</span>
                        <span className="text-xs text-gray-500">≈ {wordCount} words</span>
                      </div>
                    </div>

                    <input type="range" min={15} max={600} step={15}
                      value={formData.videoDuration}
                      onChange={e => setFormData(prev => ({ ...prev, videoDuration: parseInt(e.target.value) }))}
                      className="w-full accent-red-500" />

                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>15s</span><span>1 min</span><span>3 min</span><span>5 min</span><span>10 min</span>
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Quick presets</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '15s — Flash',     secs: 15  },
                        { label: '30s — Short',     secs: 30  },
                        { label: '60s — Standard',  secs: 60  },
                        { label: '2m — Extended',   secs: 120 },
                        { label: '5m — Deep dive',  secs: 300 },
                        { label: '10m — Long form', secs: 600 },
                      ].map(p => (
                        <button key={p.secs} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, videoDuration: p.secs }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            formData.videoDuration === p.secs
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Script structure preview */}
                  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Script structure for {fmtDuration(formData.videoDuration)}</p>
                    <div className="space-y-1">
                      {getScriptStructure(formData.videoDuration).map((section, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600 font-mono w-16 flex-shrink-0">{section.time}</span>
                          <span className="text-gray-300">{section.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    💡 Script will be ready to paste directly into HeyGen. You can edit it before producing.
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-xl">
              <span className="text-lg flex-shrink-0">✨</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {formData.includeVideo && formData.outputFormats.length > 0
                    ? `Generating ${formData.outputFormats.length} image${formData.outputFormats.length !== 1 ? 's' : ''} + 1 video script`
                    : formData.includeVideo
                    ? 'Generating video script only'
                    : `Generating ${formData.outputFormats.length} image${formData.outputFormats.length !== 1 ? 's' : ''} via DALL-E 3`}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {formData.includeVideo
                    ? 'Video script uses Gemini (free). Images require OpenAI API with active billing.'
                    : 'Images require OpenAI API key with active billing.'}
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading || !hasContent}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    Creating...
                  </span>
                ) : 'Create Campaign →'}
              </button>
            </div>
          </form>
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { emoji: '🎨', title: 'AI Visuals',     desc: 'DALL-E 3 generates images at exact platform dimensions — no cropping needed' },
            { emoji: '🎬', title: 'Video Scripts',  desc: 'Full timed scripts calibrated to your chosen duration, ready for HeyGen' },
            { emoji: '📤', title: 'Share Anywhere', desc: 'Captions generated per platform at share time — Instagram, TikTok, Twitter and more' },
          ].map(c => (
            <div key={c.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">{c.emoji}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{c.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Script structure preview helper ─────────────────────────────────────────
function getScriptStructure(secs) {
  if (secs <= 30) return [
    { time: '0–3s',          label: '🪝 Hook — stop the scroll' },
    { time: `3–${secs}s`,    label: '📣 CTA — drive action' },
  ];
  if (secs <= 90) return [
    { time: '0–5s',          label: '🪝 Hook' },
    { time: '5–30s',         label: '❗ Problem' },
    { time: '30–70s',        label: '✅ Solution & product' },
    { time: `70–${secs}s`,   label: '📣 CTA' },
  ];
  if (secs <= 180) return [
    { time: '0–10s',         label: '🪝 Hook' },
    { time: '10–40s',        label: '❗ Problem & context' },
    { time: '40–120s',       label: '✅ Solution & demonstration' },
    { time: '120–150s',      label: '⭐ Social proof' },
    { time: `150–${secs}s`,  label: '📣 CTA' },
  ];
  if (secs <= 300) return [
    { time: '0–15s',         label: '🪝 Hook' },
    { time: '15–60s',        label: '❗ Problem & audience pain point' },
    { time: '60–180s',       label: '✅ Solution, features & demo' },
    { time: '180–240s',      label: '⭐ Social proof & credibility' },
    { time: `240–${secs}s`,  label: '📣 CTA & offer' },
  ];
  return [
    { time: '0–30s',         label: '🪝 Hook & promise' },
    { time: '30–120s',       label: '📖 Context & problem deep dive' },
    { time: '120–300s',      label: '✅ Solution, chapters & details' },
    { time: '300–480s',      label: '⭐ Proof, testimonials & results' },
    { time: `480–${secs}s`,  label: '📣 CTA, offer & next steps' },
  ];
}

export default NewCampaign;