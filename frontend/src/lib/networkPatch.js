import axios from 'axios';

const RAW_API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
// Normalize base: remove trailing slashes
const API_BASE = RAW_API_BASE.replace(/\/+$/,'');

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // replace multiple slashes after protocol (e.g. https://host//path -> https://host/path)
  return url.replace(/(^https?:\/\/[\w.-]+)\/+/i, (m, p1) => p1 + '/')
            .replace(/([^:])\/\/+/, (m, p1) => p1 + '/');
}

// Patch global fetch to rewrite localhost URLs to configured backend at runtime
if (typeof window !== 'undefined' && window.fetch) {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      // if input is a Request, extract its url
      if (input instanceof Request) {
        let url = input.url;
        if (typeof url === 'string' && url.startsWith('http://localhost:8000')) {
          url = url.replace('http://localhost:8000', API_BASE);
          url = sanitizeUrl(url);
          input = new Request(url, input);
        }
      } else if (typeof input === 'string') {
        // protect against accidental object-to-string '[object Object]'
        if (input === '[object Object]') {
          console.error('Blocked fetch to "[object Object]" — probable bug passing an object as URL');
          return Promise.reject(new Error('Invalid URL: [object Object]'));
        }
        if (input.startsWith('http://localhost:8000')) {
          input = input.replace('http://localhost:8000', API_BASE);
          input = sanitizeUrl(input);
        }
      } else if (input && input.url && typeof input.url === 'string') {
        let url = input.url;
        if (url === '[object Object]') {
          console.error('Blocked fetch to "[object Object]" — probable bug passing an object as URL');
          return Promise.reject(new Error('Invalid URL: [object Object]'));
        }
        if (url.startsWith('http://localhost:8000')) {
          url = url.replace('http://localhost:8000', API_BASE);
          url = sanitizeUrl(url);
          input = new Request(url, input);
        }
      } else if (typeof input === 'object') {
        // If an object was passed directly, prevent silent 404s and surface a helpful error
        console.error('Blocked fetch with non-request object as input:', input);
        return Promise.reject(new Error('Invalid fetch input: expected string or Request'));
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
    if (!config) return config;
    // coerce accidental object urls
    if (typeof config.url !== 'string' && config.url && typeof config.url === 'object') {
      config.url = config.url.url || String(config.url);
    }
    if (typeof config.url === 'string') {
      if (config.url === '[object Object]') {
        console.error('Blocked axios request with url "[object Object]" — probable bug passing an object as URL', config);
        return Promise.reject(new Error('Invalid axios url: [object Object]'));
      }
      if (config.url.startsWith('http://localhost:8000')) {
        config.url = config.url.replace('http://localhost:8000', API_BASE);
      }
      config.url = sanitizeUrl(config.url);
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

export default API_BASE;
