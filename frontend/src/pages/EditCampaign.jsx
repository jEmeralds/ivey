import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaignById, updateCampaign } from '../services/api';

const AI_PROVIDERS = [
  { id: 'gemini', label: 'Gemini', icon: '💎', desc: 'Free tier, fast'    },
  { id: 'claude', label: 'Claude', icon: '🤖', desc: 'Creative & precise' },
  { id: 'openai', label: 'GPT-4o', icon: '🧠', desc: 'Versatile'          },
];

const EditCampaign = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const [formData, setFormData] = useState({
    name:           '',
    description:    '',
    targetAudience: '',
    aiProvider:     'gemini',
    outputFormats:  [],
  });

  useEffect(() => { fetchCampaign(); }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data     = await getCampaignById(id);
      const campaign = data.campaign;
      setFormData({
        name:           String(campaign.name || ''),
        description:    String(campaign.description || campaign.product_description || ''),
        targetAudience: String(campaign.target_audience || ''),
        aiProvider:     String(campaign.ai_provider || 'gemini'),
        outputFormats:  Array.isArray(campaign.output_formats) ? campaign.output_formats : [],
      });
    } catch (err) {
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.targetAudience.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateCampaign(id, formData);
      navigate(`/campaigns/${id}`, { state: { from: 'campaigns' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update campaign');
      setSaving(false);
    }
  };

  const inp = 'w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm';
  const lbl = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';

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
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mb-8 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Campaign
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Edit Campaign</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your campaign details</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div>
              <label className={lbl}>Campaign Name *</label>
              <input type="text" required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., MOONRALDS SAFARI LAUNCH 2025"
                className={inp}/>
            </div>

            {/* Description */}
            <div>
              <label className={lbl}>Product / Service Description *</label>
              <textarea required rows={5} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you are promoting..."
                className={`${inp} resize-none leading-relaxed`}/>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                This drives the video script and all generated content
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <label className={lbl}>Target Audience *</label>
              <input type="text" required value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Health-conscious women 25–40, urban professionals"
                className={inp}/>
            </div>

            {/* AI Provider */}
            <div>
              <label className={lbl}>AI Provider</label>
              <div className="grid grid-cols-3 gap-3">
                {AI_PROVIDERS.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => setFormData({ ...formData, aiProvider: p.id })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      formData.aiProvider === p.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}>
                    <span className="text-xl">{p.icon}</span>
                    <span className={`text-xs font-bold ${formData.aiProvider === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {p.label}
                    </span>
                    <span className="text-xs text-gray-400 text-center">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                <span>⚠️</span>{error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-sm">
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
    </div>
  );
};

export default EditCampaign;