import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import Navbar from '../components/Navbar';

const FeatureCard = ({ icon, title, desc }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-slate-800 p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
        isHovered ? 'border-blue-500 shadow-2xl shadow-blue-500/20 -translate-y-2' : 'border-slate-700'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`text-5xl mb-4 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const features = [
    { icon: '🎬', title: '13+ Content Formats', desc: 'TikTok scripts, YouTube Shorts, Instagram captions, email marketing, SMS, flyers, ads, and more.' },
    { icon: '🤖', title: 'Multi-AI Providers', desc: 'Choose between Claude, GPT-4o, and Gemini. Get the best results from multiple AI models.' },
    { icon: '📊', title: 'Marketing Strategy', desc: 'AI generates comprehensive marketing strategies with audience analysis and channel recommendations.' },
    { icon: '⚡', title: 'Lightning Fast', desc: 'Generate 50+ ideas across multiple formats in under 2 minutes. Export and use immediately.' },
    { icon: '🎯', title: 'Audience Targeting', desc: 'Customize content for specific demographics, emotions, and campaign goals.' },
    { icon: '💼', title: 'Agency Ready', desc: 'Manage multiple campaigns, upload brand assets, and scale your content production.' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Generate Viral Marketing Content<br />
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            With AI in Seconds
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Create viral TikTok scripts, Instagram captions, email campaigns, and 13+ content formats using AI. 
          Built for marketing agencies and brands.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleGetStarted} 
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-white font-semibold text-lg rounded-xl transition-all"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
          Everything You Need to Go Viral
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-slate-400 font-normal">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300">✓ 5 campaigns/month</li>
              <li className="text-slate-300">✓ 3 AI generations/day</li>
              <li className="text-slate-300">✓ Basic formats</li>
              <li className="text-slate-300">✓ Community support</li>
            </ul>
            <button onClick={handleGetStarted} className="w-full py-3 border border-slate-600 hover:border-slate-500 text-white font-semibold rounded-lg transition-colors">
              Get Started
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border-2 border-purple-500 relative transform lg:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold rounded-full">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-white mb-6">$29<span className="text-lg text-slate-400 font-normal">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300">✓ Unlimited campaigns</li>
              <li className="text-slate-300">✓ Unlimited generations</li>
              <li className="text-slate-300">✓ All 13+ formats</li>
              <li className="text-slate-300">✓ Priority support</li>
              <li className="text-slate-300">✓ Team collaboration</li>
            </ul>
            <button onClick={handleGetStarted} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all">
              Start Free Trial
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-bold text-white mb-6">Custom</div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300">✓ Everything in Pro</li>
              <li className="text-slate-300">✓ Custom AI models</li>
              <li className="text-slate-300">✓ API access</li>
              <li className="text-slate-300">✓ Dedicated support</li>
              <li className="text-slate-300">✓ SLA guarantee</li>
            </ul>
            <button onClick={() => scrollToSection('contact')} className="w-full py-3 border border-slate-600 hover:border-slate-500 text-white font-semibold rounded-lg transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get In Touch</h2>
        <p className="text-lg text-slate-400 mb-12">Have questions? We'd love to hear from you.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          <a href="mailto:contact@ivey.app" className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors block">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-white mb-1">Email Us</h3>
            <p className="text-slate-400">contact@ivey.app</p>
          </a>
          <a href="https://twitter.com/iveyapp" target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors block">
            <div className="text-4xl mb-3">🐦</div>
            <h3 className="text-lg font-semibold text-white mb-1">Twitter</h3>
            <p className="text-slate-400">@iveyapp</p>
          </a>
          <a href="https://linkedin.com/company/ivey" target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors block">
            <div className="text-4xl mb-3">💼</div>
            <h3 className="text-lg font-semibold text-white mb-1">LinkedIn</h3>
            <p className="text-slate-400">IVey Marketing</p>
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Create Viral Content?</h2>
        <p className="text-lg text-slate-400 mb-8">Join marketing agencies using IVey to 10x their content output</p>
        <button onClick={handleGetStarted} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-purple-500/25">
          {user ? 'Go to Dashboard →' : 'Start Creating Now →'}
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/vite.svg" alt="IVey" className="w-8 h-8" />
              <div className="text-left">
                <h3 className="text-xl font-bold text-white">IVey</h3>
                <p className="text-slate-400 text-sm">AI-Powered Viral Marketing</p>
              </div>
            </button>
            <div className="flex gap-6">
              <button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-slate-400 hover:text-white transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('contact')} className="text-slate-400 hover:text-white transition-colors">Contact</button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-sm">© 2024 IVey. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;