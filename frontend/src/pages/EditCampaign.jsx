import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaignById, updateCampaign } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAudience: '',
    aiProvider: 'claude',
    outputFormats: []
  });

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaignById(id);
      const campaign = data.campaign;
      
      setFormData({
        name: String(campaign.name || ''),
        description: String(campaign.description || ''),
        targetAudience: String(campaign.target_audience || ''),
        aiProvider: String(campaign.ai_provider || 'claude'),
        outputFormats: Array.isArray(campaign.output_formats) ? campaign.output_formats : []
      });
    } catch (err) {
      setError('Failed to load campaign');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.outputFormats.length === 0) {
      setError('Please select at least one output format');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateCampaign(id, formData);
      navigate(`/campaign/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update campaign');
      setSaving(false);
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

  const selectAllFormats = () => {
    setFormData(prev => ({
      ...prev,
      outputFormats: Object.keys(OUTPUT_FORMATS)
    }));
  };

  const clearAllFormats = () => {
    setFormData(prev => ({
      ...prev,
      outputFormats: []
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/campaign/${id}`)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaign
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Campaign</h1>
          <p className="text-gray-600">Update your viral marketing campaign</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Product Launch 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product, service, or campaign goal..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Audience *
              </label>
              <input
                type="text"
                required
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Young professionals aged 25-35, tech-savvy"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* AI Provider */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                AI Provider
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['claude', 'openai', 'gemini'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setFormData({ ...formData, aiProvider: provider })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.aiProvider === provider
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {provider === 'claude' && '🤖 Claude'}
                    {provider === 'openai' && '🧠 OpenAI'}
                    {provider === 'gemini' && '💎 Gemini'}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Formats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Output Formats * ({formData.outputFormats.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllFormats}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={clearAllFormats}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
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
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.outputFormats.includes(key)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.outputFormats.includes(key) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${
                          formData.outputFormats.includes(key) ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {format.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format.platform}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.outputFormats.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Select at least one format to generate content
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/campaign/${id}`)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || formData.outputFormats.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;