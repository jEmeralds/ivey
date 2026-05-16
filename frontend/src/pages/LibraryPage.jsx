// frontend/src/pages/LibraryPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Library — two tabs:
// Content: user's HeyGen videos with public gallery toggle (admin approval)
// Archive: raw assets from campaigns and brands (images, videos — always private)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
const token   = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });
const jsonHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

// ── Gallery status badge ───────────────────────────────────────────────────────
const GalleryBadge = ({ status }) => {
  const map = {
    private:  { label: 'Private',  cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
    pending:  { label: 'Pending',  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    approved: { label: 'Public',   cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  };
  const { label, cls } = map[status] || map.private;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
};

// ── Content tab — videos with gallery toggle ───────────────────────────────────
const ContentTab = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [msg,     setMsg]     = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/library?type=video`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
    } catch {} finally { setLoading(false); }
  };

  const handleToggle = async (item, show) => {
    setToggling(item.id);
    setMsg('');
    try {
      const res  = await fetch(`${API_URL}/library/${item.id}/gallery-toggle`, {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ show }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(data.message);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data.item } : i));
    } catch (err) {
      setMsg(`⚠️ ${err.message}`);
    } finally {
      setToggling(null);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video from your library?')) return;
    await fetch(`${API_URL}/library/${id}`, { method: 'DELETE', headers: authHeaders() });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/></div>;

  if (items.length === 0) return (
    <div className="text-center py-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
      <div className="text-5xl mb-4">🎬</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No videos yet</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">Videos generated with HeyGen from Studio will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('⚠️') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
          {msg}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Toggle <strong>Show in public gallery</strong> to request admin approval. Turning it off removes it from the public gallery instantly.
      </p>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-start gap-4">

              {/* Thumbnail */}
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-20 h-14 object-cover rounded-xl flex-shrink-0"/>
              ) : (
                <div className="w-20 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <GalleryBadge status={item.gallery_status || 'private'}/>
                </div>

                {/* Video link */}
                {item.video_url && (
                  <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    View video
                  </a>
                )}

                {/* Gallery toggle + delete */}
                <div className="flex items-center gap-3 mt-3">
                  {/* Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Show in public gallery</span>
                    <button
                      disabled={toggling === item.id || item.gallery_status === 'pending'}
                      onClick={() => handleToggle(item, !(item.show_in_gallery && item.gallery_status === 'approved'))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                        item.show_in_gallery && item.gallery_status === 'approved'
                          ? 'bg-emerald-500'
                          : item.gallery_status === 'pending'
                            ? 'bg-amber-400'
                            : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        item.show_in_gallery && item.gallery_status !== 'private' ? 'translate-x-5' : 'translate-x-1'
                      }`}/>
                    </button>
                    {toggling === item.id && <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>}
                  </div>

                  <button onClick={() => handleDelete(item.id)} className="ml-auto text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>

                {item.gallery_status === 'pending' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">⏳ Waiting for admin approval</p>
                )}
                {item.gallery_status === 'rejected' && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">❌ Not approved — you can edit and resubmit</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Archive tab — raw assets ──────────────────────────────────────────────────
const ArchiveTab = () => {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all'); // all | campaign | brand | upload
  const [typeFilter, setTypeFilter] = useState('all'); // all | image | video | document
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/library/archive`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this asset from your archive?')) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/library/archive/${id}`, { method: 'DELETE', headers: authHeaders() });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally { setDeleting(null); }
  };

  const filtered = items.filter(i => {
    const srcMatch  = filter === 'all'     || i.source === filter;
    const typeMatch = typeFilter === 'all' || i.type === typeFilter;
    return srcMatch && typeMatch;
  });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sourceLabel = { campaign: '📋 Campaign', brand: '🎨 Brand', upload: '📤 Upload' };
  const typeIcon    = { image: '🖼️', video: '🎬', document: '📄' };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Raw materials from your campaigns and brand profiles. Always private — never shown publicly. Accessible from campaign and brand creation forms.
      </p>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['all', 'campaign', 'brand', 'upload'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${filter === s ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {s === 'all' ? 'All sources' : sourceLabel[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['all', 'image', 'video', 'document'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${typeFilter === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {t === 'all' ? 'All types' : `${typeIcon[t]} ${t}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="text-5xl mb-4">🗂️</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No assets yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">Images and files you upload during campaign or brand creation will be saved here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">

              {/* Preview */}
              {item.type === 'image' ? (
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/>
                </div>
              ) : item.type === 'video' ? (
                <div className="aspect-square bg-gray-900 flex items-center justify-center">
                  <video src={item.url} className="w-full h-full object-cover" muted/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">📄</span>
                </div>
              )}

              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{sourceLabel[item.source] || item.source}</span>
                  {item.size_bytes && <span className="text-xs text-gray-400">{formatSize(item.size_bytes)}</span>}
                </div>
              </div>

              {/* Actions overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 bg-white/90 dark:bg-gray-900/90 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                  className="w-7 h-7 bg-red-50 dark:bg-red-900/50 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              {/* Source tag */}
              <div className="absolute top-2 left-2">
                <span className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-md">{typeIcon[item.type]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main LibraryPage ──────────────────────────────────────────────────────────
const LibraryPage = () => {
  const [tab, setTab] = useState('content');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Library</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your videos and raw assets in one place</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('content')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'content' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          🎬 Content
        </button>
        <button onClick={() => setTab('archive')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'archive' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          🗂️ Archive
        </button>
      </div>

      {/* Tab content */}
      {tab === 'content' && <ContentTab/>}
      {tab === 'archive' && <ArchiveTab/>}
    </div>
  );
};

export default LibraryPage;