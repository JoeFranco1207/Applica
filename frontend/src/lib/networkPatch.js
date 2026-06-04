import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Patch global fetch to rewrite localhost URLs to configured backend at runtime
if (typeof window !== 'undefined' && window.fetch) {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      if (typeof input === 'string' && input.startsWith('http://localhost:8000')) {
        input = input.replace('http://localhost:8000', API_BASE);
      } else if (input && input.url && typeof input.url === 'string' && input.url.startsWith('http://localhost:8000')) {
        input = new Request(input.url.replace('http://localhost:8000', API_BASE), input);
      }
    } catch (e) {
      // fall through to original fetch
    }
    return _fetch(input, init);
  };
}

// Axios request interceptor to rewrite absolute localhost URLs
axios.interceptors.request.use((config) => {
  try {
    if (config && typeof config.url === 'string' && config.url.startsWith('http://localhost:8000')) {
      config.url = config.url.replace('http://localhost:8000', API_BASE);
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

export default API_BASE;
