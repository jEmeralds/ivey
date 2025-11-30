import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
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
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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

export default api;