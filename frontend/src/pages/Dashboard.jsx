import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getCampaigns, deleteCampaign } from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h2>
            <p className="text-slate-400">Manage your viral marketing campaigns</p>
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
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-white mb-2">No campaigns yet</h3>
            <p className="text-slate-400 mb-6">Create your first viral marketing campaign to get started!</p>
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
                  className="bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all p-6 cursor-pointer group relative"
                  onClick={() => navigate(`/campaign/${safeId}`)}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaign/${safeId}/edit`);
                      }}
                      className="text-slate-500 hover:text-blue-400 transition-colors"
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
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete campaign"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-3 pr-16">
                    {safeName}
                  </h3>

                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {safeDescription}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Target:</span>
                      <span className="text-xs font-medium text-slate-300 line-clamp-1">{safeTarget}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-700">
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      safeProvider === 'claude' ? 'bg-purple-500/20 text-purple-400' :
                      safeProvider === 'openai' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {safeProvider === 'claude' ? 'Claude' :
                       safeProvider === 'openai' ? 'OpenAI' :
                       'Gemini'}
                    </span>
                    <span className="text-slate-500">
                      {safeFormatsCount} formats
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
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