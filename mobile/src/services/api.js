// Mobile API Service — mirrors web dashboard service
const API_BASE = 'http://10.0.2.2:3001/v1'; // Android emulator → localhost
// const API_BASE = 'http://localhost:3001/v1'; // iOS simulator / Expo web

let authToken = null;

export function setAuthToken(token) { authToken = token; }

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const auth = {
  loginAsRole: (role) => request('/auth/login', { method: 'POST', body: JSON.stringify({ role }) }),
};

export const incidents = {
  create: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request('/incidents'),
  get: (id) => request(`/incidents/${id}`),
  update: (id, data) => request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
