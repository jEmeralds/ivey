import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [currentStat, setCurrentStat] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const stats = [
    { number: '50K+', label: 'Content Pieces' },
    { number: '2.3M+', label: 'Words Generated' },
    { number: '15+', label: 'AI Formats' },
    { number: '30s', label: 'Average Speed' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #00f5ff 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%),
              linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)
            `,
            backgroundSize: '400px 400px, 300px 300px, 50px 50px'
          }}
        />
      </div>

      {/* Floating Neural Network Dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60"
            style={{
              left: `${15 + (i * 12)}%`,
              top: `${20 + (i * 8)}%`,
              animation: `float ${3 + (i * 0.5)}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Mouse Trail Effect */}
      <div 
        className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transform: 'translate3d(0,0,0)'
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">IVey</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link to="/login" className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
        
        {/* Main Headline */}
        <div className="text-center max-w-6xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm mb-8 backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>AI Revolution in Marketing</span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 leading-tight mb-6">
            Generate
            <br />
            <span className="text-white">Viral Content</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            Transform ideas into viral marketing campaigns using advanced AI. 
            <br className="hidden lg:block" />
            From TikTok scripts to email campaigns in <span className="text-cyan-400 font-bold">seconds</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              to="/dashboard"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Start Creating
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center p-6 rounded-2xl transition-all duration-500 ${
                  currentStat === index 
                    ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-400/50 scale-105' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="text-3xl lg:text-4xl font-black text-white mb-2">{stat.number}</div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              AI That Actually <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No prompting. No tweaking. Just results.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Multi-Format Generation */}
            <div className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">15+ Formats</h3>
              <p className="text-gray-400 leading-relaxed">
                TikTok scripts, Instagram posts, email campaigns, YouTube ads — all from one campaign brief.
              </p>
            </div>

            {/* Lightning Speed */}
            <div className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-cyan-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">30s Generation</h3>
              <p className="text-gray-400 leading-relaxed">
                No more waiting. Advanced AI models optimized for marketing content creation at warp speed.
              </p>
            </div>

            {/* Smart Targeting */}
            <div className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-green-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart AI</h3>
              <p className="text-gray-400 leading-relaxed">
                Claude, GPT-4, and Gemini working together to understand your brand and audience perfectly.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;