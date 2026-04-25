// ============================================================
// CrisisSync Dashboard — API Service Layer
// All backend calls go through this module
// ============================================================

const API_BASE = 'http://localhost:3001/v1';

let authToken = localStorage.getItem('crisissync_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('crisissync_token', token);
  } else {
    localStorage.removeItem('crisissync_token');
  }
}

export function getAuthToken() {
  return authToken;
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.text();
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────
export const auth = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  loginAsRole: (role) => request('/auth/login', { method: 'POST', body: JSON.stringify({ role }) }),
};

// ── Incidents ───────────────────────────────────────────────
export const incidents = {
  create: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request('/incidents'),
  get: (id) => request(`/incidents/${id}`),
  update: (id, data) => request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  assign: (id, staffId) => request(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  audit: (id) => request(`/incidents/${id}/audit`),
};

// ── Hotels ──────────────────────────────────────────────────
export const hotels = {
  getStaff: (hotelId) => request(`/hotels/${hotelId}/staff`),
  getMap: (hotelId) => request(`/hotels/${hotelId}/map`),
  get: (hotelId) => request(`/hotels/${hotelId}`),
};

// ── Users ───────────────────────────────────────────────────
export const users = {
  updateLocation: (userId, data) => request(`/users/${userId}/location`, { method: 'PATCH', body: JSON.stringify(data) }),
  me: () => request('/users/me'),
};

// ── Notifications ───────────────────────────────────────────
export const notifications = {
  broadcast: (message) => request('/notifications/broadcast', { method: 'POST', body: JSON.stringify({ message }) }),
};

// ── Reports ─────────────────────────────────────────────────
export const reports = {
  summary: () => request('/reports/summary'),
  exportCSV: () => request('/reports/export'),
};

// ── SSE (Real-time events) ──────────────────────────────────
export function connectSSE(hotelId, onEvent) {
  const evtSource = new EventSource(`${API_BASE}/events/${hotelId}`);
  evtSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (_) {}
  };
  evtSource.onerror = () => {
    console.log('SSE connection error, will retry...');
  };
  return evtSource;
}
