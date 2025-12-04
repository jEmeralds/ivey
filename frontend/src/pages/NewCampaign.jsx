import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';

const NewCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    websiteUrl: '',
    description: '',
    targetAudience: '',
    aiProvider: 'gemini',
    outputFormats: []
  });

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
      navigate(`/campaign/${response.campaign.id}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Campaign</h1>
          <p className="text-gray-600">Generate viral marketing content across multiple formats</p>
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

            {/* Brand Name & Website Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., Njambie Spot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - defaults to campaign name</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - AI will reference for context</p>
              </div>
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product/Service Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product, service, or campaign goal in detail. Include key features, benefits, unique selling points, and any specific messaging you want to convey..."
                rows="5"
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
                placeholder="e.g., Young professionals aged 25-35, families with children, tech-savvy entrepreneurs"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* AI Provider */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                AI Provider
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'gemini', name: '💎 Gemini', desc: 'Fast & Free tier' },
                  { id: 'claude', name: '🤖 Claude', desc: 'High quality' },
                  { id: 'openai', name: '🧠 OpenAI', desc: 'GPT-4o' }
                ].map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, aiProvider: provider.id })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all text-left ${
                      formData.aiProvider === provider.id
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{provider.name}</div>
                    <div className={`text-xs mt-0.5 ${formData.aiProvider === provider.id ? 'text-purple-200' : 'text-gray-500'}`}>
                      {provider.desc}
                    </div>
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

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.outputFormats.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-1">Multi-Format</h3>
            <p className="text-sm text-gray-600">Generate content for 13+ marketing formats simultaneously</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-600">Choose from multiple AI providers for best results</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">Fast & Easy</h3>
            <p className="text-sm text-gray-600">Create viral campaigns in minutes, not hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaign;