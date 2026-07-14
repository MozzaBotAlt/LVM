/* Payment / pricing page logic. */
(function () {
  var API_BASE = (window.BTB_API_BASE || "https://lvm-backend-j0ws.onrender.com/").replace(/\/?$/, "/");

  var plansGrid = document.getElementById("plansGrid");
  var plansLoading = document.getElementById("plansLoading");
  var quotaPill = document.getElementById("quotaPill");
  var freeLimitText = document.getElementById("freeLimitText");

  var overlay = document.getElementById("checkoutOverlay");
  var closeBtn = document.getElementById("checkoutClose");
  var form = document.getElementById("checkoutForm");
  var planLine = document.getElementById("checkoutPlanLine");
  var totalEl = document.getElementById("checkoutTotal");
  var errorEl = document.getElementById("checkoutError");
  var submitBtn = document.getElementById("checkoutSubmit");
  var bankSelect = document.getElementById("bank");

  var selectedPlan = null;

  function money(cents, currency) {
    return (currency || "MYR") + " " + (cents / 100).toFixed(2);
  }

  // --- Load packages (API first, fallback to bundled plans.js) ---
  async function loadPlans() {
    var data = window.BTB_PLANS || { plans: [], freeRunLimit: 3 };
    try {
      var res = await fetch(API_BASE + "api/plans");
      if (res.ok) {
        var json = await res.json();
        if (json && json.plans && json.plans.length) data = json;
      }
    } catch (e) {
      /* offline: use bundled fallback */
    }
    if (freeLimitText && data.freeRunLimit) freeLimitText.textContent = data.freeRunLimit;
    renderPlans(data.plans);
  }

  function renderPlans(plans) {
    if (plansLoading) plansLoading.remove();
    plansGrid.innerHTML = "";
    plans.forEach(function (plan) {
      var card = document.createElement("article");
      card.className = "plan-card" + (plan.highlight ? " is-highlight" : "");

      var features = (plan.features || [])
        .map(function (f) {
          return (
            '<li><i class="fa-solid fa-check" aria-hidden="true"></i><span>' +
            escapeHtml(f) +
            "</span></li>"
          );
        })
        .join("");

      card.innerHTML =
        (plan.highlight ? '<span class="plan-badge">Best value</span>' : "") +
        '<h3 class="plan-name">' + escapeHtml(plan.name) + "</h3>" +
        '<p class="plan-desc">' + escapeHtml(plan.description) + "</p>" +
        '<div class="plan-price"><span class="amount">' +
        money(plan.amount_cents, plan.currency) +
        '</span><span class="interval">/ ' + escapeHtml(plan.interval) + "</span></div>" +
        '<ul class="plan-features">' + features + "</ul>" +
        '<button class="btn plan-cta" type="button">Choose ' + escapeHtml(plan.name) + "</button>";

      card.querySelector(".plan-cta").addEventListener("click", function () {
        openCheckout(plan);
      });
      plansGrid.appendChild(card);
    });
  }

  // --- Free-run quota banner ---
  async function loadQuota() {
    if (!window.BTBPaywall) return;
    var q = await BTBPaywall.status();
    if (q.paid) {
      quotaPill.textContent = "You have an active subscription — enjoy unlimited access!";
      quotaPill.className = "quota-pill is-paid";
    } else if (q.runsLeft > 0) {
      quotaPill.textContent =
        q.runsLeft + " of " + q.limit + " free runs remaining" + (q.offline ? " (offline estimate)" : "");
      quotaPill.className = "quota-pill";
    } else {
      quotaPill.textContent = "You have used all your free runs. Subscribe to keep going.";
      quotaPill.className = "quota-pill is-blocked";
    }
    var email = BTBPaywall.getEmail();
    if (email) document.getElementById("email").value = email;
  }

  // --- Checkout dialog ---
  function openCheckout(plan) {
    selectedPlan = plan;
    planLine.textContent = plan.name + " — " + plan.description;
    totalEl.textContent = money(plan.amount_cents, plan.currency);
    errorEl.hidden = true;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      document.getElementById("fullName").focus();
    }, 50);
  }
  function closeCheckout() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }
  closeBtn.addEventListener("click", closeCheckout);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeCheckout();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) closeCheckout();
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!selectedPlan) return;
    var fullName = document.getElementById("fullName").value.trim();
    var email = document.getElementById("email").value.trim();
    var bank = bankSelect.value;

    if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter your name and a valid email.");
      return;
    }

    if (window.BTBPaywall) BTBPaywall.setEmail(email);
    setLoading(true);

    try {
      var res = await fetch(API_BASE + "api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, fullName: fullName, planId: selectedPlan.id, bank: bank }),
      });
      var data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.message || "Could not start payment. Please try again.");
      }
      // Off to the bank / FPX page.
      window.location.href = data.redirectUrl;
    } catch (err) {
      showError(
        err.message +
          " (Make sure the payment backend and gateway are configured.)"
      );
      setLoading(false);
    }
  });

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.innerHTML = on
      ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Redirecting…'
      : '<i class="fa-solid fa-building-columns" aria-hidden="true"></i> Pay securely';
  }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  loadPlans();
  loadQuota();
})();
