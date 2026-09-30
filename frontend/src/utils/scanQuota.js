// frontend/src/utils/scanQuota.js
/**
 * Utility for managing guest scanning limits and trials.
 * Guests get 5 free scans. When consumed, they must sign up as a registered user
 * to unlock more scanning tries, report price concerns, and search all commodity prices.
 */

const GUEST_SCANS_KEY = 'alescan_guest_scans_used';
export const GUEST_MAX_SCANS = 5;

/**
 * Returns how many guest scans have been used so far.
 * @returns {number}
 */
export function getGuestScansUsed() {
  try {
    const raw = localStorage.getItem(GUEST_SCANS_KEY);
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  } catch {
    return 0;
  }
}

/**
 * Returns the number of remaining free scans for a guest (0 to GUEST_MAX_SCANS).
 * @returns {number}
 */
export function getGuestScansRemaining() {
  const used = getGuestScansUsed();
  return Math.max(0, GUEST_MAX_SCANS - used);
}

/**
 * Increments the guest scan count by 1 (up to GUEST_MAX_SCANS).
 * Returns the updated used count.
 * @returns {number}
 */
export function consumeGuestScan() {
  try {
    const current = getGuestScansUsed();
    const next = Math.min(GUEST_MAX_SCANS, current + 1);
    localStorage.setItem(GUEST_SCANS_KEY, String(next));
    return next;
  } catch {
    return GUEST_MAX_SCANS;
  }
}

/**
 * Checks if the guest has exhausted their free trial of 5 scans.
 * @returns {boolean}
 */
export function hasExceededGuestLimit() {
  return getGuestScansUsed() >= GUEST_MAX_SCANS;
}

/**
 * Reset guest scans (useful for debugging/testing).
 */
export function resetGuestScans() {
  try {
    localStorage.removeItem(GUEST_SCANS_KEY);
  } catch {}
}
