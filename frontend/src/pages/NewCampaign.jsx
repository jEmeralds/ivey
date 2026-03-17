import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [brands, setBrands]         = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    brandProfileId: '',   // ← NEW: linked brand profile
    brandName: '',
    websiteUrl: '',
    description: '',
    targetAudience: '',
    aiProvider: 'gemini',
    outputFormats: []
  });

  // ── Fetch saved brand profiles ─────────────────────────────────────────────
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/brand`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // brand_profiles returns array or single object depending on your route
        const list = Array.isArray(data.brands) ? data.brands
                   : data.brand ? [data.brand]
                   : [];
        setBrands(list.filter(Boolean));
      } catch {
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // When user picks a brand, auto-fill brandName
  const handleBrandSelect = (brandId) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({
      ...prev,
      brandProfileId: brandId,
      brandName: selected?.brand_name || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.outputFormats.length === 0) {
      setError('Please select at least one output format');
      return;
    }
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

  const handleFormatToggle = (format) => {
    setFormData(prev => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(format)
        ? prev.outputFormats.filter(f => f !== format)
        : [...prev.outputFormats, format]
    }));
  };

  const selectAllFormats = () => setFormData(prev => ({ ...prev, outputFormats: Object.keys(OUTPUT_FORMATS) }));
  const clearAllFormats  = () => setFormData(prev => ({ ...prev, outputFormats: [] }));

  // ── Shared input/label classes (dark mode aware) ───────────────────────────
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';
  const inputCls = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all';
  const selectCls = inputCls;
  const hintCls  = 'text-xs text-gray-500 dark:text-gray-400 mt-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create New Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate viral marketing content across multiple formats</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Campaign Name */}
            <div>
              <label className={labelCls}>Campaign Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Product Launch 2024"
                className={inputCls}
              />
            </div>

            {/* Brand Profile Selector + Website Row */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Brand Profile Dropdown */}
              <div>
                <label className={labelCls}>Brand Profile</label>
                {brandsLoading ? (
                  <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-400 dark:text-gray-500">
                    Loading brands...
                  </div>
                ) : brands.length > 0 ? (
                  <>
                    <select
                      value={formData.brandProfileId}
                      onChange={(e) => handleBrandSelect(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— No brand / enter manually —</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.brand_name}</option>
                      ))}
                    </select>
                    <p className={hintCls}>
                      Pick a saved brand to auto-fill details and inject into AI prompts
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>No saved brands yet.</span>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard?section=brands')}
                        className="underline font-medium hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                      >
                        Create one →
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Manual Brand Name (shown when no brand selected or no brands) */}
              <div>
                <label className={labelCls}>
                  Brand Name
                  {formData.brandProfileId && (
                    <span className="ml-2 text-xs text-emerald-500 font-normal">✓ from profile</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value, brandProfileId: '' })}
                  placeholder="e.g., CHI Naturals"
                  className={inputCls}
                  disabled={!!formData.brandProfileId}
                />
                <p className={hintCls}>
                  {formData.brandProfileId ? 'Auto-filled from brand profile' : 'Optional — defaults to campaign name'}
                </p>
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label className={labelCls}>Website URL</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://www.example.com"
                className={inputCls}
              />
              <p className={hintCls}>Optional — AI will reference for context</p>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Product/Service Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product, service, or campaign goal in detail. Include key features, benefits, unique selling points, and any specific messaging you want to convey..."
                rows="5"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className={labelCls}>Target Audience *</label>
              <input
                type="text"
                required
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Young professionals aged 25-35, families with children, tech-savvy entrepreneurs"
                className={inputCls}
              />
            </div>

            {/* AI Provider */}
            <div>
              <label className={labelCls}>AI Provider</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'gemini', name: 'Gemini', emoji: '💎', desc: 'Fast & Free tier' },
                  { id: 'claude', name: 'Claude', emoji: '🤖', desc: 'High quality' },
                  { id: 'openai', name: 'OpenAI', emoji: '🧠', desc: 'GPT-4o' }
                ].map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, aiProvider: provider.id })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all text-left ${
                      formData.aiProvider === provider.id
                        ? 'bg-emerald-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{provider.emoji} {provider.name}</div>
                    <div className={`text-xs mt-0.5 ${formData.aiProvider === provider.id ? 'text-emerald-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {provider.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Formats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className={`${labelCls} mb-0`}>
                  Output Formats * <span className="text-emerald-600 dark:text-emerald-400">({formData.outputFormats.length} selected)</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllFormats} className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">Select All</button>
                  <span className="text-gray-400">|</span>
                  <button type="button" onClick={clearAllFormats} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFormatToggle(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.outputFormats.includes(key)
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.outputFormats.includes(key)
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {formData.outputFormats.includes(key) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${
                          formData.outputFormats.includes(key)
                            ? 'text-emerald-900 dark:text-emerald-300'
                            : 'text-gray-900 dark:text-gray-200'
                        }`}>
                          {format.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{format.platform}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.outputFormats.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Select at least one format to generate content</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.outputFormats.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Campaign'}
              </button>
            </div>

          </form>
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { emoji: '🎯', title: 'Multi-Format', desc: 'Generate content for 13+ marketing formats simultaneously' },
            { emoji: '🤖', title: 'AI-Powered',   desc: 'Choose from multiple AI providers for best results' },
            { emoji: '⚡', title: 'Fast & Easy',  desc: 'Create viral campaigns in minutes, not hours' },
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