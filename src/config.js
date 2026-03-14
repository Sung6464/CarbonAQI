// src/config.js
const config = {
  // This will use Render URL in production, localhost in development
  apiUrl: import.meta.env.PROD 
    ? 'https://carbonaqi.onrender.com'  // Your Render URL (change this after deployment)
    : 'http://localhost:5000'
};

export default config;