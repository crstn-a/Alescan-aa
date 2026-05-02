import { API } from "./config";

export async function scanImage(blob) {
  const form = new FormData();
  form.append('image', blob, 'scan.jpg');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let resp;

  try {
    resp = await fetch(`${API}/scan`, {
      method: 'POST',
      body: form,
      signal: controller.signal
    });
  } catch {
    return { ok: false, type: 'network', message: 'Connection failed or timed out' };
  } finally {
    clearTimeout(timeout);
  }

  if (resp.ok) {
    const data = await resp.json();
    return { ok: true, data };
  }

  if (resp.status === 422) {
    const { detail } = await resp.json();
    return {
      ok: false,
      type: 'low_confidence',
      confidence: detail.confidence,
      message: detail.message,
    };
  }

  if (resp.status === 404) {
    return { ok: false, type: 'no_price', message: 'Price data not synced yet' };
  }

  let message = `Server error ${resp.status}`;
  try {
    const data = await resp.json();
    message = data.detail || message;
  } catch {}

  return { ok: false, type: 'network', message };
}

export async function getAllPrices() {
  const resp = await fetch(`${API}/prices`);
  if (!resp.ok) throw new Error('Failed to load prices');
  return resp.json();
}