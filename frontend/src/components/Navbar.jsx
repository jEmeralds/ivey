import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Simple theme state - stored in localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ivey-theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  // Apply theme to body when it changes
  useEffect(() => {
    localStorage.setItem('ivey-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <>
      <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              <img src="/vite.svg" alt="IVey" className="w-8 h-8" />
              IVey
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`transition-colors ${location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Home
              </button>
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

              <div className="h-6 w-px bg-slate-600"></div>

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

            {/* Right side: Theme Toggle + Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-yellow-400 transition-all"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Mobile Hamburger */}
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
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ top: '64px' }}>
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="absolute top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Contact
              </button>
              
              <div className="my-3 border-t border-slate-700" />
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/dashboard' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    Login
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