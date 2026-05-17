import { API } from "./config";

const TOKEN_KEY = 'alescan_admin_token';

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
  return !!sessionStorage.getItem(TOKEN_KEY);
}

// 🔹 Unified request handler
async function adminFetch(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);

  let resp;

  try {
    resp = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Network error — cannot reach backend");
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error("unauthorized");
  }

  if (!resp.ok) {
    let message = `HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      message = data.detail || message;
    } catch { }
    throw new Error(message);
  }

  return resp.json();
}

// 🔹 Login (separate because no token yet)
export async function loginAdmin(username, password) {
  let resp;

  try {
    resp = await fetch(`${API}/admin/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error("Network error — cannot reach backend");
  }

  if (resp.status === 401) {
    const data = await resp.json();
    throw new Error(data.detail || 'Incorrect username or password');
  }

  if (!resp.ok) {
    throw new Error(`Server error ${resp.status}`);
  }

  return resp.json();
}

// 🔹 Admin endpoints
export const getStats = () => adminFetch('/admin/api/stats');
export const getFilteredScanStats = (mode = 'all', date = null) => {
  const params = new URLSearchParams({ mode });
  if (date) params.set('date', date);
  return adminFetch(`/admin/api/stats/scans?${params.toString()}`);
};
export const triggerSync = () => adminFetch('/admin/api/sync', { method: 'POST' });
export const getScanLogs = (limit = 50) => adminFetch(`/admin/api/logs/scan?limit=${limit}`);
export const getSyncLogs = (limit = 20) => adminFetch(`/admin/api/logs/sync?limit=${limit}`);
export const getErrorLogs = (limit = 20) => adminFetch(`/admin/api/logs/errors?limit=${limit}`);

// 🔹 Prices (use same handler for consistency)
export const getPriceRecords = () => adminFetch('/prices');

// 🔹 Analytics
export const getAnalyticsPrices = () => adminFetch('/admin/api/analytics/prices');
export const getAnalyticsScans = () => adminFetch('/admin/api/analytics/scans');
export const getAnalyticsEvaluations = () => adminFetch('/admin/api/analytics/evaluations');
export const getDailyVolume = (startDate, endDate) => adminFetch(`/admin/api/analytics/daily-volume?start_date=${startDate}&end_date=${endDate}`);

// 🔹 Violations
export const getViolations = (limit = 50) => adminFetch(`/admin/api/violations?limit=${limit}`);

export const createViolation = async (formData) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  
  let resp;
  try {
    resp = await fetch(`${API}/admin/api/violations`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData, // FormData object
    });
  } catch {
    throw new Error("Network error — cannot reach backend");
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error("unauthorized");
  }

  if (!resp.ok) {
    let message = `HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      message = data.detail || message;
    } catch { }
    throw new Error(message);
  }

  return resp.json();
};

export const updateViolation = async (violationId, formData) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  
  let resp;
  try {
    resp = await fetch(`${API}/admin/api/violations/${violationId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData, // FormData object
    });
  } catch {
    throw new Error("Network error — cannot reach backend");
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error("unauthorized");
  }

  if (!resp.ok) {
    let message = `HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      message = data.detail || message;
    } catch { }
    throw new Error(message);
  }

  return resp.json();
};

export const updateViolationStatus = async (violationId, status) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('status', status);
  
  let resp;
  try {
    resp = await fetch(`${API}/admin/api/violations/${violationId}/status`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Don't set Content-Type - let browser set it for FormData
      },
      body: formData,
    });
  } catch {
    throw new Error("Network error — cannot reach backend");
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error("unauthorized");
  }

  if (!resp.ok) {
    let message = `HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      message = data.detail || message;
    } catch { }
    throw new Error(message);
  }

  return resp.json();
};