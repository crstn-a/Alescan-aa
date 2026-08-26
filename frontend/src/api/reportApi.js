// frontend/src/api/reportApi.js
// API client for public user authentication and vendor report submission.

import { API } from "./config";

const USER_TOKEN_KEY = 'alescan_user_token';
const USER_DATA_KEY  = 'alescan_user_data';

// ── Token management ─────────────────────────────────────────────────
export function saveUserToken(token) {
  localStorage.setItem(USER_TOKEN_KEY, token);
}

export function clearUserToken() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

export function hasUserToken() {
  return !!localStorage.getItem(USER_TOKEN_KEY);
}

export function getUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function saveUserData(user) {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

export function getUserData() {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ── Authenticated fetch helper ───────────────────────────────────────
async function userFetch(path, options = {}) {
  const token = getUserToken();

  let resp;
  try {
    resp = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Network error — cannot reach server");
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

// ── Register ─────────────────────────────────────────────────────────
export async function registerUser({ first_name, last_name, email, password, phone }) {
  let resp;
  try {
    resp = await fetch(`${API}/api/reports/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, email, password, phone }),
    });
  } catch {
    throw new Error("Network error — cannot reach server");
  }

  if (resp.status === 409) {
    const data = await resp.json();
    throw new Error(data.detail || 'An account with this email already exists');
  }

  if (!resp.ok) {
    let message = `Server error ${resp.status}`;
    try {
      const data = await resp.json();
      message = data.detail || message;
    } catch { }
    throw new Error(message);
  }

  return resp.json();
}

// ── Login ────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  let resp;
  try {
    resp = await fetch(`${API}/api/reports/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Network error — cannot reach server");
  }

  if (resp.status === 401) {
    const data = await resp.json();
    throw new Error(data.detail || 'Incorrect email or password');
  }

  if (!resp.ok) {
    throw new Error(`Server error ${resp.status}`);
  }

  return resp.json();
}

// ── Submit Report ────────────────────────────────────────────────────
export async function submitReport(formData) {
  const token = getUserToken();

  let resp;
  try {
    resp = await fetch(`${API}/api/reports/submit`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch {
    throw new Error("Network error — cannot reach server");
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

// ── My Reports ───────────────────────────────────────────────────────
export function getMyReports() {
  return userFetch('/api/reports/my-reports');
}
