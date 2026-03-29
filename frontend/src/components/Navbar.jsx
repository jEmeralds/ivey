import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/authContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const handleThemeToggle = (e) => {
    e.preventDefault();
    toggleTheme();
  };

  const handleGalleryClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('gallery');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#gallery');
      setTimeout(() => {
        const el = document.getElementById('gallery');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  const navLinkBase     = `px-4 py-2 rounded-lg font-medium transition-all duration-200 text-base`;
  const navLinkActive   = `bg-emerald-600 text-white shadow-sm`;
  const navLinkInactive = `text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800`;

  const mobileLinkBase     = `flex items-center w-full px-4 py-3.5 rounded-xl font-medium text-base transition-all duration-150`;
  const mobileLinkActive   = `bg-emerald-600/10 text-emerald-600 dark:text-emerald-400`;
  const mobileLinkInactive = `text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800`;

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">IVey</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/features"  className={`${navLinkBase} ${isActive('/features')  ? navLinkActive : navLinkInactive}`}>Features</Link>
              <Link to="/pricing"   className={`${navLinkBase} ${isActive('/pricing')   ? navLinkActive : navLinkInactive}`}>Pricing</Link>
              <a href="/#gallery" onClick={handleGalleryClick} className={`${navLinkBase} ${navLinkInactive}`}>Gallery</a>
              {isAuthenticated && (
                <Link to="/dashboard" className={`${navLinkBase} ${isActive('/dashboard') ? navLinkActive : navLinkInactive}`}>Dashboard</Link>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">

              {/* Theme toggle */}
              <button
                onClick={handleThemeToggle}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Desktop auth */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium max-w-[100px] truncate">
                      {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"  className={`${navLinkBase} ${navLinkInactive}`}>Sign In</Link>
                  <Link to="/signup" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-sm text-sm">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="md:hidden p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeMobile}
          />
          {/* Drawer — top-16 to sit below fixed navbar */}
          <div className="md:hidden fixed top-16 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl animate-slideDown">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

              <Link to="/features" onClick={closeMobile} className={`${mobileLinkBase} ${isActive('/features') ? mobileLinkActive : mobileLinkInactive}`}>
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Features
              </Link>
              <Link to="/pricing" onClick={closeMobile} className={`${mobileLinkBase} ${isActive('/pricing') ? mobileLinkActive : mobileLinkInactive}`}>
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Pricing
              </Link>
              <a href="/#gallery" onClick={handleGalleryClick} className={`${mobileLinkBase} ${mobileLinkInactive}`}>
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Gallery
              </a>
              {isAuthenticated && (
                <Link to="/dashboard" onClick={closeMobile} className={`${mobileLinkBase} ${isActive('/dashboard') ? mobileLinkActive : mobileLinkInactive}`}>
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  Dashboard
                </Link>
              )}

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

              <button onClick={handleThemeToggle} className={`${mobileLinkBase} ${mobileLinkInactive}`}>
                {isDarkMode ? (
                  <svg className="w-5 h-5 mr-3 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                )}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-semibold text-base">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className={`${mobileLinkBase} text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  <Link to="/login" onClick={closeMobile} className={`${mobileLinkBase} ${mobileLinkInactive}`}>
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={closeMobile} className="flex items-center justify-center w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 transition-colors shadow-sm">
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;