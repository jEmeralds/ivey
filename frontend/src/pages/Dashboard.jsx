import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getCampaigns, deleteCampaign } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      console.log('First campaign:', data.campaigns?.[0]);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
              title="Home"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚀</div>
              <h1 className="text-2xl font-bold text-gray-900">IVey</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h2>
            <p className="text-gray-600">Manage your viral marketing campaigns</p>
          </div>
          <button
            onClick={() => navigate('/new-campaign')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            + New Campaign
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">Create your first viral marketing campaign to get started!</p>
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
              // Ensure all values are safe to render
              const safeId = String(campaign.id || '');
              const safeName = String(campaign.name || 'Untitled Campaign');
              const safeDescription = String(campaign.description || 'No description');
              const safeTarget = String(campaign.target_audience || 'N/A');
              const safeProvider = String(campaign.ai_provider || 'claude');
              const safeFormatsCount = Array.isArray(campaign.output_formats) ? campaign.output_formats.length : 0;
              const safeDate = campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A';
              
              return (
                <div
                  key={safeId}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 cursor-pointer group relative"
                  onClick={() => navigate(`/campaign/${safeId}`)}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaign/${safeId}/edit`);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
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
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete campaign"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-3 pr-8">
                    {safeName}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {safeDescription}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Target:</span>
                      <span className="text-xs font-medium text-gray-700 line-clamp-1">{safeTarget}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100">
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      safeProvider === 'claude' ? 'bg-purple-100 text-purple-700' :
                      safeProvider === 'openai' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {safeProvider === 'claude' ? '🤖 Claude' :
                       safeProvider === 'openai' ? '🧠 OpenAI' :
                       '💎 Gemini'}
                    </span>
                    <span className="text-gray-500">
                      {safeFormatsCount} formats
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
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