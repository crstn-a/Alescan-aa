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
    } catch {}
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
export const getStats        = () => adminFetch('/admin/api/stats');
export const triggerSync     = () => adminFetch('/admin/api/sync', { method: 'POST' });
export const getScanLogs     = (limit = 50) => adminFetch(`/admin/api/logs/scan?limit=${limit}`);
export const getSyncLogs     = (limit = 20) => adminFetch(`/admin/api/logs/sync?limit=${limit}`);
export const getErrorLogs    = (limit = 20) => adminFetch(`/admin/api/logs/errors?limit=${limit}`);

// 🔹 Prices (use same handler for consistency)
export const getPriceRecords = () => adminFetch('/prices');