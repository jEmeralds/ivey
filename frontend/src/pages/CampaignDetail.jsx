import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCampaignById, generateIdeas, generateStrategy, getCampaignMedia,
  saveContent, getSavedContent, deleteSavedContent, createShareLink
} from '../services/api';
import { OUTPUT_FORMATS } from '../constants/outputFormats';
import MediaUpload from '../components/MediaUpload';
import ReactMarkdown from 'react-markdown';
import { usePostToSocial } from '../components/SocialConnect';

const VISUAL_FORMATS = ['BANNER_AD', 'PRINT_AD', 'FLYER_TEXT', 'GOOGLE_SEARCH_AD'];
const VIDEO_FORMATS  = ['YOUTUBE_VIDEO_AD', 'YOUTUBE_SHORTS'];

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ivey-steel.vercel.app';
const API_URL      = import.meta.env.VITE_API_URL      || 'https://ivey-backend-production.up.railway.app';

// ── Clean text for Canva (caption/copy only, no markdown) ────────────────────
function cleanForCanva(content = '', format = '') {
  // For visual formats (banner, flyer etc) — extract only the copy section
  const lower = content.toLowerCase();
  const designMarkers = ['### design', '**design suggestions', 'design suggestions:', 'design guidelines:', 'layout suggestions', 'size variations'];
  let endIndex = content.length;
  for (const m of designMarkers) {
    const idx = lower.indexOf(m);
    if (idx !== -1 && idx < endIndex) endIndex = idx;
  }
  const copyOnly = content.substring(0, endIndex);

  return copyOnly
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/---+/g, '')
    .replace(/\[\s*[^\]]*\s*\]/g, '')
    .trim();
}

