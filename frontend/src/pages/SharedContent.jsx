import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedContent } from '../services/api';
import ReactMarkdown from 'react-markdown';

const SharedContent = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getSharedContent(token);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.error || 'This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-400 text-sm">Loading shared content...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold text-white mb-2">Link Unavailable</h2>
        <p className="text-gray-400 mb-8 text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all text-sm">
          Go to IVey →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Watermark */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">IV</span>
            </div>
            <span className="text-sm text-gray-400">
              Shared via <span className="text-purple-400 font-medium">IVey</span> · AI Marketing Platform
            </span>
          </div>
          <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${copied ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}>
            {copied ? '✅ Copied!' : '📋 Copy Content'}
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/10">
            <h1 className="text-2xl font-bold text-white mb-2">{data?.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>📅 Shared on {new Date(data?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {data?.expires_at && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-600 inline-block"></span>
                  <span>⏳ Expires {new Date(data.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </>
              )}
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
              <ReactMarkdown>{data?.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/10 border border-purple-700/30 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-semibold text-sm">Want to create campaigns like this?</p>
            <p className="text-gray-400 text-xs mt-0.5">Generate viral marketing content with AI in seconds.</p>
          </div>
          <button onClick={() => navigate('/signup')} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all text-sm whitespace-nowrap">
            Try IVey Free →
          </button>
        </div>

      </div>
    </div>
  );
};

export default SharedContent;