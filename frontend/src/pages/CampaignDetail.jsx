// frontend/src/pages/CampaignDetail.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Campaign detail — stripped to essentials
// Script generation moved to Studio
// This page: campaign info, media uploads, strategy, saved library
// Primary CTA: Open in Studio
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCampaignById, generateStrategy, getCampaignMedia,
} from '../services/api';
import MediaUpload from '../components/MediaUpload';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm shadow-2xl transition-all duration-300 ${
      type === 'error' ? 'bg-red-900/80 border-red-500 text-red-300' :
      type === 'info'  ? 'bg-gray-900/80 border-emerald-500 text-emerald-300' :
                         'bg-green-900/80 border-amber-500 text-amber-300'
    }`}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// ── Strategy helpers ──────────────────────────────────────────────────────────
const parseStrategy = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  const sections = raw.split(/\n(?=##\s)/).filter(Boolean);
  return sections.map(s => {
    const lines   = s.trim().split('\n');
    const title   = lines[0].replace(/^#+\s*/, '').trim();
    const content = lines.slice(1).join('\n').trim();
    const icons   = { 'Hook': '🎣', 'Script': '📝', 'Target': '🎯', 'Platform': '📱', 'Distribution': '🚀', 'Visual': '🎨', 'Call': '📢' };
    const icon    = Object.entries(icons).find(([k]) => title.includes(k))?.[1] || '📊';
    return { title, content, icon };
  });
};

const StrategySection = ({ title, content, icon, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
        </div>
        <span className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-gray-900">
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};


// ── Main ──────────────────────────────────────────────────────────────────────
const CampaignDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [campaign,           setCampaign]           = useState(null);
  const [strategy,           setStrategy]           = useState(null);
  const [strategySections,   setStrategySections]   = useState([]);
  const [media,              setMedia]              = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [error,              setError]              = useState('');
  const [toast,              setToast]              = useState({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }, []);

  useEffect(() => { fetchCampaign(); fetchMedia(); }, [id]);
  useEffect(() => { if (strategy) setStrategySections(parseStrategy(strategy)); }, [strategy]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaignById(id);
      const raw  = data.campaign;
      setCampaign({
        id:              String(raw.id || ''),
        name:            String(raw.name || 'Untitled Campaign'),
        description:     String(raw.product_description || raw.description || ''),
        target_audience: String(raw.target_audience || ''),
        ai_provider:     String(raw.ai_provider || 'gemini'),
        status:          String(raw.status || ''),
        created_at:      raw.created_at,
      });
    } catch { setError('Failed to load campaign'); }
    finally { setLoading(false); }
  };

  const fetchMedia  = async () => { try { const d = await getCampaignMedia(id); setMedia(d.media || []); } catch {} };


  const handleGenerateStrategy = async () => {
    try {
      setGeneratingStrategy(true); setError('');
      const data = await generateStrategy(id);
      setStrategy(data.strategy);
    } catch (err) { setError(err.response?.data?.error || 'Failed to generate strategy'); }
    finally { setGeneratingStrategy(false); }
  };

  const openInStudio = () => navigate(`/dashboard?section=studio&campaign=${id}`);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"/>
        <p className="mt-4 text-gray-400">Loading campaign...</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign not found</h2>
        <button onClick={() => navigate('/dashboard?section=campaigns')} className="text-emerald-500 hover:text-emerald-400">← Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/dashboard?section=campaigns')}
          className="text-emerald-500 hover:text-emerald-400 font-medium mb-6 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Campaigns
        </button>

        {/* Campaign header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{campaign.name}</h1>
              <p className="text-gray-400 mt-1 text-sm leading-relaxed">{campaign.description}</p>
            </div>
            <button onClick={openInStudio}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              Open in Studio
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Target Audience</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{campaign.target_audience || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">AI Provider</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 capitalize">{campaign.ai_provider || 'gemini'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Created</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Studio CTA banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">🎬</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white text-sm">Generate script, produce video, distribute</p>
            <p className="text-xs text-gray-500 mt-0.5">Upload your media below, then open Studio to create your content.</p>
          </div>
          <button onClick={openInStudio}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all flex-shrink-0">
            Studio →
          </button>
        </div>

        {/* Media uploads */}
        <div className="mb-6">
          <MediaUpload campaignId={id} media={media} onUploadSuccess={fetchMedia} onSelectForVisual={() => {}} selectedMediaId={null}/>
        </div>

        {/* Media tip for Studio */}
        {media.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
            <span className="text-blue-400 flex-shrink-0">💡</span>
            <p className="text-xs text-blue-300">
              {media.length} media file{media.length > 1 ? 's' : ''} uploaded. When you open Studio and produce a video,
              IVey will pass your media to HeyGen automatically as background assets.
              For manual HeyGen use, download your files and upload them directly in HeyGen's editor.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {/* Strategy */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">📊 Marketing Strategy</h2>
              <p className="text-xs text-gray-500 mt-0.5">AI-generated campaign strategy</p>
            </div>
            <button onClick={handleGenerateStrategy} disabled={generatingStrategy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all">
              {generatingStrategy
                ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"/><span>Generating...</span></>
                : <><span>⚡</span><span>{strategy ? 'Regenerate' : 'Generate Strategy'}</span></>
              }
            </button>
          </div>

          {strategy ? (
            <div className="space-y-2">
              {strategySections.map((section, i) => (
                <StrategySection key={i} title={section.title} content={section.content} icon={section.icon} defaultOpen={i === 0}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm">No strategy yet. Click Generate Strategy to create one.</p>
            </div>
          )}
        </div>

      </div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible}/>
    </div>
  );
};

export default CampaignDetail;