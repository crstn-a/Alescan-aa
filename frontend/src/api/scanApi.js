const API = import.meta.env.VITE_API_URL

/**
 * Send a captured image blob to POST /scan.
 *
 * Returns one of:
 *   { ok: true,  data: { product, commodity_name, category, specification, unit, confidence, confidence_level, price_prevailing, price_low, price_high, price_average, period_month, period_year, source } }
 *   { ok: false, type: 'low_confidence', confidence, confidence_level, message }
 *   { ok: false, type: 'no_price',       message }
 *   { ok: false, type: 'network',        message }
 */
export async function scanImage(blob, locationData = null) {
  const form = new FormData()
  form.append('image', blob, 'scan.jpg')

  if (locationData) {
    if (locationData.latitude !== undefined && locationData.latitude !== null) {
      form.append('latitude', String(locationData.latitude))
    }
    if (locationData.longitude !== undefined && locationData.longitude !== null) {
      form.append('longitude', String(locationData.longitude))
    }
    if (locationData.location_accuracy !== undefined && locationData.location_accuracy !== null) {
      form.append('location_accuracy', String(locationData.location_accuracy))
    }
    if (locationData.client_scanned_at) {
      form.append('client_scanned_at', String(locationData.client_scanned_at))
    }
  }

  let resp
  try {
    resp = await fetch(`${API}/scan`, { method: 'POST', body: form })
  } catch {
    return { ok: false, type: 'network', message: 'No connection — check your internet' }
  }

  if (resp.ok) {
    const data = await resp.json()
    return { ok: true, data }
  }

  if (resp.status === 422) {
    const { detail } = await resp.json()
    return {
      ok: false,
      type: 'low_confidence',
      confidence: detail.confidence,
      confidence_level: detail.confidence_level || 'Low',
      message: detail.message,
    }
  }

  if (resp.status === 404) {
    return { ok: false, type: 'no_price', message: 'Price data not synced yet from DA Google Sheet' }
  }

  try {
    const errData = await resp.json()
    if (errData && errData.detail) {
      const msg = typeof errData.detail === 'string' ? errData.detail : (errData.detail.message || JSON.stringify(errData.detail))
      return { ok: false, type: 'server_error', message: msg }
    }
  } catch {
    // fallback if response body is not JSON
  }

  return { ok: false, type: 'network', message: `Server error ${resp.status}` }
}

/** Fetch current monitored prices for all commodities (used by admin dashboard) */
export async function getAllPrices() {
  const resp = await fetch(`${API}/prices`)
  if (!resp.ok) throw new Error('Failed to load prices')
  return resp.json()
}