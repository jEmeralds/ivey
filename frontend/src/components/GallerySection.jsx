// frontend/src/components/GallerySection.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', label: 'YouTube',   icon: '▶', bg: '#1a0000' },
  tiktok:    { color: '#69C9D0', label: 'TikTok',    icon: '♫', bg: '#010101' },
  instagram: { color: '#E1306C', label: 'Instagram', icon: '◈', bg: '#1a0010' },
  facebook:  { color: '#1877F2', label: 'Facebook',  icon: 'f', bg: '#000d1a' },
  link:      { color: '#94a3b8', label: 'Link',       icon: '⬡', bg: '#0f172a' },
};

function getEmbedUrl(item) {
  const { platform, embed_id, url } = item;
  if (platform === 'youtube'   && embed_id) return `https://www.youtube.com/embed/${embed_id}?autoplay=1&rel=0&modestbranding=1`;
  if (platform === 'tiktok'    && embed_id) return `https://www.tiktok.com/embed/v2/${embed_id}`;
  if (platform === 'instagram' && embed_id) return `https://www.instagram.com/p/${embed_id}/embed/`;
  if (platform === 'facebook')              return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  return null;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ item, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const meta     = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);
  const thumb    = item.platform === 'youtube' && item.embed_id
    ? `https://img.youtube.com/vi/${item.embed_id}/hqdefault.jpg`
    : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft'  && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl animate-in">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {/* Platform badge */}
        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-xs font-black text-white shadow-lg" style={{background: meta.color}}>
          {meta.label.toUpperCase()}
        </div>

        {/* Prev / Next arrows */}
        {hasPrev && (
          <button onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-white transition-all">
            ‹
          </button>
        )}
        {hasNext && (
          <button onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-white transition-all">
            ›
          </button>
        )}

        {/* Media */}
        <div className="relative w-full" style={{paddingTop: '56.25%', background: meta.bg}}>
          {embedUrl ? (
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full border-none"
              allow="autoplay; fullscreen; encrypted-media" allowFullScreen/>
          ) : thumb ? (
            <img src={thumb} alt={item.caption} className="absolute inset-0 w-full h-full object-cover"/>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="text-6xl" style={{color: meta.color}}>{meta.icon}</div>
              <a href={item.url} target="_blank" rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-all">
                Open Link ↗
              </a>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-white font-semibold text-sm mb-2 leading-relaxed">{item.caption}</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-500 font-medium">{item.brand_name}</span>
            <div className="flex items-center gap-3">
              {item.views !== '—' && <span className="text-xs text-gray-500">👁 {item.views}</span>}
              {item.likes !== '—' && <span className="text-xs text-gray-500">♥ {item.likes}</span>}
              {item.format && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  ⚡ {item.format}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600">
        ← → to navigate · Esc to close
      </p>
    </div>
  );
};

// ─── Single media card ────────────────────────────────────────────────────────
const MediaCard = ({ item, onClick }) => {
  const meta  = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const thumb = item.platform === 'youtube' && item.embed_id
    ? `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`
    : null;

  return (
    <div
      onClick={onClick}
      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{background: meta.bg || '#0f172a'}}
    >
      {/* Thumbnail or platform placeholder */}
      {thumb ? (
        <img
          src={thumb}
          alt={item.caption}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{background: (meta.color || '#94a3b8') + '12'}}>
          <div className="text-3xl" style={{color: meta.color}}>{meta.icon}</div>
          <div className="text-xs font-bold" style={{color: meta.color}}>{meta.label}</div>
        </div>
      )}

      {/* Platform badge */}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 rounded text-white font-black leading-none shadow-lg"
        style={{background: meta.color, fontSize: '9px', letterSpacing: '0.05em'}}
      >
        {meta.label.toUpperCase()}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 px-3">
        <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <p className="text-white text-xs font-semibold text-center leading-tight line-clamp-2 px-2">{item.caption}</p>
        {item.brand_name && (
          <p className="text-white/60 text-xs">{item.brand_name}</p>
        )}
      </div>

      {/* Bottom info bar */}
      {item.format && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-end">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
            ⚡ {item.format}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse border border-gray-300 dark:border-gray-700"/>
);

// ─── Main GallerySection ──────────────────────────────────────────────────────
export default function GallerySection({ embedded = false }) {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [expanded,    setExpanded]    = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/gallery`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  const platforms = [...new Set(items.map(i => i.platform))];
  const filtered  = filter === 'all' ? items : items.filter(i => i.platform === filter);

  // How many to show — 6 collapsed, all expanded
  const INITIAL_COUNT = 6;
  const displayed = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore   = filtered.length > INITIAL_COUNT;

  const openLightbox = (item) => {
    const idx = filtered.findIndex(i => i.id === item.id);
    setLightboxIdx(idx);
  };

  return (
    <section className={embedded ? 'py-16 px-4' : 'min-h-screen bg-white dark:bg-gray-900 py-20 px-4'}>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <Lightbox
          item={filtered[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIdx(i => Math.min(filtered.length - 1, i + 1))}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < filtered.length - 1}
        />
      )}

      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className={`${embedded ? 'text-center mb-10' : 'mb-10'}`}>
          {embedded && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-4 uppercase tracking-widest">
              🏆 Community Gallery
            </div>
          )}
          <div className={`flex ${embedded ? 'flex-col items-center gap-4' : 'items-start justify-between gap-4 flex-wrap'}`}>
            <div className={embedded ? 'text-center' : ''}>
              {!embedded && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-4 uppercase tracking-widest">
                  🏆 Community Gallery
                </div>
              )}
              <h2 className={`font-black text-gray-900 dark:text-white leading-tight ${embedded ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}`}>
                Real content.{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Real results.
                </span>
              </h2>
              <p className="text-gray-500 dark:text-gray-500 mt-2 text-sm leading-relaxed max-w-lg">
                Generated with IVey and posted by real users. Browse, get inspired, and submit your own.
              </p>
            </div>
            {!embedded && (
              <Link to="/dashboard"
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
                📤 Submit Your Campaign
              </Link>
            )}
          </div>

          {/* Platform filters */}
          {!loading && platforms.length > 0 && (
            <div className={`flex gap-2 flex-wrap mt-5 ${embedded ? 'justify-center' : ''}`}>
              {['all', ...platforms].map(p => {
                const meta  = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
                const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
                const active = filter === p;
                return (
                  <button
                    key={p}
                    onClick={() => { setFilter(p); setExpanded(false); }}
                    className="text-xs px-4 py-1.5 rounded-full border font-semibold transition-all hover:scale-105"
                    style={{
                      borderColor: active ? meta.color + '80' : 'rgba(255,255,255,0.1)',
                      background:  active ? meta.color + '18' : 'transparent',
                      color:       active ? meta.color : '#6b7280',
                    }}
                  >
                    {meta?.label || p} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-500 text-sm">No content yet for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {displayed.map(item => (
              <MediaCard key={item.id} item={item} onClick={() => openLightbox(item)}/>
            ))}
          </div>
        )}

        {/* ── Expand / Collapse ── */}
        {!loading && hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setExpanded(e => !e)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              {expanded ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>Show Less</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>View All {filtered.length} Campaigns</>
              )}
            </button>
          </div>
        )}

        {/* ── Submit CTA (embedded mode) ── */}
        {embedded && !loading && (
          <div className="text-center mt-8">
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
              📤 Submit Your Campaign
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}