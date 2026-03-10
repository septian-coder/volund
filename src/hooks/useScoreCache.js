// ── Score Cache Hook ──────────────────────────────────────────────────────────
// Stores onchain data + claimed badges in localStorage per wallet address.
// TTL: 60 minutes. After TTL, data is stale (background refresh kicks in).

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const PREFIX = "volund_cache_";

function cacheKey(address) {
  return PREFIX + address?.toLowerCase();
}

export function readCache(address) {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(cacheKey(address));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.timestamp) return null;
    const age = Date.now() - data.timestamp;
    return { ...data, stale: age > CACHE_TTL_MS, ageMs: age };
  } catch {
    return null;
  }
}

export function writeCache(address, payload) {
  if (!address) return;
  try {
    const entry = {
      timestamp: Date.now(),
      onchainData: payload.onchainData ?? null,
      claimedBadges: payload.claimedBadges ?? {},
      social: payload.social ?? {},
    };
    localStorage.setItem(cacheKey(address), JSON.stringify(entry));
  } catch {
    // localStorage might be full or unavailable — fail silently
  }
}

export function clearCache(address) {
  if (!address) return;
  try {
    localStorage.removeItem(cacheKey(address));
  } catch {}
}

/** Returns a friendly age string: "just now", "5 min ago", "1h ago" */
export function formatCacheAge(ageMs) {
  if (!ageMs || ageMs < 60_000) return "just now";
  const mins = Math.floor(ageMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
