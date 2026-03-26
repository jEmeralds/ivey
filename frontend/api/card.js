// frontend/api/card.js
// Vercel Serverless Function — serves a server-rendered HTML page with
// Open Graph + Twitter Card meta tags so Twitter's crawler renders a
// native image card instead of a bare URL.
//
// URL: https://ivey-steel.vercel.app/api/card?img=<url>&title=<text>
// Twitter crawler (Twitterbot) visits this URL, reads the OG tags,
// and renders the image inline in the tweet feed.

export default function handler(req, res) {
  const { img, title, description } = req.query;

  if (!img) {
    res.status(400).send('Missing img parameter');
    return;
  }

  const imageUrl  = decodeURIComponent(img);
  const cardTitle = decodeURIComponent(title || 'IVey — AI Marketing Content');
  const cardDesc  = decodeURIComponent(description || 'Created with IVey AI marketing platform');
  const cardUrl   = `https://ivey-steel.vercel.app/api/card?img=${encodeURIComponent(imageUrl)}&title=${encodeURIComponent(cardTitle)}`;

  // Sanitize to prevent XSS
  const safe = (str) =>
    str.replace(/&/g, '&amp;')
       .replace(/"/g, '&quot;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;');

  // Cache for 1 hour — Twitterbot re-crawls periodically
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safe(cardTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type"         content="website" />
  <meta property="og:url"          content="${safe(cardUrl)}" />
  <meta property="og:title"        content="${safe(cardTitle)}" />
  <meta property="og:description"  content="${safe(cardDesc)}" />
  <meta property="og:image"        content="${safe(imageUrl)}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"    content="IVey" />

  <!-- Twitter Card — summary_large_image shows a big image above the text -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@iveyai" />
  <meta name="twitter:title"       content="${safe(cardTitle)}" />
  <meta name="twitter:description" content="${safe(cardDesc)}" />
  <meta name="twitter:image"       content="${safe(imageUrl)}" />
  <meta name="twitter:image:alt"   content="${safe(cardTitle)}" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0c1420;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e2e8f0;
      padding: 24px;
    }
    .card {
      max-width: 700px;
      width: 100%;
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
    }
    .card img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 420px;
    }
    .card-body {
      padding: 20px 24px;
      border-top: 1px solid #1e293b;
    }
    .card-title {
      font-size: 17px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 6px;
    }
    .card-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .badge {
      margin-top: 16px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #10b981;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.2);
      padding: 4px 10px;
      border-radius: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${safe(imageUrl)}" alt="${safe(cardTitle)}" />
    <div class="card-body">
      <div class="card-title">${safe(cardTitle)}</div>
      <div class="card-desc">${safe(cardDesc)}</div>
      <div class="badge">⚡ Created with IVey AI</div>
    </div>
  </div>
</body>
</html>`);
}