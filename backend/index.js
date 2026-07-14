/**
 * Beyond the Beaker — payment & paywall backend.
 *
 * Plug into your existing Express app in ONE line:
 *
 *   const paymentApi = require("./backend");   // this folder
 *   app.use(paymentApi);                        // mounts all /api/* routes
 *
 * ...or run it standalone:
 *
 *   node backend/index.js                       // starts on PORT (default 4000)
 *
 * All endpoints:
 *   GET  /api/plans                 -> available packages + free run limit
 *   GET  /api/paywall/status        -> how many free runs are left (no consume)
 *   POST /api/paywall/consume       -> consume one free run (402 when exhausted)
 *   POST /api/payments/create       -> start a payment, returns bank redirect URL
 *   POST /api/payments/callback     -> gateway webhook (server-to-server)
 *   GET  /api/payments/:id/status   -> poll a payment's status
 */

const express = require("express");
const { PLANS, FREE_RUN_LIMIT } = require("./plans");
const { checkQuota, consumeRun } = require("./paywall");
const { createPayment, handleCallback, getPaymentStatus } = require("./payments");

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true })); // gateway callbacks post form data

// --- Basic CORS so the static frontend on Vercel can call this backend. ---
router.use((req, res, next) => {
  const origin = process.env.PUBLIC_SITE_URL || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Content-Type, x-client-id, x-user-email");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// List packages for the payment page.
router.get("/api/plans", (_req, res) => {
  res.json({ plans: Object.values(PLANS), freeRunLimit: FREE_RUN_LIMIT });
});

// Read-only quota check (used to render "X free runs left").
router.get("/api/paywall/status", async (req, res, next) => {
  try {
    const clientId = req.header("x-client-id") || req.query.clientId;
    const email = req.header("x-user-email") || req.query.email;
    const result = await checkQuota({ clientId, email });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Consume one run. Frontend calls this each time the user runs a simulator.
router.post("/api/paywall/consume", async (req, res, next) => {
  try {
    const clientId = req.header("x-client-id") || req.body.clientId;
    const email = req.header("x-user-email") || req.body.email;
    const result = await consumeRun({ clientId, email });
    if (!result.allowed) {
      return res.status(402).json({
        error: "payment_required",
        message: "You have used all your free runs. Please subscribe to continue.",
        ...result,
      });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Start a payment -> returns { redirectUrl } to send the user to their bank.
router.post("/api/payments/create", async (req, res, next) => {
  try {
    const { email, fullName, planId, bank } = req.body;
    const result = await createPayment({ email, fullName, planId, bank });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Gateway webhook (ToyyibPay/Billplz post here after payment).
router.post("/api/payments/callback", async (req, res) => {
  try {
    await handleCallback(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[payments] callback error:", err.message);
    res.status(200).send("OK"); // always 200 so the gateway stops retrying
  }
});

// Poll payment status from the success page.
router.get("/api/payments/:id/status", async (req, res, next) => {
  try {
    const payment = await getPaymentStatus(Number(req.params.id));
    if (!payment) return res.status(404).json({ error: "not_found" });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// --- Standalone mode: `node backend/index.js` ---
if (require.main === module) {
  const app = express();
  app.use(router);
  app.use((err, _req, res, _next) => {
    console.error("[backend] error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  });
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`[backend] payment API listening on :${port}`));
}
