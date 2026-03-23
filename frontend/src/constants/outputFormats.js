// ─── Image formats ────────────────────────────────────────────────────────────
// Each maps directly to a DALL-E 3 image generation at the correct dimensions
export const IMAGE_FORMATS = {
  BANNER_AD: {
    name: 'Banner Ad',
    platform: 'Digital Ads',
    description: 'Wide horizontal banner for websites and display ads',
    width: 1200, height: 628, aspect: '1.91:1', type: 'image',
  },
  POSTER: {
    name: 'Poster',
    platform: 'Print & Digital',
    description: 'Tall portrait poster for print or digital display',
    width: 800, height: 1100, aspect: '3:4', type: 'image',
  },
  FLYER: {
    name: 'Flyer',
    platform: 'Print & Digital',
    description: 'Compact flyer for events and promotions',
    width: 800, height: 1000, aspect: '4:5', type: 'image',
  },
  INSTAGRAM_POST: {
    name: 'Instagram Post',
    platform: 'Instagram',
    description: 'Square post optimised for Instagram feed',
    width: 1080, height: 1080, aspect: '1:1', type: 'image',
  },
  INSTAGRAM_STORY: {
    name: 'Instagram Story',
    platform: 'Instagram / TikTok',
    description: 'Vertical story or reel cover',
    width: 1080, height: 1920, aspect: '9:16', type: 'image',
  },
  YOUTUBE_THUMBNAIL: {
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    description: 'Bold thumbnail to maximise click-through rate',
    width: 1280, height: 720, aspect: '16:9', type: 'image',
  },
};

// ─── Video format ─────────────────────────────────────────────────────────────
// Generates a timed production script — no DALL-E, pure AI text
export const VIDEO_FORMATS = {
  VIDEO_SCRIPT: {
    name: 'Video Script',
    platform: 'Any platform',
    description: 'Full timed script calibrated to your chosen duration',
    type: 'video',
    icon: '🎬',
  },
};

// ─── Combined — used where both types are shown together ──────────────────────
export const OUTPUT_FORMATS = { ...IMAGE_FORMATS, ...VIDEO_FORMATS };

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const isImageFormat = (key) => key in IMAGE_FORMATS;
export const isVideoFormat  = (key) => key in VIDEO_FORMATS;