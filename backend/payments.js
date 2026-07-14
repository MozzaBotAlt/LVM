/**
 * Payments + bank (FPX) integration.
 *
 * Default gateway: ToyyibPay (https://toyyibpay.com) — a Malaysian gateway that
 * supports FPX online banking (Maybank, CIMB, Public Bank, etc.) and cards.
 * It is free to sign up and ideal for a student project. The same pattern works
 * for Billplz, Stripe, senangPay, etc. — swap out `createGatewayBill`.
 *
 * Required env vars (see .env.example):
 *   DATABASE_URL             -> Neon connection string
 *   PAYMENT_GATEWAY          -> "toyyibpay" (default) | "manual"
 *   TOYYIBPAY_SECRET_KEY     -> from your ToyyibPay account
 *   TOYYIBPAY_CATEGORY_CODE  -> a category you create in ToyyibPay
 *   TOYYIBPAY_BASE_URL       -> https://toyyibpay.com  (or https://dev.toyyibpay.com for sandbox)
 *   PUBLIC_SITE_URL          -> https://lvm-psi.vercel.app  (where to send users back)
 *   BACKEND_URL              -> public URL of THIS backend (for the callback)
 */

const { sql } = require("./db");
const { getPlan } = require("./plans");

const GATEWAY = process.env.PAYMENT_GATEWAY || "toyyibpay";
const TOYYIBPAY_BASE_URL = process.env.TOYYIBPAY_BASE_URL || "https://toyyibpay.com";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://lvm-psi.vercel.app";
const BACKEND_URL = process.env.BACKEND_URL || "";

/**
 * Create a payment for a plan and return a URL the user should be redirected to
 * in order to pay at their bank (FPX) or by card.
 *
 * @param {object} p
 * @param {string} p.email     buyer email (becomes the paid_users key)
 * @param {string} p.fullName  buyer name
 * @param {string} p.planId    one of the plan ids in plans.js
 * @param {string} [p.bank]    FPX bank code the user picked (optional; the
 *                             gateway also shows a bank list)
 * @returns {Promise<{paymentId:number, redirectUrl:string, billCode:string}>}
 */
async function createPayment({ email, fullName, planId, bank }) {
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  if (!email) throw new Error("email is required");

  // 1) Record a pending payment first so we always have a trail.
  const inserted = await sql`
    INSERT INTO payments (email, full_name, plan, amount_cents, currency, bank, gateway, status)
    VALUES (${email}, ${fullName || null}, ${plan.id}, ${plan.amount_cents}, ${plan.currency}, ${bank || null}, ${GATEWAY}, 'pending')
    RETURNING id
  `;
  const paymentId = inserted[0].id;

  // 2) Ask the gateway to create a bill and give us a payment URL.
  if (GATEWAY === "manual") {
    // No gateway configured — return an internal confirm URL you can wire up.
    const redirectUrl = `${PUBLIC_SITE_URL}/payment/success.html?ref=manual-${paymentId}`;
    await sql`UPDATE payments SET gateway_ref = ${"manual-" + paymentId}, updated_at = now() WHERE id = ${paymentId}`;
    return { paymentId, redirectUrl, billCode: "manual-" + paymentId };
  }

  const { billCode, redirectUrl } = await createGatewayBill({ plan, email, fullName, paymentId });

  await sql`
    UPDATE payments
    SET bill_code = ${billCode}, gateway_ref = ${billCode}, updated_at = now()
    WHERE id = ${paymentId}
  `;

  return { paymentId, redirectUrl, billCode };
}

/** Create a bill at ToyyibPay and return its hosted payment page URL. */
async function createGatewayBill({ plan, email, fullName, paymentId }) {
  const secret = process.env.TOYYIBPAY_SECRET_KEY;
  const category = process.env.TOYYIBPAY_CATEGORY_CODE;
  if (!secret || !category) {
    throw new Error(
      "ToyyibPay not configured. Set TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE (or set PAYMENT_GATEWAY=manual).",
    );
  }

  const form = new URLSearchParams({
    userSecretKey: secret,
    categoryCode: category,
    billName: `BTB ${plan.name}`.slice(0, 30),
    billDescription: plan.description.slice(0, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(plan.amount_cents), // ToyyibPay expects amount in cents
    billReturnUrl: `${PUBLIC_SITE_URL}/payment/success.html`,
    billCallbackUrl: `${BACKEND_URL}/api/payments/callback`,
    billExternalReferenceNo: String(paymentId),
    billTo: fullName || "",
    billEmail: email,
    billPhone: "0000000000",
    billPaymentChannel: "0", // 0 = FPX + card, 1 = card only, 2 = FPX only
  });

  const resp = await fetch(`${TOYYIBPAY_BASE_URL}/index.php/api/createBill`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await resp.json();
  const billCode = Array.isArray(data) && data[0] && data[0].BillCode;
  if (!billCode) {
    throw new Error(`ToyyibPay createBill failed: ${JSON.stringify(data)}`);
  }
  return { billCode, redirectUrl: `${TOYYIBPAY_BASE_URL}/${billCode}` };
}

/**
 * Handle the gateway callback (server-to-server). Marks the payment paid and
 * upserts the paid_users row. ToyyibPay posts: refno, status (1=success),
 * billcode, order_id (our payment id), amount.
 */
async function handleCallback(body) {
  const paymentId = Number(body.order_id || body.billExternalReferenceNo);
  const statusCode = String(body.status);
  const billCode = body.billcode || body.billCode;

  if (!paymentId) throw new Error("callback missing order_id");

  const rows = await sql`SELECT * FROM payments WHERE id = ${paymentId} LIMIT 1`;
  const payment = rows[0];
  if (!payment) throw new Error(`callback: unknown payment ${paymentId}`);

  const paid = statusCode === "1"; // ToyyibPay: 1 success, 2 pending, 3 failed

  await sql`
    UPDATE payments
    SET status = ${paid ? "paid" : "failed"},
        gateway_ref = ${billCode || payment.gateway_ref},
        updated_at = now()
    WHERE id = ${paymentId}
  `;

  if (paid) {
    await activatePaidUser(payment, billCode);
  }
  return { paid, paymentId };
}

/** Create/refresh the paid_users record after a successful payment. */
async function activatePaidUser(payment, ref) {
  const plan = getPlan(payment.plan);
  const durationDays = plan?.durationDays ?? 365;

  await sql`
    INSERT INTO paid_users (email, full_name, plan, status, amount_cents, currency, bank, payment_ref, starts_at, expires_at)
    VALUES (
      ${payment.email}, ${payment.full_name}, ${payment.plan}, 'active',
      ${payment.amount_cents}, ${payment.currency}, ${payment.bank},
      ${ref || payment.gateway_ref}, now(), now() + (${durationDays} || ' days')::interval
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name   = EXCLUDED.full_name,
      plan        = EXCLUDED.plan,
      status      = 'active',
      amount_cents= EXCLUDED.amount_cents,
      currency    = EXCLUDED.currency,
      bank        = EXCLUDED.bank,
      payment_ref = EXCLUDED.payment_ref,
      starts_at   = now(),
      expires_at  = now() + (${durationDays} || ' days')::interval,
      updated_at  = now()
  `;
}

/** Look up the latest payment status for polling from the frontend. */
async function getPaymentStatus(paymentId) {
  const rows = await sql`SELECT id, email, plan, status, amount_cents, currency FROM payments WHERE id = ${paymentId} LIMIT 1`;
  return rows[0] || null;
}

module.exports = {
  createPayment,
  handleCallback,
  activatePaidUser,
  getPaymentStatus,
};
