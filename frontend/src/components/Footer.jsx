import { Link, useNavigate, useLocation } from 'react-router-dom';

const Footer = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Don't show footer inside dashboard
  if (location.pathname.startsWith('/dashboard')) return null;

  const handleGalleryClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('gallery');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('gallery');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const handleDemoClick = (e) => {
    e.preventDefault();
    navigate('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white">IVey</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Generate viral marketing content with AI in seconds. Built for creators and brands who want to move fast.
            </p>
            {/* Social links — wired to real platforms */}
            <div className="flex items-center gap-3">
              <a href="https://twitter.com" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product — only real routes */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing"  className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="/#gallery" onClick={handleGalleryClick} className="text-gray-400 hover:text-white transition-colors cursor-pointer">Gallery</a></li>
              <li><a href="/" onClick={handleDemoClick} className="text-gray-400 hover:text-white transition-colors cursor-pointer">Demo</a></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/signup"    className="text-gray-400 hover:text-white transition-colors">Get Started Free</Link></li>
              <li><Link to="/login"     className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">My Dashboard</Link></li>
              <li><Link to="/dashboard?section=campaigns" className="text-gray-400 hover:text-white transition-colors">My Campaigns</Link></li>
              <li><Link to="/brand"     className="text-gray-400 hover:text-white transition-colors">Brand Identity</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/support"  className="text-gray-400 hover:text-white transition-colors">Help & Support</Link></li>
              <li><Link to="/pricing"  className="text-gray-400 hover:text-white transition-colors">Plans & Pricing</Link></li>
              <li>
                <a href="mailto:support@ivey.app" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href={import.meta.env.VITE_FRONTEND_URL || "/"} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  Status
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              </li>
            </ul>

            {/* Newsletter teaser */}
            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">Stay updated</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-xs rounded-lg placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors min-w-0"
                />
                <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-amber-600 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} IVey. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/pricing" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Terms</Link>
            <Link to="/pricing" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Privacy</Link>
            <Link to="/pricing" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Cookies</Link>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;