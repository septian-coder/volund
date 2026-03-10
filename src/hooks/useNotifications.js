// ── Badge Expire Notifications Hook ──────────────────────────────────────────
// Uses the Browser Notification API to alert users about expiring badges.
// Permission is requested once when the hook is first used.

const WARNED_KEY = "volund_notif_warned_";

/** Request notification permission from the browser (once per session). */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Check badges and fire browser notifications for any expiring within `thresholdDays`.
 * @param {Object} claimedBadges  — { b1: { claimed, daysLeft }, ... }
 * @param {Array}  badges         — BADGES constant array
 * @param {string} walletAddress  — used to avoid duplicate notifications per session
 * @param {number} thresholdDays  — default 7
 */
export function notifyExpiringBadges(claimedBadges, badges, walletAddress, thresholdDays = 7) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  badges.forEach((badge) => {
    const state = claimedBadges[badge.id];
    if (!state?.claimed) return;
    if (state.daysLeft == null) return;
    if (state.daysLeft > thresholdDays) return;

    // Avoid firing the same notification twice in one session
    const warnKey = WARNED_KEY + walletAddress?.slice(-4) + "_" + badge.id;
    if (sessionStorage.getItem(warnKey)) return;
    sessionStorage.setItem(warnKey, "1");

    const isUrgent = state.daysLeft <= 3;
    const title = isUrgent
      ? `⚠️ Badge Expiring Soon — ${badge.name}`
      : `🔔 Badge Reminder — ${badge.name}`;
    const body = isUrgent
      ? `Your "${badge.name}" badge expires in ${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"}! Renew it now to keep your streak.`
      : `Your "${badge.name}" badge expires in ${state.daysLeft} days. Stay active to keep it!`;

    try {
      const notif = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: `volund-badge-${badge.id}`, // groups same badge into one notif
        requireInteraction: isUrgent,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // Notification failed — fail silently
    }
  });
}

/**
 * Returns a summary of expiring badges for an in-app banner (no browser API needed).
 */
export function getExpiringBadges(claimedBadges, badges, thresholdDays = 7) {
  return badges.filter((badge) => {
    const state = claimedBadges[badge.id];
    return state?.claimed && state.daysLeft != null && state.daysLeft <= thresholdDays;
  });
}
