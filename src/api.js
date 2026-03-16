// src/api.js
import config from './config';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

const getToken = async () => {
  const user = auth.currentUser;
  console.log("getToken: currentUser =", user ? { uid: user.uid, email: user.email } : null);
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  console.log("getToken: got token, length =", token.length);
  return token;
};

const isJsonBody = (body) => typeof body === 'string';

const buildHeaders = (options, token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(isJsonBody(options.body) ? { 'Content-Type': 'application/json' } : {}),
  ...options.headers,
});

const fetchFromCandidates = async (endpoint, options = {}, { requireAuth = true } = {}) => {
  const token = requireAuth ? await getToken() : null;

  for (const baseUrl of config.apiCandidates) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: buildHeaders(options, token),
      });
      return response;
    } catch (error) {
      console.warn(`API request failed against ${baseUrl || 'same-origin'}${endpoint}`, error);
    }
  }

  throw new Error(
    `Could not connect to the server. Checked ${config.apiCandidates.join(', ')}. ` +
    `Set VITE_API_URL or confirm the Flask API is running.`
  );
};

const apiFetch = async (endpoint, options = {}) => {
  const response = await fetchFromCandidates(endpoint, options, { requireAuth: true });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await signOut(auth).catch(() => {});
    }
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
    const response = await fetchFromCandidates('/api/factors', {}, { requireAuth: false });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },

  updateProfile: async (profileData) => {
    return apiFetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  },

  // Company APIs
  createCompany: async (companyData) => {
    return apiFetch('/api/company', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  },

  joinCompany: async (companyData) => {
    return apiFetch('/api/company/join', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  },

  getCompanyDashboard: async (companyId) => {
    return apiFetch(`/api/company/dashboard/${companyId}`);
  },

  getCompanyInfo: async (companyId) => {
    const response = await fetchFromCandidates(`/api/company/info/${companyId}`, {}, { requireAuth: false });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  }
};
