import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }

    // Check theme preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, className = "" }) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActivePage(to)
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo - SERVES AS HOME BUTTON */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">IVey</span>
          </Link>

          {/* Desktop Navigation - REMOVED REDUNDANT HOME BUTTON */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/features">Features</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            
            {isLoggedIn && (
              <NavLink to="/dashboard">Dashboard</NavLink>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Authentication */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300">
                  Welcome, <span className="font-medium">{user?.name || 'User'}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <NavLink to="/login">Sign In</NavLink>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
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

        {/* Mobile Menu - ALSO REMOVED HOME FROM MOBILE */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-2">
            <div className="flex flex-col space-y-2">
              <NavLink to="/features" className="block w-full text-left">Features</NavLink>
              <NavLink to="/pricing" className="block w-full text-left">Pricing</NavLink>
              
              {isLoggedIn && (
                <NavLink to="/dashboard" className="block w-full text-left">Dashboard</NavLink>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Welcome, <span className="font-medium">{user?.name || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <NavLink to="/login" className="block w-full text-left">Sign In</NavLink>
                  <Link
                    to="/signup"
                    className="block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;