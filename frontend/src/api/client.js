import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Strip /api suffix to get the root — used to resolve /uploads/* media URLs
export const backendURL = baseURL.replace(/\/api\/?$/, '');

const client = axios.create({
  baseURL,
  withCredentials: true,
});

export default client;
