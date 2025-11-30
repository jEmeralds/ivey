import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById, generateIdeas, generateStrategy, getCampaignMedia } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';
import MediaUpload from '../components/MediaUpload';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');

  useEffect(() => {
    setError(''); // Clear any stale errors
    fetchCampaign();
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    try {
      const data = await getCampaignMedia(id);
      setMedia(data.media || []);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const data = await getCampaignById(id);
      const rawCampaign = data.campaign;
      
      // Ensure all fields are safe strings
      const safeCampaign = {
        id: String(rawCampaign.id || ''),
        name: String(rawCampaign.name || 'Untitled Campaign'),
        description: String(rawCampaign.description || 'No description'),
        target_audience: String(rawCampaign.target_audience || 'N/A'),
        ai_provider: String(rawCampaign.ai_provider || 'claude'),
        output_formats: Array.isArray(rawCampaign.output_formats) ? rawCampaign.output_formats : [],
        status: String(rawCampaign.status || ''),
        created_at: rawCampaign.created_at,
        updated_at: rawCampaign.updated_at,
        generated_content: Array.isArray(rawCampaign.generated_content) ? rawCampaign.generated_content : []
      };
      
      setCampaign(safeCampaign);
      setGeneratedContent(safeCampaign.generated_content);
    } catch (err) {
      setError('Failed to load campaign');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategy = async () => {
    try {
      setGeneratingStrategy(true);
      setError('');
      const data = await generateStrategy(id);
      setStrategy(data.strategy);
    } catch (err) {
      // Check if it's a 404 (endpoint not implemented yet)
      if (err.response?.status === 404) {
        let errorMessage = '';
        if (campaign?.ai_provider === 'claude') {
          errorMessage = 'Strategy generation requires Anthropic (Claude) API credits. Please add credits to your Anthropic account to enable this feature.';
        } else if (campaign?.ai_provider === 'openai') {
          errorMessage = 'Strategy generation requires OpenAI API credits. Please add credits to your OpenAI account to enable this feature.';
        } else if (campaign?.ai_provider === 'gemini') {
          errorMessage = 'Strategy generation requires a Google AI (Gemini) API key. Gemini offers a free tier - get your API key at ai.google.dev to enable this feature.';
        } else {
          errorMessage = 'Strategy generation requires API credentials. Please configure your AI provider account.';
        }
        setError(errorMessage);
      } else {
        setError(err.response?.data?.error || 'Failed to generate strategy');
      }
      console.error(err);
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      const data = await generateIdeas(id);
      setGeneratedContent(data.generatedContent || []);
    } catch (err) {
      // Check if it's a 404 (endpoint not implemented yet)
      if (err.response?.status === 404) {
        let errorMessage = '';
        if (campaign?.ai_provider === 'claude') {
          errorMessage = 'Content generation requires Anthropic (Claude) API credits. Please add credits to your Anthropic account to enable this feature.';
        } else if (campaign?.ai_provider === 'openai') {
          errorMessage = 'Content generation requires OpenAI API credits. Please add credits to your OpenAI account to enable this feature.';
        } else if (campaign?.ai_provider === 'gemini') {
          errorMessage = 'Content generation requires a Google AI (Gemini) API key. Gemini offers a free tier - get your API key at ai.google.dev to enable this feature.';
        } else {
          errorMessage = 'Content generation requires API credentials. Please configure your AI provider account.';
        }
        setError(errorMessage);
      } else {
        setError(err.response?.data?.error || 'Failed to generate content');
      }
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredContent = selectedFormat === 'all'
    ? generatedContent
    : generatedContent.filter(item => item.format === selectedFormat);

  const groupedContent = filteredContent.reduce((acc, item) => {
    if (!acc[item.format]) {
      acc[item.format] = [];
    }
    acc[item.format].push(item);
    return acc;
  }, {});

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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-2">{campaign.description}</p>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <span className="text-sm text-gray-500">Target Audience</span>
              <p className="font-medium text-gray-900 mt-1">{campaign.target_audience}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">AI Provider</span>
              <p className="font-medium text-gray-900 mt-1">
                {campaign.ai_provider === 'claude' ? '🤖 Claude' :
                 campaign.ai_provider === 'openai' ? '🧠 OpenAI' :
                 '💎 Gemini'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Output Formats</span>
              <p className="font-medium text-gray-900 mt-1">
                {campaign.output_formats?.length || 0} formats selected
              </p>
            </div>
          </div>

          {/* Selected Formats */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-500 block mb-3">Selected Formats:</span>
            <div className="flex flex-wrap gap-2">
              {campaign.output_formats?.map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {OUTPUT_FORMATS[format]?.name || format}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="mb-8">
          <MediaUpload 
            campaignId={id}
            media={media}
            onUploadSuccess={fetchMedia}
          />
        </div>

        {/* Generate Buttons Section */}
        {generatedContent.length === 0 && !strategy && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to create your campaign?</h2>
            <p className="text-gray-600 mb-8">
              Start by generating a marketing strategy, then create content for all formats
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGenerateStrategy}
                disabled={generatingStrategy}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {generatingStrategy ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Strategy...
                  </span>
                ) : (
                  <>
                    <span className="mr-2">📊</span>
                    Generate Marketing Strategy
                  </>
                )}
              </button>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Content...
                  </span>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Marketing Strategy Display */}
        {strategy && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 Marketing Strategy</h2>
              <button
                onClick={handleGenerateStrategy}
                disabled={generatingStrategy}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {generatingStrategy ? 'Regenerating...' : '🔄 Regenerate'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 p-6 rounded-xl">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2)}
                </p>
              </div>
            </div>

            {generatedContent.length === 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-4">Ready to create content based on this strategy?</p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {generating ? 'Generating...' : '🚀 Generate Content Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Generated Content */}
        {generatedContent.length > 0 && (
          <div>
            {/* Filter Buttons */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generated Content</h2>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedFormat('all')}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                    selectedFormat === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All ({generatedContent.length})
                </button>
                {campaign.output_formats?.map((format) => {
                  const count = generatedContent.filter(item => item.format === format).length;
                  return (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                        selectedFormat === format
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {OUTPUT_FORMATS[format]?.name || format} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Cards Grouped by Format */}
            {Object.entries(groupedContent).map(([format, items]) => (
              <div key={format} className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>{OUTPUT_FORMATS[format]?.name || format}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({items.length} {items.length === 1 ? 'variation' : 'variations'})
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-purple-600">
                          {OUTPUT_FORMATS[item.format]?.platform || 'Platform'}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(item.content)}
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          title="Copy to clipboard"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Regenerate Button */}
            <div className="text-center mt-8">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {generating ? 'Generating...' : '🔄 Regenerate Content'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;