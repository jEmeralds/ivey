import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams }       from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const CATEGORIES = [
  'Physical Product', 'Digital Product', 'Software / SaaS', 'Food & Beverage',
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Health & Wellness', 'Service',
  'Course / Education', 'Event / Experience', 'Other',
];

const EMPTY_PRODUCT = {
  product_name: '', tagline: '', description: '', category: '',
  price: '', features: ['', '', ''], how_to_use: '', demo_notes: '',
  images: [], video_urls: [], order_link: '', is_active: true,
};

const token = () => localStorage.getItem('token');

// ── API helpers ───────────────────────────────────────────────────────────────
const api = {
  getProducts: async (brandId) => {
    const r = await fetch(`${API_URL}/products?brand_id=${brandId}`, { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  getBrand: async (brandId) => {
    const r = await fetch(`${API_URL}/brand/${brandId}`, { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  createProduct: async (data) => {
    const r = await fetch(`${API_URL}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  updateProduct: async (id, data) => {
    const r = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  deleteProduct: async (id) => {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
  },
  uploadImage: async (productId, base64, mimeType, caption, isHero) => {
    const r = await fetch(`${API_URL}/products/${productId}/upload-image`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ image_base64: base64, mime_type: mimeType, caption, is_hero: isHero }),
    });
    return r.json();
  },
  deleteImage: async (productId, imageUrl) => {
    await fetch(`${API_URL}/products/${productId}/image`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ image_url: imageUrl }),
    });
  },
};

// ── Image uploader component ──────────────────────────────────────────────────
const ImageUploader = ({ productId, images, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const res = await api.uploadImage(productId, base64, file.type, '', images.length === 0);
        if (res.product) onUpdate(res.product.images);
      };
      reader.readAsDataURL(file);
    } finally { setUploading(false); fileRef.current.value = ''; }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative group w-24 h-24">
            <img src={img.url} alt={img.caption || `Image ${i+1}`}
              className="w-full h-full object-cover rounded-xl border border-gray-700"/>
            {img.is_hero && (
              <span className="absolute top-1 left-1 text-xs bg-amber-500 text-gray-900 px-1.5 py-0.5 rounded font-bold">Hero</span>
            )}
            <button onClick={async () => {
              await api.deleteImage(productId, img.url);
              onUpdate(images.filter((_, idx) => idx !== i));
            }} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">✕</button>
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-gray-600 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-gray-500 hover:text-emerald-400 disabled:opacity-50">
          {uploading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
              <span className="text-xs">Add image</span>
            </>
          )}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
      <p className="text-xs text-gray-600">First image is the hero image. Max 5 images. JPG, PNG, WebP.</p>
    </div>
  );
};

// ── Product Form ──────────────────────────────────────────────────────────────
const ProductForm = ({ product, brandId, onSave, onCancel }) => {
  const isEdit = !!product?.id;
  const [form,    setForm]    = useState(product || { ...EMPTY_PRODUCT });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [savedId, setSavedId] = useState(product?.id || null);
  // Sync images from product prop
  useEffect(() => { if (product?.images) set('images', product.images); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setFeature = (i, v) => {
    const f = [...(form.features || ['','',''])];
    f[i] = v;
    set('features', f);
  };

  const handleSave = async () => {
    if (!form.product_name?.trim()) { setError('Product name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        brand_profile_id: brandId,
        features: (form.features || []).filter(f => f.trim()),
      };
      let res;
      const existingId = savedId || product?.id;
      if (existingId) {
        res = await api.updateProduct(existingId, payload);
      } else {
        res = await api.createProduct(payload);
        if (res.product?.id) setSavedId(res.product.id);
      }
      if (res.error) { setError(res.error); return; }
      onSave(res.product);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp   = 'w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all';
  const lbl   = 'block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest';
  const hint  = 'text-xs text-gray-600 mt-1';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">📦</div>
        <div>
          <h3 className="font-bold text-white text-sm">{isEdit ? 'Edit Product' : 'New Product'}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Fill in the details — IVey uses these to write product-specific ad scripts</p>
        </div>
      </div>

      {/* Name + category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Product Name *</label>
          <input type="text" value={form.product_name} onChange={e => set('product_name', e.target.value)}
            placeholder="e.g. Safari Starter Kit" className={inp}/>
        </div>
        <div>
          <label className={lbl}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inp}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tagline + price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Tagline</label>
          <input type="text" value={form.tagline} onChange={e => set('tagline', e.target.value)}
            placeholder="e.g. Adventure in a box" className={inp}/>
        </div>
        <div>
          <label className={lbl}>Price</label>
          <input type="text" value={form.price} onChange={e => set('price', e.target.value)}
            placeholder="e.g. KES 3,500 or $29/mo" className={inp}/>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>Product Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} placeholder="Describe what this product is, what it does, and why it's special..."
          className={`${inp} resize-none leading-relaxed`}/>
      </div>

      {/* Features */}
      <div>
        <label className={lbl}>Key Features <span className="font-normal normal-case text-gray-500">(up to 5)</span></label>
        <div className="space-y-2">
          {[0,1,2,3,4].map(i => (
            <input key={i} type="text"
              value={(form.features || [])[i] || ''}
              onChange={e => setFeature(i, e.target.value)}
              placeholder={`Feature ${i+1} — e.g. Waterproof up to 30m`}
              className={inp}/>
          ))}
        </div>
        <p className={hint}>Each feature becomes a scene in the product ad script</p>
      </div>

      {/* How to use */}
      <div>
        <label className={lbl}>How It's Used / Demo Notes</label>
        <textarea value={form.how_to_use} onChange={e => set('how_to_use', e.target.value)}
          rows={3} placeholder="Describe how the product is used, step by step. This becomes the demonstration section of the ad..."
          className={`${inp} resize-none leading-relaxed`}/>
      </div>

      {/* Visual/demo notes for HeyGen */}
      <div>
        <label className={lbl}>Visual Production Notes <span className="font-normal normal-case text-gray-500">(for HeyGen)</span></label>
        <textarea value={form.demo_notes} onChange={e => set('demo_notes', e.target.value)}
          rows={2} placeholder="e.g. Product should be shown in natural lighting, hands holding it, close-up of texture..."
          className={`${inp} resize-none leading-relaxed`}/>
        <p className={hint}>IVey injects these into the script visual notes so HeyGen knows exactly how to shoot the product</p>
      </div>

      {/* Order link */}
      <div>
        <label className={lbl}>Order / Buy Link</label>
        <input type="url" value={form.order_link} onChange={e => set('order_link', e.target.value)}
          placeholder="https://shop.example.com/product or WhatsApp link or DM instructions"
          className={inp}/>
      </div>

      {/* Product images */}
      <div>
        <label className={lbl}>Product Images</label>
        {savedId ? (
          <ImageUploader
            productId={savedId}
            images={form.images || []}
            onUpdate={imgs => set('images', imgs)}
          />
        ) : (
          <div className="p-4 bg-gray-700/50 rounded-xl border border-dashed border-gray-600 text-center">
            <p className="text-xs text-gray-500 mb-2">Save the product first, then add images</p>
            <button onClick={async () => {
              if (!form.product_name?.trim()) { setError('Enter a product name first'); return; }
              setSaving(true); setError('');
              try {
                const payload = { ...form, brand_profile_id: brandId, features: (form.features || []).filter(f => f.trim()) };
                const res = isEdit ? await api.updateProduct(product.id, payload) : await api.createProduct(payload);
                if (res.error) { setError(res.error); return; }
                setSavedId(res.product.id);
                setForm(prev => ({ ...prev, images: res.product.images || [] }));
              } finally { setSaving(false); }
            }} disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save & Add Images'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-xs">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-600 transition-all">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-800 disabled:opacity-50 transition-all shadow-lg">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </div>
  );
};

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onEdit, onDelete }) => {
  const heroImage = product.images?.find(i => i.is_hero) || product.images?.[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all">
      {heroImage ? (
        <div className="h-40 overflow-hidden">
          <img src={heroImage.url} alt={product.product_name}
            className="w-full h-full object-cover"/>
        </div>
      ) : (
        <div className="h-40 bg-gray-700/50 flex items-center justify-center">
          <span className="text-4xl">📦</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-white text-sm">{product.product_name}</h3>
            {product.tagline && <p className="text-xs text-gray-400 mt-0.5 italic">"{product.tagline}"</p>}
          </div>
          {product.price && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex-shrink-0">
              {product.price}
            </span>
          )}
        </div>
        {product.category && (
          <span className="inline-block text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full mb-2">{product.category}</span>
        )}
        {product.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{product.description}</p>
        )}
        {product.features?.filter(f=>f).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.features.filter(f=>f).slice(0,3).map((f,i) => (
              <span key={i} className="text-xs text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded">✓ {f}</span>
            ))}
            {product.features.filter(f=>f).length > 3 && (
              <span className="text-xs text-gray-500">+{product.features.filter(f=>f).length - 3} more</span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onEdit(product)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs font-semibold transition-all">
            Edit
          </button>
          <button onClick={() => onDelete(product.id)}
            className="px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-xl text-xs transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ── ProductsPage ──────────────────────────────────────────────────────────────
const ProductsPage = ({ brandId: propBrandId, embedded = false, onBack }) => {
  const { brandId: paramBrandId } = useParams();
  const brandId  = propBrandId || paramBrandId;
  const navigate = useNavigate();

  const [brand,     setBrand]     = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => { if (brandId) load(); }, [brandId]);

  const load = async () => {
    setLoading(true);
    try {
      const [brandRes, prodRes] = await Promise.all([
        api.getBrand(brandId),
        api.getProducts(brandId),
      ]);
      if (brandRes.brand) setBrand(brandRes.brand);
      setProducts(prodRes.products || []);
    } finally { setLoading(false); }
  };

  const handleSave = (product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      return idx >= 0 ? prev.map(p => p.id === product.id ? product : p) : [product, ...prev];
    });
    setShowForm(false); setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"/>
        <p className="text-xs text-gray-500">Loading products...</p>
      </div>
    </div>
  );

  if (showForm || editing) return (
    <div className={embedded ? '' : 'max-w-2xl mx-auto py-8 px-4'}>
      {!embedded && (
        <button onClick={() => { setShowForm(false); setEditing(null); }}
          className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-6 hover:text-emerald-300 transition-colors">
          ← Back to Products
        </button>
      )}
      <ProductForm
        product={editing}
        brandId={brandId}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    </div>
  );

  return (
    <div className={embedded ? '' : 'max-w-4xl mx-auto py-8 px-4'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {!embedded && brand && (
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium mb-3 hover:text-emerald-300 transition-colors">
              ← {brand.brand_name}
            </button>
          )}
          <h1 className="text-xl font-black text-white">
            {brand ? `${brand.brand_name} — Products` : 'Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length === 0 ? 'No products yet' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-800 transition-all shadow-lg">
          + New Product
        </button>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 border border-gray-700 rounded-2xl">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-bold text-white mb-2">No products yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Add your products here. IVey uses product details, features, and images to write product-specific ad scripts.
          </p>
          <button onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg">
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={(p) => { setEditing(p); setShowForm(false); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;