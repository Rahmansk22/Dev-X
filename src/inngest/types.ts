// ✅ FIX: Reduced from 30min to 10min to free E2B quota for parallel users
// E2B Hobby plan allows ~5 concurrent sandboxes. Shorter TTL = faster slot recycling.
export const SANDBOX_TIMEOUT = 60_000 * 30; // 30 minutes