// ── Build smart Ideogram prompt from CAMPAIGN INFO (not the script) ───────────
function buildImagePrompt(campaignName = '', campaignDesc = '', brand = null, format = '') {
  const brandName = brand?.brand_name || campaignName || '';
  const industry  = brand?.industry   || '';
  const tagline   = brand?.tagline    || '';
  const colors    = brand?.brand_colors || [];

  // Format-specific style
  const styleMap = {
    YOUTUBE_VIDEO_AD:   'YouTube thumbnail, bold dramatic lighting, high contrast, cinematic, 16:9',
    YOUTUBE_SHORTS:     'vertical social media cover, vibrant colors, eye-catching, 9:16',
    TIKTOK:             'vertical TikTok cover, Gen Z aesthetic, vibrant, dynamic, 9:16',
    INSTAGRAM_CAPTION:  'square Instagram post, lifestyle photography, warm natural light, 1:1',
    FACEBOOK_POST:      'Facebook social post, warm community feel, professional',
    LINKEDIN_POST:      'professional LinkedIn visual, corporate clean, authoritative',
    TWITTER_POST:       'social media graphic, minimal clean design, bold',
    BANNER_AD:          'wide horizontal banner ad, bold, clean minimal, 16:9',
    FLYER_TEXT:         'promotional flyer, vibrant colors, clear focal point',
    PRINT_AD:           'magazine print ad, editorial photography, luxury feel',
    EMAIL_MARKETING:    'email header graphic, professional clean, welcoming',
  };

  const style = styleMap[format] || 'professional marketing visual, clean modern design';

  // Extract key product descriptors from campaign description
  const descWords = (campaignDesc || '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 6)
    .join(', ');

  const parts = [
    style,
    brandName ? `brand: ${brandName}` : '',
    industry  ? `${industry} industry` : '',
    descWords ? descWords : '',
    tagline   ? `"${tagline}"` : '',
    colors.length ? `brand colors: ${colors.slice(0,2).join(' and ')}` : '',
    'photorealistic, high quality, commercial photography',
    'professional lighting, sharp focus, no watermarks',
  ].filter(Boolean);

  return parts.join(', ');
}

// ── Format → aspect ratio for Ideogram ───────────────────────────────────────
function getAspectRatio(format) {
  const map = {
    YOUTUBE_VIDEO_AD:  '16:9',
    YOUTUBE_SHORTS:    '9:16',
    TIKTOK:            '9:16',
    INSTAGRAM_CAPTION: '1:1',
    FACEBOOK_POST:     '4:5',
    LINKEDIN_POST:     '4:3',
    TWITTER_POST:      '16:9',
    BANNER_AD:         '16:9',
    FLYER_TEXT:        '3:4',
    PRINT_AD:          '3:4',
    EMAIL_MARKETING:   '16:9',
  };
  return map[format] || '1:1';
}

// ── Tool routing — per format ─────────────────────────────────────────────────
function getToolsForFormat(format) {
  const isVideoScript = VIDEO_FORMATS.includes(format) || format === 'TIKTOK';

  if (isVideoScript) {
    // Video scripts → HeyGen ONLY. Canva and image tools make no sense here.
    return [{
      id:       'heygen',
      label:    '🎬 HeyGen',
      url:      'https://app.heygen.com/create',
      color:    '#ef4444',
      bg:       'rgba(239,68,68,0.1)',
      border:   'rgba(239,68,68,0.2)',
      copyMode: 'script',
      tip:      'Paste your script to generate an AI avatar video — free tier available',
    }];
  }

  // Written copy formats → Canva (design) + Ideogram (AI photo)
  return [
    {
      id:       'canva',
      label:    '🎨 Canva',
      url:      'https://www.canva.com/create/',
      color:    '#7C3AED',
      bg:       'rgba(124,58,237,0.1)',
      border:   'rgba(124,58,237,0.25)',
      copyMode: 'copy',
      tip:      'Copy your content into a Canva template to design your visual',
    },
    {
      id:       'ideogram',
      label:    '🖼 AI Image',
      url:      'https://ideogram.ai/t/generate',
      color:    '#f59e0b',
      bg:       'rgba(245,158,11,0.1)',
      border:   'rgba(245,158,11,0.25)',
      copyMode: 'prompt',
      tip:      '10 free images/day · Paste prompt → select aspect ratio → generate',
    },
  ];
}

// ── Smart Redirect Tooltip ────────────────────────────────────────────────────
function RedirectTooltip({ tool, prompt, aspectRatio, onConfirm, onCancel }) {
  const isIdeogram = tool.id === 'ideogram';
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', top: '110%', left: 0, zIndex: 100,
        background: '#0c1220', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '16px', width: 300,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: tool.bg, border: `1px solid ${tool.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          {tool.label.split(' ')[0]}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>
            {tool.label.replace(/^[^\s]+\s/, '')} ready
          </div>
          <div style={{ fontSize: 10, color: '#334155' }}>{tool.tip}</div>
        </div>
      </div>

      {/* For Ideogram — show the generated prompt */}
      {isIdeogram && prompt && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
            ✓ Image prompt copied to clipboard
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#94a3b8', lineHeight: 1.5, maxHeight: 70, overflow: 'hidden' }}>
            {prompt.slice(0, 160)}{prompt.length > 160 ? '…' : ''}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#334155' }}>Recommended size:</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: tool.color, background: tool.bg, padding: '1px 7px', borderRadius: 20 }}>{aspectRatio}</span>
          </div>
        </div>
      )}

      {/* For non-Ideogram tools */}
      {!isIdeogram && (
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>
          ✓ Content copied to clipboard
        </div>
      )}

      {/* Instructions for Ideogram */}
      {isIdeogram && (
        <div style={{ fontSize: 10, color: '#334155', marginBottom: 10, lineHeight: 1.6, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 8, padding: '7px 10px' }}>
          1. Open Ideogram<br />
          2. Paste the prompt (Ctrl+V / Cmd+V)<br />
          3. Select <strong style={{ color: '#f59e0b' }}>{aspectRatio}</strong> aspect ratio<br />
          4. Click Generate
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 7 }}>
        <button onClick={onConfirm}
          style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${tool.color}, ${tool.color}bb)`, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Open {tool.label.replace(/^[^\s]+\s/, '')} →
        </button>
        <button onClick={onCancel}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#334155', fontSize: 11, cursor: 'pointer' }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  const colors = {
    success: 'bg-green-900/80 border-amber-500 text-amber-300',
    error:   'bg-red-900/80 border-red-500 text-red-300',
    info:    'bg-gray-900/80 border-emerald-500 text-emerald-300',
  };
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm shadow-2xl transition-all duration-300 ${colors[type] || colors.success}`}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// ─── Share Modal ──────────────────────────────────────────────────────────────
const ShareModal = ({ isOpen, onClose, onShare, isLoading, shareUrl }) => {
  const [expiry, setExpiry] = useState(7);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { if (!shareUrl) return; navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-md mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">🔗 Create Share Link</h2>
        <p className="text-sm text-gray-400 mb-6">Anyone with this link can view the content — no login required.</p>
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mb-5">
          <span className="flex-1 text-xs text-emerald-300 truncate font-mono">{shareUrl || 'Generate the link below to get your shareable URL...'}</span>
          {shareUrl && <button onClick={handleCopy} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-amber-500 text-gray-900' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{copied ? '✅ Copied!' : 'Copy'}</button>}
        </div>
        <p className="text-xs text-gray-400 mb-2">Link expires in:</p>
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ label: '24 hours', val: 1 }, { label: '7 days', val: 7 }, { label: '30 days', val: 30 }, { label: 'Never', val: null }].map(opt => (
            <button key={opt.label} onClick={() => setExpiry(opt.val)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${expiry === opt.val ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all">Cancel</button>
          <button onClick={() => onShare(expiry)} disabled={isLoading} className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-semibold">{isLoading ? 'Generating...' : shareUrl ? '🔄 Regenerate' : '🔗 Generate & Copy'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Visual Modal ─────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://edfdzytusmcjuwhjxtwn.supabase.co';

const VisualModal = ({ isOpen, onClose, imageUrl, isLoading, format, error, onGenerate, media }) => {
  const [selectedRefId, setSelectedRefId] = useState(null);
  const [step, setStep] = useState('pick');

  useEffect(() => { if (isOpen && !imageUrl) setStep('pick'); }, [isOpen]);
  useEffect(() => { if (imageUrl) setStep('result'); }, [imageUrl]);

  if (!isOpen) return null;

  const formatName = OUTPUT_FORMATS[format]?.name || format;
  const imageMedia = media?.filter(m => m.file_type?.startsWith('image/')) || [];
  const getMediaUrl = (fp) => `${SUPABASE_URL}/storage/v1/object/public/campaign-media/${fp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-base font-bold text-white">🎨 AI Generated Visual</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center justify-center text-sm transition-all">✕</button>
        </div>
        <div className="p-6">
          {step === 'pick' && !isLoading && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-white mb-1">Choose a reference image <span className="text-gray-400 font-normal">(optional)</span></p>
                <p className="text-xs text-gray-400">GPT-4o will analyze your photo and guide DALL-E to match your product's look</p>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                <div onClick={() => setSelectedRefId(null)} className={`aspect-square rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${selectedRefId === null ? 'border-emerald-400 bg-emerald-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}>
                  <span className="text-2xl">✨</span>
                  <span className="text-xs text-gray-400 text-center">AI only</span>
                </div>
                {imageMedia.map(item => (
                  <div key={item.id} onClick={() => setSelectedRefId(item.id)} className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative ${selectedRefId === item.id ? 'border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.03]' : 'border-gray-700 hover:border-gray-500'}`}>
                    <img src={getMediaUrl(item.file_path)} alt={item.file_name} className="w-full h-full object-cover" />
                    {selectedRefId === item.id && (
                      <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                        <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {imageMedia.length === 0 && (
                <div className="text-center py-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-xs text-gray-400">No images uploaded yet — upload product photos in the Media Gallery to use as reference</p>
                </div>
              )}
              {selectedRefId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <span className="text-amber-400 text-sm">📎</span>
                  <span className="text-xs text-amber-300">GPT-4o will describe this image first, then guide DALL-E</span>
                </div>
              )}
              <button onClick={() => { setStep('result'); onGenerate(selectedRefId); }} className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg text-sm">
                {selectedRefId ? '🎨 Generate with Reference' : '✨ Generate with AI Only'}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
                <div className="absolute inset-0 rounded-full border-4 border-t-amber-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{selectedRefId ? 'Analyzing reference → Generating...' : 'Generating your visual...'}</p>
                <p className="text-gray-400 text-sm mt-1">{selectedRefId ? 'GPT-4o Vision → DALL-E 3 pipeline' : 'DALL-E 3 is creating a unique image'}</p>
              </div>
            </div>
          )}
          {error && !isLoading && step === 'result' && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('pick')} className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all">← Change Reference</button>
                <button onClick={() => onGenerate(selectedRefId)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all">🔄 Try Again</button>
              </div>
            </div>
          )}
          {imageUrl && !isLoading && step === 'result' && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <img src={imageUrl} alt={`AI generated visual for ${formatName}`} className="w-full object-cover" />
              </div>
              {selectedRefId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-emerald-400 text-sm">✅</span>
                  <span className="text-xs text-emerald-300">Generated using your reference image</span>
                </div>
              )}
              <div className="flex gap-2">
                <a href={imageUrl} target="_blank" rel="noopener noreferrer" download className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">⬇️ Download</a>
                <button onClick={() => setStep('pick')} className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all">🔄 Regenerate</button>
              </div>
              <p className="text-xs text-gray-500 text-center">Generated by DALL-E 3 · For marketing use</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Saved Library ────────────────────────────────────────────────────────────
const SavedLibrary = ({ savedItems, onDelete, onShare }) => {
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const filtered = savedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'strategy') return item.content_type?.includes('strategy');
    if (filter === 'content') return item.content_type === 'content';
    return true;
  });
  if (savedItems.length === 0) return null;
  return (
    <>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">🗂️ Saved Library</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full">{savedItems.length} saved</span>
          </div>
          <div className="flex gap-1">
            {['all', 'strategy', 'content'].map(tab => (
              <button key={tab} onClick={() => setFilter(tab)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filter === tab ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-gray-200'}`}>{tab}</button>
            ))}
          </div>
        </div>
        {filtered.map(item => (
          <div key={item.id} onClick={() => setPreview(item)} className="px-6 py-4 border-b border-gray-800 last:border-0 flex items-start gap-3 hover:bg-gray-800/50 transition-all group cursor-pointer">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${item.content_type === 'content' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              {item.content_type === 'content' ? '🎨' : '📊'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{item.title}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="capitalize">{item.content_type?.replace('_', ' ')}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600 inline-block" />
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
              <button onClick={() => onShare({ title: item.title, content: item.content, savedId: item.id })} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center text-sm transition-all" title="Share">🔗</button>
              <button onClick={() => onDelete(item.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-sm transition-all" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setPreview(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">{preview.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{preview.content_type?.replace('_', ' ')} · Saved {new Date(preview.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => navigator.clipboard.writeText(preview.content)} className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all">📋 Copy</button>
                <button onClick={() => { onShare({ title: preview.title, content: preview.content, savedId: preview.id }); setPreview(null); }} className="px-3 py-1.5 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all">🔗 Share</button>
                <button onClick={() => setPreview(null)} className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center justify-center text-sm transition-all">✕</button>
              </div>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <div className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown>{preview.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Strategy Section ─────────────────────────────────────────────────────────
const StrategySection = ({ title, content, icon, defaultOpen, campaignName, onSave, onShare, savedKeys }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);
  const key = `strategy_${title}`;
  const isSaved = savedKeys.has(key);
  const handleSave = async (e) => { e.stopPropagation(); if (isSaved) return; setSaving(true); await onSave({ title: `${title} — ${campaignName}`, content, content_type: 'strategy_section', key }); setSaving(false); };
  const handleShare = (e) => { e.stopPropagation(); onShare({ title: `${title} — ${campaignName}`, content }); };
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-3 group">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 flex items-center justify-between hover:from-emerald-100 dark:hover:from-emerald-900/30 transition-all">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={handleSave} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${isSaved ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`} title={isSaved ? 'Saved!' : 'Save section'}>{saving ? '⏳' : isSaved ? '✅' : '🔖'}</button>
            <button onClick={handleShare} className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center text-xs transition-all" title="Share section">🔗</button>
          </div>
          <span className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-white dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Content Card ─────────────────────────────────────────────────────────────
const ContentCard = ({ item, isVisualFormat, defaultExpanded, campaignName, campaignId, onSave, onShare, savedKeys, media, onPostToSocial, showToast, brand, campaign }) => {
  const [activeTab, setActiveTab]   = useState('copy');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPrompt, setTooltipPrompt] = useState('');

  const formatName  = OUTPUT_FORMATS[item.format]?.name || item.format;
  const key         = `content_${item.format}`;
  const isSaved     = savedKeys.has(key);
  const tools       = getToolsForFormat(item.format);
  const aspectRatio = getAspectRatio(item.format);

  const parseVisualContent = (content) => {
    if (!content) return { copy: content, design: '' };
    const lower = content.toLowerCase();
    const markers = ['### design suggestions', '### design', '**design suggestions**', 'design suggestions:', 'design guidelines:'];
    let splitIndex = -1;
    for (const m of markers) { const idx = lower.indexOf(m); if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) splitIndex = idx; }
    if (splitIndex !== -1) return { copy: content.substring(0, splitIndex).trim(), design: content.substring(splitIndex).trim() };
    return { copy: content, design: '' };
  };

  const { copy, design } = isVisualFormat ? parseVisualContent(item.content) : { copy: item.content, design: '' };

  const handleCopy  = (text, e) => { e?.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSave  = async (e) => { e.stopPropagation(); if (isSaved) return; setSaving(true); await onSave({ title: `${formatName} — ${campaignName}`, content: item.content, content_type: 'content', format: item.format, key }); setSaving(false); };
  const handleShare = (e) => { e.stopPropagation(); onShare({ title: `${formatName} — ${campaignName}`, content: item.content }); };

  const handleToolClick = (e, tool) => {
    e.stopPropagation();
    let textToCopy = '';

    if (tool.copyMode === 'prompt') {
      // Image prompt — built from CAMPAIGN INFO, not the content script
      textToCopy = buildImagePrompt(
        campaignName,
        campaign?.description || '',
        brand,
        item.format
      );
      setTooltipPrompt(textToCopy);
    } else if (tool.copyMode === 'script') {
      // HeyGen — clean script, strip visual/audio directions
      textToCopy = item.content
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/>\s*/g, '')
        .replace(/---+/g, '')
        .trim();
      setTooltipPrompt('');
    } else {
      // Canva — clean copy only (no design guidelines section)
      textToCopy = cleanForCanva(item.content, item.format);
      setTooltipPrompt('');
    }

    navigator.clipboard.writeText(textToCopy).catch(() => {});
    setActiveTooltip(tool.id);
  };

  const handleToolConfirm = (tool) => {
    window.open(tool.url, '_blank');
    setActiveTooltip(null);
    const name = tool.label.replace(/^[^\s]+\s/, '');
    showToast(
      tool.id === 'ideogram'
        ? `🖼 Image prompt copied — paste in Ideogram, select ${aspectRatio}`
        : tool.id === 'heygen'
          ? `🎬 Script copied — paste it in HeyGen`
          : `✓ Content copied — paste it in ${name}`,
      'info'
    );
  };

  return (
    <>
      <div
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all group"
        onClick={() => activeTooltip && setActiveTooltip(null)}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/15 dark:to-teal-900/10 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
            {OUTPUT_FORMATS[item.format]?.platform || formatName}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all" style={{ position: 'relative' }}>

              {/* Smart redirect tool buttons */}
              {tools.map(tool => (
                <div key={tool.id} style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => handleToolClick(e, tool)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                    style={{ background: tool.bg, color: tool.color, border: `1px solid ${tool.border}` }}
                    title={tool.tip}
                  >
                    {tool.label}
                  </button>
                  {activeTooltip === tool.id && (
                    <RedirectTooltip
                      tool={tool}
                      prompt={tooltipPrompt}
                      aspectRatio={aspectRatio}
                      onConfirm={() => handleToolConfirm(tool)}
                      onCancel={() => setActiveTooltip(null)}
                    />
                  )}
                </div>
              ))}

              {/* Post to social */}
              {onPostToSocial && (
                <button onClick={(e) => { e.stopPropagation(); onPostToSocial(item.content); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                  style={{ background: 'rgba(0,0,0,0.15)', color: '#94a3b8' }}
                  title="Post to Twitter">
                  𝕏 Post
                </button>
              )}

              {/* Save */}
              <button onClick={handleSave}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${isSaved ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                title={isSaved ? 'Saved!' : 'Save'}>
                {saving ? '⏳' : isSaved ? '✅' : '🔖'}
              </button>

              {/* Share */}
              <button onClick={handleShare}
                className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center text-xs transition-all"
                title="Share">
                🔗
              </button>

              {/* Copy */}
              <button onClick={(e) => handleCopy(item.content, e)}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${copied ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Copy">
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>
        {isExpanded && (
          <>
            {isVisualFormat && design && (
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                <button onClick={() => setActiveTab('copy')} className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${activeTab === 'copy' ? 'text-emerald-600 dark:text-emerald-300 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>📝 Ad Copy</button>
                <button onClick={() => setActiveTab('design')} className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${activeTab === 'design' ? 'text-amber-600 dark:text-amber-300 border-b-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>🎨 Design Guidelines</button>
              </div>
            )}
            <div className="px-5 py-4">
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                <ReactMarkdown>{activeTab === 'design' && design ? design : copy}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── Parse Strategy ───────────────────────────────────────────────────────────
const parseStrategy = (strategy) => {
  if (!strategy) return [];
  const text = typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2);
  const patterns = [
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
  const found = [];
  patterns.forEach(({ pattern, title, icon }) => { const match = text.match(pattern); if (match) found.push({ title, icon, index: match.index, matchLength: match[0].length }); });
  found.sort((a, b) => a.index - b.index);
  const sections = [];
  found.forEach((s, i) => {
    const start = s.index + s.matchLength;
    const end = i < found.length - 1 ? found[i + 1].index : text.length;
    const content = text.substring(start, end).trim().replace(/^[:\s]+/, '');
    if (content.length > 10) sections.push({ title: s.title, icon: s.icon, content });
  });
  if (sections.length === 0) sections.push({ title: 'Marketing Strategy', icon: '📊', content: text });
  return sections;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign,            setCampaign]            = useState(null);
  const [generatedContent,    setGeneratedContent]    = useState([]);
  const [strategy,            setStrategy]            = useState(null);
  const [strategySections,    setStrategySections]    = useState([]);
  const [media,               setMedia]               = useState([]);
  const [savedItems,          setSavedItems]          = useState([]);
  const [savedKeys,           setSavedKeys]           = useState(new Set());
  const [loading,             setLoading]             = useState(true);
  const [generating,          setGenerating]          = useState(false);
  const [generatingStrategy,  setGeneratingStrategy]  = useState(false);
  const [error,               setError]               = useState('');
  const [selectedFormat,      setSelectedFormat]      = useState('all');
  const [expandAll,           setExpandAll]           = useState(false);
  const [shareModal,          setShareModal]          = useState({ open: false, title: '', content: '', savedId: null });
  const [shareUrl,            setShareUrl]            = useState('');
  const [sharing,             setSharing]             = useState(false);
  const [toast,               setToast]               = useState({ visible: false, message: '', type: 'success' });
  const [brand,               setBrand]               = useState(null);

  const { open: openPostModal, ModalSlot: PostModalSlot } = usePostToSocial();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }, []);

  // Fetch brand profile for smart image prompts
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    const apiBase = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
    fetch(`${apiBase}/brand/default`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { if (res.brand) setBrand(res.brand); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchCampaign(); fetchMedia(); fetchSaved(); }, [id]);
  useEffect(() => { if (strategy) setStrategySections(parseStrategy(strategy)); }, [strategy]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaignById(id);
      const raw = data.campaign;
      const safe = {
        id: String(raw.id || ''),
        name: String(raw.name || 'Untitled Campaign'),
        description: String(raw.product_description || raw.description || ''),
        target_audience: String(raw.target_audience || ''),
        ai_provider: String(raw.ai_provider || 'gemini'),
        output_formats: Array.isArray(raw.output_formats) ? raw.output_formats : [],
        status: String(raw.status || ''),
        created_at: raw.created_at,
        generated_content: Array.isArray(raw.generated_content) ? raw.generated_content : []
      };
      setCampaign(safe);
      setGeneratedContent(safe.generated_content);
    } catch { setError('Failed to load campaign'); }
    finally { setLoading(false); }
  };

  const fetchMedia   = async () => { try { const data = await getCampaignMedia(id); setMedia(data.media || []); } catch {} };
  const fetchSaved   = async () => {
    try {
      const data = await getSavedContent({ campaign_id: id });
      const items = data.saved_content || [];
      setSavedItems(items);
      const keys = new Set(items.map(i => i.content_type === 'content' ? `content_${i.format}` : `strategy_${i.title?.split(' — ')[0]}`));
      setSavedKeys(keys);
    } catch {}
  };

  const handleSave = useCallback(async ({ title, content, content_type, format, key }) => {
    try {
      const data = await saveContent({ campaign_id: id, title, content, content_type, format });
      setSavedItems(prev => [data.saved, ...prev]);
      setSavedKeys(prev => new Set([...prev, key]));
      showToast(`🔖 "${title}" saved!`);
    } catch { showToast('Failed to save content', 'error'); }
  }, [id, showToast]);

  const handleDeleteSaved = async (savedId) => {
    try { await deleteSavedContent(savedId); setSavedItems(prev => prev.filter(s => s.id !== savedId)); showToast('Removed from library'); }
    catch { showToast('Failed to delete', 'error'); }
  };

  const openShareModal = ({ title, content, savedId = null }) => { setShareUrl(''); setShareModal({ open: true, title, content, savedId }); };

  const handleCreateShare = async (expiryDays) => {
    setSharing(true);
    try {
      const data = await createShareLink({ saved_content_id: shareModal.savedId, title: shareModal.title, content: shareModal.content, expires_in_days: expiryDays });
      const url = `${FRONTEND_URL}/shared/${data.share_token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      showToast('🔗 Share link copied to clipboard!', 'info');
    } catch { showToast('Failed to create share link', 'error'); }
    finally { setSharing(false); }
  };

  const handleSaveAll = async () => {
    let count = 0;
    if (strategy) { await handleSave({ title: `Full Strategy — ${campaign?.name}`, content: typeof strategy === 'string' ? strategy : JSON.stringify(strategy), content_type: 'strategy', key: 'strategy_full' }); count++; }
    for (const item of generatedContent) { const name = OUTPUT_FORMATS[item.format]?.name || item.format; await handleSave({ title: `${name} — ${campaign?.name}`, content: item.content, content_type: 'content', format: item.format, key: `content_${item.format}` }); count++; }
    showToast(`🔖 ${count} items saved to library!`);
  };

  const handleGenerateStrategy = async () => {
    try { setGeneratingStrategy(true); setError(''); const data = await generateStrategy(id); setStrategy(data.strategy); }
    catch (err) { setError(err.response?.data?.error || 'Failed to generate strategy'); }
    finally { setGeneratingStrategy(false); }
  };

  const handleGenerate = async () => {
    try { setGenerating(true); setError(''); const data = await generateIdeas(id); setGeneratedContent(data.generatedContent || []); }
    catch (err) { setError(err.response?.data?.error || 'Failed to generate content'); }
    finally { setGenerating(false); }
  };

  const filteredContent = selectedFormat === 'all' ? generatedContent : generatedContent.filter(i => i.format === selectedFormat);
  const groupedContent  = filteredContent.reduce((acc, item) => { if (!acc[item.format]) acc[item.format] = []; acc[item.format].push(item); return acc; }, {});

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" /><p className="mt-4 text-gray-500 dark:text-gray-400">Loading campaign...</p></div></div>;
  if (!campaign) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Campaign not found</h2><button onClick={() => navigate('/dashboard')} className="text-emerald-500 hover:text-emerald-400">← Back to Dashboard</button></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">

        <button onClick={() => navigate('/dashboard')} className="text-emerald-500 hover:text-emerald-400 font-medium mb-6 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Campaign Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{campaign.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => navigator.clipboard.writeText(typeof strategy === 'string' ? strategy : '')} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">📋 Copy All</button>
              <button onClick={handleSaveAll} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">🔖 Save All</button>
              <button onClick={() => (strategy || generatedContent.length > 0) && openShareModal({ title: `${campaign.name} — Campaign`, content: typeof strategy === 'string' ? strategy : '' })} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all">🔗 Share</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div><span className="text-xs text-gray-400">Target Audience</span><p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{campaign.target_audience}</p></div>
            <div><span className="text-xs text-gray-400">AI Provider</span><p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{campaign.ai_provider === 'claude' ? '🤖 Claude' : campaign.ai_provider === 'openai' ? '🧠 OpenAI' : '💎 Gemini'}</p></div>
            <div><span className="text-xs text-gray-400">Output Formats</span><p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{campaign.output_formats?.length || 0} formats selected</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {campaign.output_formats?.map(f => <span key={f} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">{OUTPUT_FORMATS[f]?.name || f}</span>)}
          </div>
        </div>

        <div className="mb-6"><MediaUpload campaignId={id} media={media} onUploadSuccess={fetchMedia} onSelectForVisual={() => {}} selectedMediaId={null} /></div>

        {/* Generate buttons */}
        {generatedContent.length === 0 && !strategy && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center mb-6">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to create your campaign?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Start by generating a marketing strategy, then create content for all formats</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleGenerateStrategy} disabled={generatingStrategy} className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg text-sm">{generatingStrategy ? '⏳ Generating Strategy...' : '📊 Generate Marketing Strategy'}</button>
              <button onClick={handleGenerate} disabled={generating} className="px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 transition-all shadow-lg text-sm">{generating ? '⏳ Generating Content...' : '🚀 Generate Content'}</button>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

        {/* Strategy */}
        {strategy && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Marketing Strategy</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => navigator.clipboard.writeText(typeof strategy === 'string' ? strategy : '')} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">📋 Copy All</button>
                <button onClick={handleGenerateStrategy} disabled={generatingStrategy} className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all">{generatingStrategy ? 'Regenerating...' : '🔄 Regenerate'}</button>
              </div>
            </div>
            <div className="space-y-2">
              {strategySections.map((section, i) => <StrategySection key={i} title={section.title} content={section.content} icon={section.icon} defaultOpen={i === 0} campaignName={campaign.name} onSave={handleSave} onShare={openShareModal} savedKeys={savedKeys} />)}
            </div>
            {generatedContent.length === 0 && (
              <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Ready to create content based on this strategy?</p>
                <button onClick={handleGenerate} disabled={generating} className="px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-lg text-sm">{generating ? 'Generating...' : '🚀 Generate Content Now'}</button>
              </div>
            )}
          </div>
        )}

        {/* Generated Content */}
        {generatedContent.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎨 Generated Content</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Hover any card — 🎨 <span className="text-purple-400 font-medium">Canva</span>, 🖼 <span className="text-amber-400 font-medium">AI Image</span>, 🎬 <span className="text-red-400 font-medium">HeyGen</span> for video formats
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setExpandAll(!expandAll)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{expandAll ? '📖 Collapse All' : '📖 Expand All'}</button>
                <button onClick={handleGenerate} disabled={generating} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all">{generating ? 'Regenerating...' : '🔄 Regenerate All'}</button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
              <button onClick={() => setSelectedFormat('all')} className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedFormat === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>All ({generatedContent.length})</button>
              {campaign.output_formats?.map(format => { const count = generatedContent.filter(i => i.format === format).length; if (!count) return null; return <button key={format} onClick={() => setSelectedFormat(format)} className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedFormat === format ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{OUTPUT_FORMATS[format]?.name || format} ({count})</button>; })}
            </div>

            {Object.entries(groupedContent).map(([format, items]) => (
              <div key={format} className="mb-7">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  {OUTPUT_FORMATS[format]?.name || format}
                  {VIDEO_FORMATS.includes(format) && <span className="text-xs font-normal text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">🎬 HeyGen ready</span>}
                  <span className="text-xs text-gray-400 font-normal">({items.length} {items.length === 1 ? 'variation' : 'variations'})</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {items.map((item, idx) => (
                    <ContentCard key={idx} item={item} isVisualFormat={VISUAL_FORMATS.includes(format)} defaultExpanded={expandAll} campaignName={campaign.name} campaignId={id} onSave={handleSave} onShare={openShareModal} savedKeys={savedKeys} media={media} showToast={showToast} brand={brand} campaign={campaign} onPostToSocial={(text) => openPostModal({ platform: 'twitter', text, campaignId: id })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <SavedLibrary savedItems={savedItems} onDelete={handleDeleteSaved} onShare={openShareModal} />
      </div>

      {PostModalSlot}
      <ShareModal isOpen={shareModal.open} onClose={() => setShareModal(s => ({ ...s, open: false }))} onShare={handleCreateShare} isLoading={sharing} shareUrl={shareUrl} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
};

export default CampaignDetail;