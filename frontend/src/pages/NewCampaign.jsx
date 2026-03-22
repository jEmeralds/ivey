import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [brands, setBrands]               = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name:           '',
    brandProfileId: '',
    brandName:      '',
    websiteUrl:     '',
    description:    '',
    targetAudience: '',
    aiProvider:     'openai',
    outputFormats:  [],
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/brand`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const list = Array.isArray(data.brands) ? data.brands : data.brand ? [data.brand] : [];
        setBrands(list.filter(Boolean));
      } catch { setBrands([]); }
      finally { setBrandsLoading(false); }
    };
    fetchBrands();
  }, []);

  const handleBrandSelect = (brandId) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({ ...prev, brandProfileId: brandId, brandName: selected?.brand_name || '' }));
  };

  const toggleFormat = (key) => setFormData(prev => ({
    ...prev,
    outputFormats: prev.outputFormats.includes(key)
      ? prev.outputFormats.filter(f => f !== key)
      : [...prev.outputFormats, key],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.outputFormats.length === 0) { setError('Please select at least one image format'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await createCampaign(formData);
      navigate(`/campaigns/${response.campaign.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';
  const hintCls  = 'text-xs text-gray-500 dark:text-gray-400 mt-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create New Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate AI marketing visuals — banners, posters, flyers, and social graphics</p>
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
                      {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                    </select>
                    <p className={hintCls}>Brand colors and identity will guide the AI visuals</p>
                  </>
                ) : (
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <span>⚠️</span><span>No saved brands yet.</span>
                    <button type="button" onClick={() => navigate('/dashboard?section=brands')} className="underline font-medium">Create one →</button>
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
              <p className={hintCls}>Optional — used for context in visual generation</p>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Product / Service Description *</label>
              <textarea required rows={5} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you are promoting. Include colours, textures, key features, and the mood or feeling you want the visuals to convey. The more specific you are, the better the images..."
                className={`${inputCls} resize-none`} />
              <p className={hintCls}>This drives the DALL-E image generation — be visual and specific</p>
            </div>

            {/* Target Audience */}
            <div>
              <label className={labelCls}>Target Audience *</label>
              <input type="text" required value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Young professionals 25–35, health-conscious, urban lifestyle"
                className={inputCls} />
            </div>

            {/* Image Formats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className={`${labelCls} mb-0`}>
                    Image Formats *
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal">({formData.outputFormats.length} selected)</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Each format generates one DALL-E 3 image at the correct dimensions</p>
                </div>
                <div className="flex gap-2 text-sm flex-shrink-0">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, outputFormats: Object.keys(OUTPUT_FORMATS) }))} className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700">Select All</button>
                  <span className="text-gray-400">|</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, outputFormats: [] }))} className="text-gray-500 font-medium hover:text-gray-700">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(OUTPUT_FORMATS).map(([key, fmt]) => {
                  const selected = formData.outputFormats.includes(key);
                  // Calculate proportional aspect ratio preview box
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
                      {/* Aspect ratio visual */}
                      <div className="flex justify-center mb-3" style={{ height: maxH + 4 }}>
                        <div
                          style={{ width: previewW, height: previewH, marginTop: maxH - previewH }}
                          className={`rounded-sm border transition-colors ${
                            selected ? 'bg-emerald-400/30 border-emerald-500/50' : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                          }`} />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 dark:border-gray-500'
                        }`}>
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

              {formData.outputFormats.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Select at least one format to generate images</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* DALL-E notice */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-xl">
              <span className="text-xl flex-shrink-0">🎨</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Powered by DALL-E 3</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Each format generates one unique high-quality image. Requires an OpenAI API key with active billing. Social media captions are generated when you share.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading || formData.outputFormats.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
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
            { emoji: '🎨', title: 'AI-Generated Visuals', desc: 'DALL-E 3 creates unique images tailored to your brand, product, and audience' },
            { emoji: '📐', title: 'Format-Perfect Sizes', desc: 'Each image is generated at exact platform dimensions — no cropping or resizing' },
            { emoji: '📤', title: 'Share Anywhere',       desc: 'Post to Instagram, Twitter, TikTok and more. Captions generated at share time' },
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

export default NewCampaign;