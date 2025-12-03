import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const FeatureCard = ({ icon, title, desc }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.featureCard,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        borderColor: isHovered ? '#3b82f6' : '#334155',
        boxShadow: isHovered ? '0 20px 40px rgba(59, 130, 246, 0.3)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        ...styles.featureIcon,
        transform: isHovered ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
        transition: 'all 0.3s ease',
      }}>
        {icon}
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
      {isHovered && (
        <div style={styles.cardShine} />
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: '🎬',
      title: '13+ Content Formats',
      desc: 'TikTok scripts, YouTube Shorts, Instagram captions, email marketing, SMS, flyers, ads, and more.',
    },
    {
      icon: '🤖',
      title: 'Multi-AI Providers',
      desc: 'Choose between Claude, GPT-4o, and Gemini. Get the best results from multiple AI models.',
    },
    {
      icon: '📊',
      title: 'Virality Scoring',
      desc: 'AI predicts viral potential of each idea with detailed scoring and optimization suggestions.',
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      desc: 'Generate 50+ ideas across multiple formats in under 2 minutes. Export and use immediately.',
    },
    {
      icon: '🎯',
      title: 'Audience Targeting',
      desc: 'Customize content for specific demographics, emotions, and campaign goals.',
    },
    {
      icon: '💼',
      title: 'Agency Ready',
      desc: 'Manage multiple campaigns, collaborate with teams, and scale your content production.',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <h1 style={styles.logo} onClick={() => handleNavigate('/')}>
            🚀 IVey
          </h1>
          
          {/* Desktop Navigation */}
          <div style={styles.navCenter} className="desktop-nav">
            <button onClick={() => scrollToSection('features')} style={styles.navLink}>
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} style={styles.navLink}>
              Pricing
            </button>
            <button onClick={() => scrollToSection('about')} style={styles.navLink}>
              About
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div style={styles.navLinks} className="desktop-nav">
            {user ? (
              <>
                <button onClick={() => handleNavigate('/dashboard')} style={styles.navBtn}>
                  Dashboard
                </button>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleNavigate('/login')} style={styles.navBtn}>
                  Login
                </button>
                <button onClick={() => handleNavigate('/signup')} style={styles.primaryBtn}>
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            style={styles.hamburger} 
            className="mobile-nav"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div style={styles.mobileMenu} className="mobile-nav">
            <button onClick={() => scrollToSection('features')} style={styles.mobileLink}>
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} style={styles.mobileLink}>
              Pricing
            </button>
            <button onClick={() => scrollToSection('about')} style={styles.mobileLink}>
              About
            </button>
            <div style={styles.mobileDivider}></div>
            {user ? (
              <>
                <button onClick={() => handleNavigate('/dashboard')} style={styles.mobileLink}>
                  Dashboard
                </button>
                <button onClick={handleLogout} style={styles.mobileLinkRed}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleNavigate('/login')} style={styles.mobileLink}>
                  Login
                </button>
                <button onClick={() => handleNavigate('/signup')} style={styles.mobileLinkPrimary}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* CSS for responsive behavior */}
      <style>{`
        .desktop-nav {
          display: flex;
        }
        .mobile-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          Generate Viral Marketing Content<br />
          <span style={styles.gradient}>With AI in Seconds</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Create viral TikTok scripts, Instagram captions, email campaigns, and 13+ content formats using AI. 
          Built for marketing agencies and brands.
        </p>
        <div style={styles.heroCTA}>
          <button 
            onClick={() => navigate(user ? '/campaigns/new' : '/signup')} 
            style={styles.heroPrimaryBtn}
          >
            Get Started Free
          </button>
          <button onClick={() => scrollToSection('features')} style={styles.heroSecondaryBtn}>
            View Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <h2 style={styles.sectionTitle}>Everything You Need to Go Viral</h2>
        <div style={styles.featureGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Simple, Transparent Pricing</h2>
        <div style={styles.pricingGrid}>
          {/* Free Plan */}
          <div style={styles.pricingCard}>
            <h3 style={styles.pricingTitle}>Free</h3>
            <div style={styles.pricingPrice}>$0<span style={styles.pricingPeriod}>/month</span></div>
            <ul style={styles.pricingFeatures}>
              <li>✓ 5 campaigns/month</li>
              <li>✓ 3 AI generations/day</li>
              <li>✓ Basic formats</li>
              <li>✓ Community support</li>
            </ul>
            <button 
              onClick={() => navigate('/signup')} 
              style={styles.pricingBtn}
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div style={{...styles.pricingCard, ...styles.pricingCardPro}}>
            <div style={styles.popularBadge}>Most Popular</div>
            <h3 style={styles.pricingTitle}>Pro</h3>
            <div style={styles.pricingPrice}>$29<span style={styles.pricingPeriod}>/month</span></div>
            <ul style={styles.pricingFeatures}>
              <li>✓ Unlimited campaigns</li>
              <li>✓ Unlimited generations</li>
              <li>✓ All 13+ formats</li>
              <li>✓ Priority support</li>
              <li>✓ Team collaboration</li>
            </ul>
            <button 
              onClick={() => navigate('/signup')} 
              style={styles.pricingBtnPro}
            >
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div style={styles.pricingCard}>
            <h3 style={styles.pricingTitle}>Enterprise</h3>
            <div style={styles.pricingPrice}>Custom</div>
            <ul style={styles.pricingFeatures}>
              <li>✓ Everything in Pro</li>
              <li>✓ Custom AI models</li>
              <li>✓ API access</li>
              <li>✓ Dedicated support</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <button 
              onClick={() => window.location.href = 'mailto:contact@ivey.com'} 
              style={styles.pricingBtn}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={styles.about}>
        <h2 style={styles.sectionTitle}>About IVey</h2>
        <div style={styles.aboutContent}>
          <p style={styles.aboutText}>
            IVey is an AI-powered viral marketing platform designed to help marketing agencies, 
            brands, and content creators generate high-converting marketing content at scale.
          </p>
          <p style={styles.aboutText}>
            Our multi-AI approach combines the best of Claude, GPT-4, and Gemini to deliver 
            diverse, creative, and engaging content across 13+ formats including TikTok scripts, 
            Instagram captions, email campaigns, and more.
          </p>
          <p style={styles.aboutText}>
            Founded in 2024, we're on a mission to democratize viral marketing and help 
            businesses of all sizes create content that resonates with their audience.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to Create Viral Content?</h2>
        <p style={styles.ctaSubtitle}>Join marketing agencies using IVey to 10x their content output</p>
        <button 
          onClick={() => navigate(user ? '/campaigns/new' : '/signup')} 
          style={styles.ctaBtn}
        >
          Start Creating Now →
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <h3 style={styles.footerLogo}>🚀 IVey</h3>
            <p style={styles.footerTagline}>AI-Powered Viral Marketing</p>
          </div>
          <div style={styles.footerLinks}>
            <button onClick={() => scrollToSection('features')} style={styles.footerLink}>Features</button>
            <button onClick={() => scrollToSection('pricing')} style={styles.footerLink}>Pricing</button>
            <button onClick={() => scrollToSection('about')} style={styles.footerLink}>About</button>
            <a href="mailto:contact@ivey.com" style={styles.footerLink}>Contact</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.copyright}>© 2024 IVey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
  },
  nav: {
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: '#fff',
    margin: 0,
    fontSize: '24px',
    cursor: 'pointer',
  },
  navCenter: {
    display: 'flex',
    gap: '32px',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.2s',
    padding: '8px 0',
  },
  navLinks: {
    display: 'flex',
    gap: '16px',
  },
  navBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #ef4444',
    backgroundColor: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  // Mobile menu styles
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileMenu: {
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    padding: '16px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mobileLink: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '12px 0',
    textAlign: 'left',
    transition: 'color 0.2s',
  },
  mobileLinkPrimary: {
    background: '#3b82f6',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '8px',
  },
  mobileLinkRed: {
    background: 'none',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '8px',
  },
  mobileDivider: {
    height: '1px',
    backgroundColor: '#334155',
    margin: '8px 0',
  },
  hero: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '120px 32px 80px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 24px 0',
    lineHeight: '1.2',
  },
  gradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#94a3b8',
    margin: '0 0 40px 0',
    lineHeight: '1.6',
  },
  heroCTA: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  heroPrimaryBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  heroSecondaryBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: '2px solid #334155',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s',
  },
  features: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 32px',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 64px 0',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #334155',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 12px 0',
  },
  featureDesc: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.6',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
    animation: 'shine 0.6s',
  },
  // Pricing styles
  pricing: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 32px',
    backgroundColor: '#0f172a',
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  pricingCard: {
    backgroundColor: '#1e293b',
    padding: '40px 32px',
    borderRadius: '16px',
    border: '1px solid #334155',
    textAlign: 'center',
    position: 'relative',
  },
  pricingCardPro: {
    border: '2px solid #3b82f6',
    transform: 'scale(1.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  pricingTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 16px 0',
  },
  pricingPrice: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 24px 0',
  },
  pricingPeriod: {
    fontSize: '16px',
    color: '#94a3b8',
    fontWeight: 'normal',
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px 0',
    textAlign: 'left',
  },
  pricingBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  pricingBtnPro: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  // About styles
  about: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 32px',
  },
  aboutContent: {
    textAlign: 'center',
  },
  aboutText: {
    fontSize: '18px',
    color: '#94a3b8',
    lineHeight: '1.8',
    margin: '0 0 24px 0',
  },
  cta: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 32px',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 16px 0',
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: '#94a3b8',
    margin: '0 0 32px 0',
  },
  ctaBtn: {
    padding: '18px 40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  footer: {
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    padding: '48px 0 24px',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  footerBrand: {},
  footerLogo: {
    color: '#fff',
    margin: '0 0 8px 0',
    fontSize: '20px',
  },
  footerTagline: {
    color: '#94a3b8',
    margin: 0,
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  footerLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    borderTop: '1px solid #334155',
    paddingTop: '24px',
  },
  copyright: {
    color: '#64748b',
    margin: 0,
    fontSize: '14px',
    textAlign: 'center',
  },
};

export default Home;