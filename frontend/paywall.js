/**
 * Beyond the Beaker — default paywall client.
 *
 * Enforces "3 free runs, then pay". Include on ANY page that has a simulator:
 *
 *   <script src="/paywall.js"></script>
 *   <script>
 *     document.getElementById("runBtn").addEventListener("click", async () => {
 *       const ok = await BTBPaywall.guardRun();   // counts a run, or redirects to /payment
 *       if (!ok) return;                            // blocked -> user sent to pricing
 *       startSimulation();                          // your existing code
 *     });
 *   </script>
 *
 * Config (optional, set before this script loads):
 *   window.BTB_API_BASE = "https://your-backend.onrender.com/";
 *   window.BTB_PAYMENT_URL = "/payment/index.html";
 */
(function () {
  var API_BASE = (window.BTB_API_BASE || "https://lvm-backend-j0ws.onrender.com/").replace(/\/?$/, "/");
  var PAYMENT_URL = window.BTB_PAYMENT_URL || "/payment/index.html";
  var FREE_LIMIT = 3;

  // --- Anonymous device id (stable per browser) ---
  function getClientId() {
    var id = null;
    try {
      id = localStorage.getItem("btb_client_id");
      if (!id) {
        id =
          (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
          "c_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        localStorage.setItem("btb_client_id", id);
      }
    } catch (e) {
      id = "c_ephemeral_" + Math.random().toString(36).slice(2);
    }
    return id;
  }

  // The signed-in user's email, if you have one (set after login).
  function getEmail() {
    try {
      return localStorage.getItem("btb_user_email") || "";
    } catch (e) {
      return "";
    }
  }
  function setEmail(email) {
    try {
      localStorage.setItem("btb_user_email", email || "");
    } catch (e) {}
  }

  function headers() {
    return {
      "Content-Type": "application/json",
      "x-client-id": getClientId(),
      "x-user-email": getEmail(),
    };
  }

  // --- Local fallback so the paywall still works if the API is offline ---
  function localCount() {
    try {
      return parseInt(localStorage.getItem("btb_local_runs") || "0", 10);
    } catch (e) {
      return 0;
    }
  }
  function bumpLocal() {
    try {
      var n = localCount() + 1;
      localStorage.setItem("btb_local_runs", String(n));
      return n;
    } catch (e) {
      return FREE_LIMIT + 1; // fail closed
    }
  }

  // --- API calls ---
  async function status() {
    try {
      var res = await fetch(API_BASE + "api/paywall/status", { headers: headers() });
      if (!res.ok) throw new Error("status " + res.status);
      return await res.json();
    } catch (e) {
      var used = localCount();
      return {
        allowed: used < FREE_LIMIT,
        paid: false,
        runsUsed: used,
        runsLeft: Math.max(0, FREE_LIMIT - used),
        limit: FREE_LIMIT,
        offline: true,
      };
    }
  }

  async function consume() {
    try {
      var res = await fetch(API_BASE + "api/paywall/consume", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({}),
      });
      var data = await res.json();
      if (res.status === 402) return Object.assign({ allowed: false }, data);
      if (!res.ok) throw new Error("consume " + res.status);
      return data;
    } catch (e) {
      var used = bumpLocal();
      return {
        allowed: used <= FREE_LIMIT,
        paid: false,
        runsUsed: used,
        runsLeft: Math.max(0, FREE_LIMIT - used),
        limit: FREE_LIMIT,
        offline: true,
      };
    }
  }

  /**
   * Consume one run. Returns true if the user may proceed, false if they are
   * out of free runs (in which case they are redirected to the pricing page).
   */
  async function guardRun(opts) {
    opts = opts || {};
    var result = await consume();
    if (!result.allowed && !result.paid) {
      if (opts.redirect !== false) {
        window.location.href = PAYMENT_URL;
      }
      return false;
    }
    return true;
  }

  window.BTBPaywall = {
    API_BASE: API_BASE,
    PAYMENT_URL: PAYMENT_URL,
    FREE_LIMIT: FREE_LIMIT,
    getClientId: getClientId,
    getEmail: getEmail,
    setEmail: setEmail,
    status: status,
    consume: consume,
    guardRun: guardRun,
  };
})();
