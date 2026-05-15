class NuclearSimulator {
  constructor() {
    this.isRunning = false;
    this.controlRods = 0;

    this.temperature = 25;
    this.steamPressure = 0;
    this.turbineSpeed = 0;
    this.powerOutput = 0;
    this.activeTab = "plant";

    this.startBtn = document.getElementById("startBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.scramBtn = document.getElementById("scramBtn");
    this.controlSlider = document.getElementById("controlSlider");
    this.tabButtons = document.querySelectorAll(".tab-btn");

    this.tempBadge = document.getElementById("tempBadge");
    this.powerBadge = document.getElementById("powerBadge");
    this.tempDisplay = document.getElementById("tempDisplay");
    this.pressureDisplay = document.getElementById("pressureDisplay");
    this.speedDisplay = document.getElementById("turbineSpeed");
    this.powerDisplay = document.getElementById("powerDisplay");
    this.rodValue = document.getElementById("rodValue");
    this.reactorStatus = document.getElementById("reactorStatus");
    this.alertBox = document.getElementById("alertBox");
    this.reactorInterior = document.getElementById("reactorInterior");
    this.turbine = document.querySelector(".turbine");
    this.generator = document.getElementById("generator");
    this.steamParticles = document.getElementById("steamParticles");

    this.controlRods1 = document.getElementById("controlRod1");
    this.controlRods2 = document.getElementById("controlRod2");
    this.controlRods3 = document.getElementById("controlRod3");
    this.controlRods4 = document.getElementById("controlRod4");
    this.controlRods5 = document.getElementById("controlRod5");
    this.controlRodElements = [
      this.controlRods1,
      this.controlRods2,
      this.controlRods3,
      this.controlRods4,
      this.controlRods5,
    ];

    this.procedureSteps = document.getElementById("procedureSteps");
    this.notebookContent = document.getElementById("notebookContent");
    this.notebookTimeDisplay = document.getElementById("notebookTimeDisplay");
    this.notebookEntries = [];
    this.procedureStepsData = [
      "Start the reactor and initialize monitoring systems.",
      "Withdraw control rods slowly to increase fission rate.",
      "Observe temperature, pressure, and power output.",
      "Adjust control rods to maintain stable operation.",
      "Use SCRAM immediately if temperature rises too high.",
    ];

    this.setupEventListeners();
    this.renderProcedure();
    this.renderNotebook();
    this.updateDisplay();
    this.startSimulationLoop();
  }

  setupEventListeners() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stopBtn.addEventListener("click", () => this.stop());
    this.scramBtn.addEventListener("click", () => this.scram());
    this.controlSlider.addEventListener("input", (e) =>
      this.setControlRods(e.target.value),
    );
    this.controlSlider.addEventListener("change", (e) =>
      this.logNotebook(`Control rods adjusted to ${Math.round(e.target.value)}%.`, "info"),
    );

    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchTab(e.target.dataset.tab, e.currentTarget),
      );
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.style.display = "none";
    this.stopBtn.style.display = "block";
    this.controlSlider.disabled = false;
    this.logNotebook("Reactor started and control systems are active.", "success");
    this.updateDisplay();
  }

  stop() {
    this.isRunning = false;
    this.startBtn.style.display = "block";
    this.stopBtn.style.display = "none";
    this.controlSlider.disabled = true;
    this.logNotebook("Reactor stopped. Systems are cooling down.", "warning");
    this.updateDisplay();
  }

  scram() {
    this.controlRods = 0;
    this.isRunning = false;
    this.controlSlider.value = 0;
    this.startBtn.style.display = "block";
    this.stopBtn.style.display = "none";
    this.controlSlider.disabled = true;
    this.showAlert("⚠️ SCRAM activated! Reactor shut down for safety.");
    this.logNotebook("SCRAM triggered. Reactor has been safely shut down.", "danger");
    this.updateDisplay();
  }

  setControlRods(value) {
    this.controlRods = parseFloat(value);
    this.updateDisplay();
  }

  switchTab(tab, clickedButton) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    this.tabButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    document.getElementById(tab).classList.add("active");
    clickedButton.classList.add("active");

    this.activeTab = tab;
    this.logNotebook(`Switched display to ${tab} view.`, "info");
  }

  updateControlRodVisuals() {
    this.controlRodElements.forEach((rod) => {
      const topPosition = this.controlRods * 0.8;
      rod.style.top = `${topPosition}%`;
    });
  }

  updateReactorColor() {
    if (this.temperature > 300) {
      this.reactorInterior.style.backgroundColor = `rgba(239, 68, 68, ${Math.min((this.temperature - 100) / 200, 0.3)})`;
    } else if (this.temperature > 100) {
      const intensity = (this.temperature - 100) / 200;
      this.reactorInterior.style.backgroundColor = `rgba(245, 158, 11, ${intensity * 0.2})`;
    } else {
      this.reactorInterior.style.backgroundColor = `rgba(59, 130, 246, 0.1)`;
    }
  }

  updateTurbineVisuals() {
    if (this.turbineSpeed > 100) {
      this.turbine.classList.add("spinning");
      this.turbine.style.animationDuration = `${Math.max(0.5, 2 - this.steamPressure / 100)}s`;
    } else {
      this.turbine.classList.remove("spinning");
    }
  }

  updateSteamParticles() {
    this.steamParticles.innerHTML = "";

    if (this.isRunning && this.temperature > 100) {
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement("div");
        particle.className = "steam-particle";
        particle.style.left = i * 10 + "%";
        particle.style.animation = `steamFlow ${Math.max(0.5, 2 - this.steamPressure / 100)}s linear infinite`;
        particle.style.animationDelay = i * 0.1 + "s";
        this.steamParticles.appendChild(particle);
      }
    }
  }

  updateDisplay() {
    this.rodValue.textContent = Math.round(this.controlRods) + "%";

    this.tempBadge.textContent = `🌡️ ${Math.round(this.temperature)} °C`;
    this.tempBadge.classList.remove("hot", "warm");
    if (this.temperature > 300) {
      this.tempBadge.classList.add("hot");
    } else if (this.temperature > 100) {
      this.tempBadge.classList.add("warm");
    }

    this.powerBadge.textContent = `⚡ ${Math.round(this.powerOutput)} MW`;

    this.tempDisplay.textContent = Math.round(this.temperature) + " °C";
    this.pressureDisplay.textContent = Math.round(this.steamPressure) + " bar";
    this.speedDisplay.textContent = Math.round(this.turbineSpeed) + " RPM";
    this.powerDisplay.textContent = Math.round(this.powerOutput) + " MW";

    this.reactorStatus.textContent = this.isRunning
      ? "🟢 Online"
      : "⭕ Offline";
    this.reactorStatus.style.color = this.isRunning
      ? "var(--accent-emerald)"
      : "var(--text-secondary)";

    this.updateControlRodVisuals();
    this.updateReactorColor();
    this.updateTurbineVisuals();
    this.updateSteamParticles();

    if (this.temperature < 300 && this.powerOutput < 1200) {
      this.alertBox.style.display = "none";
    }
  }

  showAlert(message) {
    this.alertBox.textContent = message;
    this.alertBox.style.display = "block";
  }

  renderProcedure() {
    if (!this.procedureSteps) return;
    this.procedureSteps.innerHTML = "";
    this.procedureStepsData.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      this.procedureSteps.appendChild(li);
    });
  }

  logNotebook(message, type = "info") {
    if (!this.notebookContent) return;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    this.notebookEntries.push({ timestamp, message, type });
    if (this.notebookEntries.length > 80) {
      this.notebookEntries.shift();
    }
    if (this.notebookTimeDisplay) {
      this.notebookTimeDisplay.textContent = timestamp;
    }
    this.renderNotebook();
  }

  renderNotebook() {
    if (!this.notebookContent) return;
    this.notebookContent.innerHTML = "";
    if (!this.notebookEntries.length) {
      this.notebookContent.innerHTML =
        '<div class="notebook-placeholder"><p>Actions will be recorded here.</p></div>';
      return;
    }

    this.notebookEntries.forEach((entry) => {
      const entryEl = document.createElement("div");
      entryEl.className = `notebook-entry ${entry.type}`;
      entryEl.innerHTML = `<span class="timestamp">${entry.timestamp}</span>${entry.message}`;
      this.notebookContent.appendChild(entryEl);
    });
    this.notebookContent.scrollTop = this.notebookContent.scrollHeight;
  }

  startSimulationLoop() {
    setInterval(() => {
      if (this.isRunning) {
        const targetTemp = 25 + this.controlRods * 3.5;
        const tempDiff = targetTemp - this.temperature;
        this.temperature += tempDiff * 0.05;

        const targetPressure =
          this.temperature > 100 ? (this.temperature - 100) * 0.8 : 0;
        const pressureDiff = targetPressure - this.steamPressure;
        this.steamPressure += pressureDiff * 0.1;

        const targetSpeed = this.steamPressure * 12;
        const friction = this.turbineSpeed * 0.05;
        this.turbineSpeed += (targetSpeed - this.turbineSpeed) * 0.1 - friction;

        const targetPower = Math.max(0, (this.turbineSpeed / 3000) * 1200);
        this.powerOutput += (targetPower - this.powerOutput) * 0.1;

        if (this.temperature > 350) {
          this.showAlert(
            "⚠️ CRITICAL: Temperature exceeding safe limits! Activate SCRAM!",
          );
        }
      } else {
        this.temperature -= (this.temperature - 25) * 0.05;
        this.steamPressure -= this.steamPressure * 0.1;
        this.turbineSpeed -= this.turbineSpeed * 0.05;
        this.powerOutput -= this.powerOutput * 0.2;
      }

      this.updateDisplay();
    }, 100);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NuclearSimulator();
});
