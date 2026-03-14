// src/api.js
import config from './config';
import { auth } from './firebase';

const getToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

const apiFetch = async (endpoint, options = {}) => {
  const token = await getToken();
  
  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

export const api = {
  logActivity: async (data) => {
    return apiFetch('/api/log', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getDashboard: async (userId) => {
    return apiFetch(`/api/dashboard/${userId}`);
  },

  getHistory: async (userId) => {
    return apiFetch(`/api/history/${userId}`);
  },

  getStreak: async (userId) => {
    return apiFetch(`/api/streak/${userId}`);
  },

  getNudges: async (userId) => {
    return apiFetch(`/api/nudges/${userId}`);
  },

  getFactors: async () => {
    const response = await fetch(`${config.apiUrl}/api/factors`);
    return response.json();
  }
};