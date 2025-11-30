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
  const { user } = useAuth();

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
          <h1 style={styles.logo}>🚀 IVey</h1>
          <div style={styles.navLinks}>
            {user ? (
              <>
                <button onClick={() => navigate('/dashboard')} style={styles.navBtn}>
                  Dashboard
                </button>
                <button onClick={() => navigate('/campaigns/new')} style={styles.primaryBtn}>
                  Create Campaign
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} style={styles.navBtn}>
                  Login
                </button>
                <button onClick={() => navigate('/signup')} style={styles.primaryBtn}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

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
          <button onClick={() => navigate('/login')} style={styles.heroSecondaryBtn}>
            View Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Everything You Need to Go Viral</h2>
        <div style={styles.featureGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
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
            <a href="#" style={styles.footerLink}>About</a>
            <a href="#" style={styles.footerLink}>Pricing</a>
            <a href="#" style={styles.footerLink}>Contact</a>
            <a href="#" style={styles.footerLink}>Privacy</a>
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
  },
  heroSecondaryBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: '2px solid #334155',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
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
  },
  footerLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
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