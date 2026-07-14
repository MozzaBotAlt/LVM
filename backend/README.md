# Beyond the Beaker — Payment & Paywall Backend

Drop-in Node/Express backend that stores **paid user accounts in Neon Postgres**,
sells **packages/features**, takes payment through **Malaysian banks (FPX)**, and
enforces a **3 free runs** paywall.

## Files

| File          | What it does                                                        |
|---------------|---------------------------------------------------------------------|
| `db.js`       | Neon Postgres connection (uses `DATABASE_URL`).                     |
| `schema.sql`  | Table definitions (`paid_users`, `payments`, `usage_counters`).    |
| `plans.js`    | Your packages/prices and the free-run limit (`FREE_RUN_LIMIT = 3`).|
| `paywall.js`  | Quota logic + `requirePaidOrFreeRun` Express middleware.           |
| `payments.js` | FPX/card checkout (ToyyibPay) + webhook + activation.              |
| `index.js`    | Express router exposing all `/api/*` endpoints.                    |

## Install

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
```

The three tables are **already created** in your connected Neon database. To
recreate them elsewhere: `npm run init-db`.

## Plug into your existing backend

```js
const paymentApi = require("./backend"); // this folder
app.use(paymentApi);                       // adds every /api/* route below
```

Or run it on its own: `node backend/index.js` (listens on `PORT`, default 4000).

## Endpoints

| Method + path                | Purpose                                        |
|------------------------------|------------------------------------------------|
| `GET  /api/plans`            | List packages + free run limit.                |
| `GET  /api/paywall/status`   | Free runs left (send `x-client-id` header).    |
| `POST /api/paywall/consume`  | Use one free run; `402` when exhausted.        |
| `POST /api/payments/create`  | Start payment, returns bank `redirectUrl`.     |
| `POST /api/payments/callback`| Gateway webhook (set this in ToyyibPay).       |
| `GET  /api/payments/:id/status` | Poll a payment's status.                    |

## Enforcing the paywall

**Option A — middleware** (blocks a route entirely):

```js
const { requirePaidOrFreeRun } = require("./backend/paywall");
app.post("/api/run-simulator", requirePaidOrFreeRun, (req, res) => {
  // req.paywall = { runsUsed, runsLeft, paid, ... }
  res.json({ ok: true });
});
```

**Option B — call from the frontend** each time a simulator runs
(`POST /api/paywall/consume`). A ready-made client helper lives at
`frontend/paywall.js`.

## Connecting a bank (FPX)

The default gateway is **ToyyibPay**, which is free to register and supports FPX
online banking for every major Malaysian bank plus cards.

1. Create an account at https://toyyibpay.com and create a *Category*.
2. Put `TOYYIBPAY_SECRET_KEY` and `TOYYIBPAY_CATEGORY_CODE` in `.env`.
3. Set your callback URL in ToyyibPay to `<BACKEND_URL>/api/payments/callback`.

Prefer Billplz/senangPay/Stripe? Replace `createGatewayBill()` in `payments.js`
— the rest of the flow (DB records, activation, paywall) stays the same. Set
`PAYMENT_GATEWAY=manual` to exercise the whole flow with no real gateway.

## How a purchase flows

1. Frontend `POST /api/payments/create` → we insert a `pending` row in
   `payments` and ask the gateway for a bill.
2. User is redirected to their **bank/FPX** page to pay.
3. Gateway calls `POST /api/payments/callback` → we mark the payment `paid` and
   upsert the buyer into **`paid_users`** with an expiry based on the plan.
4. That email is now a paid user, so the paywall stops counting their runs.
