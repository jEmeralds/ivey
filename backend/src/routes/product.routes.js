import express        from 'express';
import { auth }       from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();
router.use(auth);

// ── GET /api/products?brand_id=xxx — all products for a brand ─────────────────
router.get('/', async (req, res) => {
  try {
    const { brand_id } = req.query;
    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (brand_id) query = query.eq('brand_profile_id', brand_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ products: data || [] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/products — create product ──────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      brand_profile_id, product_name, tagline, description,
      category, price, features, how_to_use, demo_notes,
      images, video_urls, order_link, is_active,
    } = req.body;

    if (!brand_profile_id) return res.status(400).json({ error: 'brand_profile_id is required' });
    if (!product_name?.trim()) return res.status(400).json({ error: 'Product name is required' });

    // Verify brand belongs to user
    const { data: brand } = await supabaseAdmin
      .from('brand_profiles').select('id')
      .eq('id', brand_profile_id).eq('user_id', req.userId).single();
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        user_id:          req.userId,
        brand_profile_id,
        product_name:     product_name.trim(),
        tagline:          tagline?.trim()     || null,
        description:      description?.trim() || null,
        category:         category            || null,
        price:            price?.trim()       || null,
        features:         features            || [],
        how_to_use:       how_to_use?.trim()  || null,
        demo_notes:       demo_notes?.trim()  || null,
        images:           images              || [],
        video_urls:       video_urls          || [],
        order_link:       order_link?.trim()  || null,
        is_active:        is_active           ?? true,
        updated_at:       new Date().toISOString(),
      }])
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ product: data, message: 'Product created' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── PUT /api/products/:id — update product ────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name, tagline, description, category, price,
      features, how_to_use, demo_notes, images, video_urls,
      order_link, is_active,
    } = req.body;

    if (!product_name?.trim()) return res.status(400).json({ error: 'Product name is required' });

    const { data: existing } = await supabaseAdmin
      .from('products').select('id')
      .eq('id', id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        product_name:  product_name.trim(),
        tagline:       tagline?.trim()     || null,
        description:   description?.trim() || null,
        category:      category            || null,
        price:         price?.trim()       || null,
        features:      features            || [],
        how_to_use:    how_to_use?.trim()  || null,
        demo_notes:    demo_notes?.trim()  || null,
        images:        images              || [],
        video_urls:    video_urls          || [],
        order_link:    order_link?.trim()  || null,
        is_active:     is_active           ?? true,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', id).eq('user_id', req.userId)
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ product: data, message: 'Product updated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('products').delete()
      .eq('id', req.params.id).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Product deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/products/:id/upload-image ───────────────────────────────────────
router.post('/:id/upload-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_base64, mime_type, caption, is_hero } = req.body;

    if (!image_base64) return res.status(400).json({ error: 'image_base64 is required' });

    const { data: product } = await supabaseAdmin
      .from('products').select('id, images')
      .eq('id', id).eq('user_id', req.userId).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const ext      = mime_type?.split('/')[1] || 'jpg';
    const filename = `${req.userId}/${id}/${Date.now()}.${ext}`;
    const buffer   = Buffer.from(image_base64, 'base64');

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-media')
      .upload(filename, buffer, { contentType: mime_type || 'image/jpeg', upsert: false });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-media').getPublicUrl(filename);

    const images = product.images || [];
    images.push({ url: publicUrl, caption: caption || '', is_hero: is_hero || images.length === 0 });

    const { data, error } = await supabaseAdmin
      .from('products').update({ images, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', req.userId).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ product: data, image_url: publicUrl, message: 'Image uploaded' });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

// ── DELETE /api/products/:id/image ────────────────────────────────────────────
router.delete('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;

    const { data: product } = await supabaseAdmin
      .from('products').select('id, images')
      .eq('id', id).eq('user_id', req.userId).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const images = (product.images || []).filter(img => img.url !== image_url);

    const { data, error } = await supabaseAdmin
      .from('products').update({ images, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', req.userId).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ product: data, message: 'Image removed' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;