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
export async function scanImage(blob) {
  const form = new FormData()
  form.append('image', blob, 'scan.jpg')

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

  return { ok: false, type: 'network', message: `Server error ${resp.status}` }
}

/** Fetch current monitored prices for all commodities (used by admin dashboard) */
export async function getAllPrices() {
  const resp = await fetch(`${API}/prices`)
  if (!resp.ok) throw new Error('Failed to load prices')
  return resp.json()
}