import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (!isHomePage) {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always links to home */}
            <Link 
              to="/"
              className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition-opacity"
            >
              🚀 IVey
            </Link>
            
            {/* Desktop Navigation - All links on the right side */}
            <div className="hidden md:flex items-center gap-6">
              {/* Navigation Links */}
              <Link 
                to="/" 
                className={`transition-colors ${location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Home
              </Link>
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-600"></div>

              {/* Auth Buttons */}
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === '/dashboard' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button 
              className="md:hidden p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ top: '64px' }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              {/* Navigation Links */}
              <Link 
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                🏠 Home
              </Link>
              <button 
                onClick={() => scrollToSection('features')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                ✨ Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                💰 Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                📧 Contact
              </button>
              
              {/* Divider */}
              <div className="my-3 border-t border-slate-700" />
              
              {/* Auth Section */}
              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/dashboard' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    📊 Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    🔑 Login
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block mt-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg text-center"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;