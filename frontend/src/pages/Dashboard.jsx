import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getCampaigns, deleteCampaign } from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCampaigns();
      console.log('Campaigns data received:', data);
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (err) {
      setError('Failed to delete campaign');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Welcome back, {user?.name || 'User'}! 👋
            </h2>
            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Manage your viral marketing campaigns</p>
          </div>
          <button
            onClick={() => navigate('/new-campaign')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            + New Campaign
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${isDark ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg mb-6`}>
            {error}
          </div>
        )}

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
            <div className="text-6xl mb-4">✨</div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>No campaigns yet</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mb-6`}>Create your first viral marketing campaign to get started!</p>
            <button
              onClick={() => navigate('/new-campaign')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const safeId = String(campaign.id || '');
              const safeName = String(campaign.name || 'Untitled Campaign');
              const safeDescription = String(campaign.description || campaign.product_description || 'No description');
              const safeTarget = String(campaign.target_audience || 'N/A');
              const safeProvider = String(campaign.ai_provider || 'gemini');
              const safeFormatsCount = Array.isArray(campaign.output_formats) ? campaign.output_formats.length : 0;
              const safeDate = campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A';
              
              return (
                <div
                  key={safeId}
                  className={`${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-xl border transition-all p-6 cursor-pointer group relative`}
                  onClick={() => navigate(`/campaign/${safeId}`)}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaign/${safeId}/edit`);
                      }}
                      className={`${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'} transition-colors`}
                      title="Edit campaign"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(safeId);
                      }}
                      className={`${isDark ? 'text-slate-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'} transition-colors`}
                      title="Delete campaign"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 className={`text-xl font-bold ${isDark ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'} transition-colors mb-3 pr-16`}>
                    {safeName}
                  </h3>

                  <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm mb-4 line-clamp-2`}>
                    {safeDescription}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Target:</span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} line-clamp-1`}>{safeTarget}</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between text-xs pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      safeProvider === 'claude' 
                        ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700')
                        : safeProvider === 'openai' 
                          ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                          : (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                    }`}>
                      {safeProvider === 'claude' ? 'Claude' :
                       safeProvider === 'openai' ? 'OpenAI' :
                       'Gemini'}
                    </span>
                    <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>
                      {safeFormatsCount} formats
                    </span>
                  </div>

                  <div className={`mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    Created {safeDate}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;