/**
 * Paywall: 3 free runs, then payment required.
 *
 * Concept
 * -------
 * - Each visitor gets a "client id" (an anonymous device id generated on the
 *   frontend, or their email once known). We count how many times they run a
 *   simulator in `usage_counters`.
 * - If the visitor is a paid user (row in `paid_users` with an active,
 *   non-expired plan) they are ALWAYS allowed, no counting.
 * - Otherwise they get FREE_RUN_LIMIT (3) runs. The 4th run is blocked with a
 *   402 Payment Required so the frontend can redirect them to /payment.
 */

const { sql } = require("./db");
const { FREE_RUN_LIMIT } = require("./plans");

/** Is this email an active (paid, not expired) user? */
async function isPaidUser(email) {
  if (!email) return false;
  const rows = await sql`
    SELECT 1
    FROM paid_users
    WHERE lower(email) = lower(${email})
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Check quota WITHOUT consuming a run. Useful to render UI state.
 * Returns { allowed, paid, runsUsed, runsLeft, limit }.
 */
async function checkQuota({ clientId, email } = {}) {
  if (await isPaidUser(email)) {
    return { allowed: true, paid: true, runsUsed: 0, runsLeft: Infinity, limit: FREE_RUN_LIMIT };
  }
  const key = clientId || email;
  if (!key) throw new Error("checkQuota requires a clientId or email");

  const rows = await sql`SELECT run_count FROM usage_counters WHERE client_id = ${key} LIMIT 1`;
  const runsUsed = rows.length ? rows[0].run_count : 0;
  const runsLeft = Math.max(0, FREE_RUN_LIMIT - runsUsed);
  return {
    allowed: runsUsed < FREE_RUN_LIMIT,
    paid: false,
    runsUsed,
    runsLeft,
    limit: FREE_RUN_LIMIT,
  };
}

/**
 * Consume one run. Call this right before you let the user actually run a
 * simulator/feature. Returns the same shape as checkQuota, reflecting state
 * AFTER consumption. If the user was already out of free runs it returns
 * allowed:false and does NOT increment.
 */
async function consumeRun({ clientId, email } = {}) {
  if (await isPaidUser(email)) {
    return { allowed: true, paid: true, runsUsed: 0, runsLeft: Infinity, limit: FREE_RUN_LIMIT };
  }
  const key = clientId || email;
  if (!key) throw new Error("consumeRun requires a clientId or email");

  // Atomic upsert + increment, but never beyond the limit.
  const rows = await sql`
    INSERT INTO usage_counters (client_id, email, run_count, last_run_at)
    VALUES (${key}, ${email || null}, 1, now())
    ON CONFLICT (client_id) DO UPDATE
      SET run_count   = usage_counters.run_count + 1,
          last_run_at = now(),
          email       = COALESCE(EXCLUDED.email, usage_counters.email)
    WHERE usage_counters.run_count < ${FREE_RUN_LIMIT}
    RETURNING run_count
  `;

  if (rows.length === 0) {
    // Conflict update was blocked by the WHERE guard => limit already reached.
    return { allowed: false, paid: false, runsUsed: FREE_RUN_LIMIT, runsLeft: 0, limit: FREE_RUN_LIMIT };
  }

  const runsUsed = rows[0].run_count;
  return {
    allowed: true,
    paid: false,
    runsUsed,
    runsLeft: Math.max(0, FREE_RUN_LIMIT - runsUsed),
    limit: FREE_RUN_LIMIT,
  };
}

/**
 * Express middleware. Drop this in front of any protected route.
 *
 *   const { requirePaidOrFreeRun } = require("./backend/paywall");
 *   app.post("/api/run-simulator", requirePaidOrFreeRun, handler);
 *
 * The frontend must send an `x-client-id` header (anonymous device id) and,
 * if the user is logged in, an `x-user-email` header.
 */
async function requirePaidOrFreeRun(req, res, next) {
  try {
    const clientId = req.header("x-client-id") || req.body?.clientId;
    const email = req.header("x-user-email") || req.body?.email;
    const result = await consumeRun({ clientId, email });

    if (!result.allowed) {
      return res.status(402).json({
        error: "payment_required",
        message: "You have used all your free runs. Please subscribe to continue.",
        ...result,
      });
    }
    res.setHeader("x-runs-left", String(result.runsLeft));
    req.paywall = result;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { isPaidUser, checkQuota, consumeRun, requirePaidOrFreeRun };
