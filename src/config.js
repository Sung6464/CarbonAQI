// src/config.js
const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const configuredApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const isLocalHost = typeof window !== 'undefined'
  ? ['localhost', '127.0.0.1'].includes(window.location.hostname)
  : false;

const apiCandidates = [
  configuredApiUrl,
  isLocalHost ? '' : browserOrigin,
  'http://localhost:5000',
  'https://carboniq.onrender.com',
].filter((value, index, list) => list.indexOf(value) === index);

const config = {
  apiUrl: apiCandidates[0] || '',
  apiCandidates,
};

export default config;
