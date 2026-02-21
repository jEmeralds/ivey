import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [currentStat, setCurrentStat] = useState(0);

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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors pt-16 md:pt-20">
      
      {/* Hero Section */}
      <div className="px-4 md:px-6 lg:px-12 py-8 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Column - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs md:text-sm mb-4 md:mb-6">
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>AI-Powered Marketing</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4 md:mb-6">
              Generate Viral Marketing Content 
              <span className="text-purple-600 dark:text-purple-400"> in Seconds</span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-6 md:mb-8 max-w-lg">
              Create TikTok scripts, Instagram captions, email campaigns, and 13+ content formats using advanced AI. Built for marketing agencies and brands.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link 
                to="/signup"
                className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors text-center"
              >
                Start Free Trial
              </Link>
              
              <Link 
                to="/demo"
                className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
              >
                Watch Demo
              </Link>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:gap-8 mt-8 md:mt-12">
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Content pieces</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">2.3M+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Words written</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">30s</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Avg. time</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-md md:rounded-lg"></div>
                  <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Campaign Brief</span>
                </div>
                
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
                
                <div className="flex gap-2">
                  <div className="px-2 md:px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">TikTok</div>
                  <div className="px-2 md:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">Instagram</div>
                  <div className="px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">Email</div>
                </div>
              </div>
              
              <div className="flex justify-center mt-4 md:mt-6">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-3 h-3 md:w-4 md:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>AI generating content...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to create viral content
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop spending hours writing content. Let AI do the heavy lifting while you focus on strategy.
            </p>
          </div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">15+ Content Formats</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Generate TikTok scripts, Instagram captions, YouTube ads, email campaigns, and more from one brief.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">Lightning Fast</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Generate comprehensive marketing strategies and content in 30 seconds, not 30 minutes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">Multi-AI Power</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Choose between Claude, GPT-4, and Gemini for optimal results based on your content type.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
            Ready to 10x your content creation speed?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
            Join thousands of marketers using AI to create viral content that converts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link 
              to="/signup"
              className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors"
            >
              Start Free Trial
            </Link>
            
            <Link 
              to="/pricing"
              className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;