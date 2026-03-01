import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Campaign APIs
export const getCampaigns = async () => {
  const response = await api.get('/campaigns');
  return response.data;
};

export const getCampaignById = async (id) => {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
};

export const createCampaign = async (campaignData) => {
  const response = await api.post('/campaigns', campaignData);
  return response.data;
};

export const updateCampaign = async (id, campaignData) => {
  const response = await api.put(`/campaigns/${id}`, campaignData);
  return response.data;
};

export const deleteCampaign = async (id) => {
  const response = await api.delete(`/campaigns/${id}`);
  return response.data;
};

// AI Generation APIs
export const generateIdeas = async (campaignId) => {
  const response = await api.post(`/campaigns/${campaignId}/generate`);
  return response.data;
};

export const generateStrategy = async (campaignId) => {
  const response = await api.post(`/campaigns/${campaignId}/generate-strategy`);
  return response.data;
};

export const getAvailableProviders = async () => {
  const response = await api.get('/ai/providers');
  return response.data;
};

// Media Upload APIs
export const uploadMedia = async (formData) => {
  const response = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getCampaignMedia = async (campaignId) => {
  const response = await api.get(`/media/campaign/${campaignId}`);
  return response.data;
};

export const deleteMedia = async (mediaId) => {
  const response = await api.delete(`/media/${mediaId}`);
  return response.data;
};

// ─── Save & Share APIs ───────────────────────────────────────────────────────

export const saveContent = async ({ campaign_id, title, content, content_type, format }) => {
  const response = await api.post('/save', { campaign_id, title, content, content_type, format });
  return response.data;
};

export const getSavedContent = async (filters = {}) => {
  const response = await api.get('/saved', { params: filters });
  return response.data;
};

export const deleteSavedContent = async (id) => {
  const response = await api.delete(`/saved/${id}`);
  return response.data;
};

export const createShareLink = async ({ saved_content_id, title, content, expires_in_days }) => {
  const response = await api.post('/share', { saved_content_id, title, content, expires_in_days });
  return response.data;
};

export const getShareLinks = async () => {
  const response = await api.get('/shares');
  return response.data;
};

export const deactivateShareLink = async (token) => {
  const response = await api.patch(`/share/${token}/deactivate`);
  return response.data;
};

// Public - no auth needed
export const getSharedContent = async (token) => {
  const response = await axios.get(`${API_URL}/shared/${token}`);
  return response.data;
};

export default api;