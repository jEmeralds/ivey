import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById, generateIdeas, generateStrategy, getCampaignMedia } from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';
import MediaUpload from '../components/MediaUpload';

// Visual format identifiers
const VISUAL_FORMATS = ['BANNER_AD', 'PRINT_AD', 'FLYER_TEXT', 'GOOGLE_SEARCH_AD'];

// Collapsible Section Component for Strategy
const StrategySection = ({ title, content, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-gradient-to-r from-green-50 to-teal-50 flex items-center justify-between hover:from-green-100 hover:to-teal-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-white">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
};

// Content Card with Copy/Design tabs for visual formats
const ContentCard = ({ item, isVisualFormat, defaultExpanded = false }) => {
  const [activeTab, setActiveTab] = useState('copy');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  
  // Parse content into sections for visual formats
  const parseVisualContent = (content) => {
    if (!content) return { copy: content, design: '' };
    
    const contentLower = content.toLowerCase();
    const designMarkers = [
      '### design suggestions',
      '### design',
      '**design suggestions**',
      '**design',
      'design suggestions:',
      'design guidelines:',
      'size variations:',
      'layout suggestions:'
    ];
    
    let splitIndex = -1;
    
    for (const marker of designMarkers) {
      const idx = contentLower.indexOf(marker);
      if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) {
        splitIndex = idx;
      }
    }
    
    if (splitIndex !== -1) {
      return {
        copy: content.substring(0, splitIndex).trim(),
        design: content.substring(splitIndex).trim()
      };
    }
    
    return { copy: content, design: '' };
  };

  const handleCopy = (text, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { copy, design } = isVisualFormat ? parseVisualContent(item.content) : { copy: item.content, design: '' };
  const hasDesign = design.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100">
      {/* Header - Always visible */}
      <div 
        className="px-5 py-4 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-600">
            {OUTPUT_FORMATS[item.format]?.platform || 'Content'}
          </span>
          {isVisualFormat && hasDesign && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              + Design
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleCopy(item.content, e)}
            className={`transition-colors p-1 ${copied ? 'text-green-500' : 'text-gray-400 hover:text-purple-600'}`}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Tabs for visual formats with design guidelines */}
          {isVisualFormat && hasDesign && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('copy')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'copy'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                📝 Ad Copy
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'design'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                🎨 Design Guidelines
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="px-5 py-4">
            {(!isVisualFormat || !hasDesign) ? (
              // Simple content display
              <p className="text-gray-800 whitespace-pre-wrap">{item.content}</p>
            ) : activeTab === 'copy' ? (
              // Copy tab content
              <div>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => handleCopy(copy)}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy text only
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{copy}</p>
              </div>
            ) : (
              // Design tab content
              <div>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => handleCopy(design)}
                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy guidelines
                  </button>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{design}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Parse strategy into sections
const parseStrategy = (strategy) => {
  if (!strategy) return [];
  
  const strategyText = typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2);
  
  const sectionPatterns = [
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:CAMPAIGN OBJECTIVES|Executive Summary|Overview)/i, title: 'Campaign Objectives', icon: '🎯' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:TARGET AUDIENCE|Audience Analysis|Demographics)/i, title: 'Target Audience', icon: '👥' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:KEY MESSAGES|Messaging|Value Propositions)/i, title: 'Key Messages', icon: '💬' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:CONTENT STRATEGY|Content Plan)/i, title: 'Content Strategy', icon: '📝' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:DISTRIBUTION|Channel Strategy|Platform)/i, title: 'Distribution Plan', icon: '📢' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:BUDGET|Investment|Cost)/i, title: 'Budget', icon: '💰' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:SUCCESS METRICS|KPIs|Metrics)/i, title: 'Success Metrics', icon: '📊' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:TIMELINE|Schedule|Milestones)/i, title: 'Timeline', icon: '📅' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:COMPETITIVE|Competitor)/i, title: 'Competitive Insights', icon: '🔍' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:OPTIMIZATION|A\/B Testing)/i, title: 'Optimization', icon: '⚡' },
  ];

  const sections = [];
  let foundSections = [];

  sectionPatterns.forEach(({ pattern, title, icon }) => {
    const match = strategyText.match(pattern);
    if (match) {
      foundSections.push({ title, icon, index: match.index, matchLength: match[0].length });
    }
  });

  foundSections.sort((a, b) => a.index - b.index);

  if (foundSections.length > 0) {
    foundSections.forEach((section, i) => {
      const startIndex = section.index + section.matchLength;
      const endIndex = i < foundSections.length - 1 ? foundSections[i + 1].index : strategyText.length;
      const content = strategyText.substring(startIndex, endIndex).trim();
      
      if (content.length > 10) {
        sections.push({
          title: section.title,
          icon: section.icon,
          content: content.replace(/^[:\s]+/, '')
        });
      }
    });
  }

  // Fallback if no sections found
  if (sections.length === 0) {
    sections.push({ title: 'Marketing Strategy', icon: '📊', content: strategyText });
  }

  return sections;
};

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [strategySections, setStrategySections] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [expandAllStrategy, setExpandAllStrategy] = useState(false);
  const [expandAllContent, setExpandAllContent] = useState(false);

  useEffect(() => {
    setError('');
    fetchCampaign();
    fetchMedia();
  }, [id]);

  useEffect(() => {
    if (strategy) {
      setStrategySections(parseStrategy(strategy));
    }
  }, [strategy]);

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
      setError('');
      const data = await getCampaignById(id);
      const rawCampaign = data.campaign;
      
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
      setError(err.response?.data?.error || 'Failed to generate strategy');
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
      setError(err.response?.data?.error || 'Failed to generate content');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredContent = selectedFormat === 'all'
    ? generatedContent
    : generatedContent.filter(item => item.format === selectedFormat);

  const groupedContent = filteredContent.reduce((acc, item) => {
    if (!acc[item.format]) acc[item.format] = [];
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
          <button onClick={() => navigate('/dashboard')} className="text-purple-600 hover:text-purple-700">
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
                 campaign.ai_provider === 'openai' ? '🧠 OpenAI' : '💎 Gemini'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Output Formats</span>
              <p className="font-medium text-gray-900 mt-1">
                {campaign.output_formats?.length || 0} formats selected
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-500 block mb-3">Selected Formats:</span>
            <div className="flex flex-wrap gap-2">
              {campaign.output_formats?.map((format) => (
                <span key={format} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {OUTPUT_FORMATS[format]?.name || format}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="mb-8">
          <MediaUpload campaignId={id} media={media} onUploadSuccess={fetchMedia} />
        </div>

        {/* Generate Buttons - Show when no content exists */}
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
                ) : '📊 Generate Marketing Strategy'}
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
                ) : '🚀 Generate Content'}
              </button>
            </div>
          </div>
        )}

        {/* Marketing Strategy Display */}
        {strategy && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900">📊 Marketing Strategy</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setExpandAllStrategy(!expandAllStrategy)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  {expandAllStrategy ? '📖 Collapse All' : '📖 Expand All'}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  📋 Copy All
                </button>
                <button
                  onClick={handleGenerateStrategy}
                  disabled={generatingStrategy}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  {generatingStrategy ? 'Regenerating...' : '🔄 Regenerate'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {strategySections.map((section, index) => (
                <StrategySection
                  key={index}
                  title={section.title}
                  content={section.content}
                  icon={section.icon}
                  defaultOpen={expandAllStrategy || index === 0}
                />
              ))}
            </div>

            {generatedContent.length === 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header with controls */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900">🎨 Generated Content</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setExpandAllContent(!expandAllContent)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  {expandAllContent ? '📖 Collapse All' : '📖 Expand All'}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {generating ? 'Regenerating...' : '🔄 Regenerate All'}
                </button>
              </div>
            </div>

            {/* Format Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedFormat === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({generatedContent.length})
              </button>
              {campaign.output_formats?.map((format) => {
                const count = generatedContent.filter(item => item.format === format).length;
                if (count === 0) return null;
                return (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedFormat === format
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {OUTPUT_FORMATS[format]?.name || format} ({count})
                  </button>
                );
              })}
            </div>

            {/* Content Cards by Format */}
            {Object.entries(groupedContent).map(([format, items]) => (
              <div key={format} className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>{OUTPUT_FORMATS[format]?.name || format}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({items.length} {items.length === 1 ? 'variation' : 'variations'})
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((item, index) => (
                    <ContentCard
                      key={index}
                      item={item}
                      isVisualFormat={VISUAL_FORMATS.includes(format)}
                      defaultExpanded={expandAllContent}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;