// frontend/src/api/adminApi.js
const API = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'alescan_admin_token'

export function saveToken(token)  { sessionStorage.setItem(TOKEN_KEY, token) }
export function clearToken()      { sessionStorage.removeItem(TOKEN_KEY) }
export function hasToken()        { return !!sessionStorage.getItem(TOKEN_KEY) }

async function adminFetch(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const resp = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (resp.status === 401 || resp.status === 403) throw new Error('unauthorized')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export async function loginAdmin(username, password) {
  const resp = await fetch(`${API}/admin/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (resp.status === 401) {
    const data = await resp.json()
    throw new Error(data.detail || 'Incorrect username or password')
  }
  if (!resp.ok) throw new Error(`Server error ${resp.status}`)
  return resp.json()
}

// Accurate overview counts — uses /admin/stats endpoint
export const getStats        = ()            => adminFetch('/admin/api/stats')
export const triggerSync     = ()            => adminFetch('/admin/api/sync', { method: 'POST' })
export const getScanLogs     = (limit = 50)  => adminFetch(`/admin/api/logs/scan?limit=${limit}`)
export const getSyncLogs     = (limit = 20)  => adminFetch(`/admin/api/logs/sync?limit=${limit}`)
export const getErrorLogs    = (limit = 20)  => adminFetch(`/admin/api/logs/errors?limit=${limit}`)
export const getPriceRecords = ()            => fetch(`${API}/prices`).then(r => r.json())