const state = {
  method: "gas",
  heatLocation: "none",
  syringe: "100_glass",
  startMethod: "pour",
  temp: 25,
  conc: 1,
  isRunning: false,
  time: 0,
  data: [],
};

const maxVolume = 100;
let timerInterval = null;

const methodBtns = document.querySelectorAll(".method-btn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const tempSlider = document.getElementById("tempSlider");
const concSlider = document.getElementById("concSlider");
const startMethodSelect = document.getElementById("startMethod");
const heatLocationSelect = document.getElementById("heatLocation");
const syringeSelect = document.getElementById("syringe");
const syringeContainer = document.getElementById("syringeContainer");
const diagramContainer = document.getElementById("diagramContainer");
const chartCanvas = document.getElementById("chartCanvas");
const enterLabBtn = document.getElementById("enterLabBtn");
const welcomeModal = document.getElementById("welcomeModal");
const mainContainer = document.getElementById("mainContainer");
const workspaceContent = document.getElementById("workspaceContent");
const placeholderContent = document.getElementById("placeholderContent");

methodBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const method = e.target.dataset.method;
    state.method = method;
    syringeContainer.style.display = method === "gas" ? "block" : "none";
    resetSimulation();
    updateUI();
  });
});

startBtn.addEventListener("click", startSimulation);
resetBtn.addEventListener("click", resetSimulation);
tempSlider.addEventListener("input", (e) => {
  state.temp = Number(e.target.value);
  document.getElementById("tempValue").textContent = state.temp;
});
concSlider.addEventListener("input", (e) => {
  state.conc = Number(e.target.value);
  document.getElementById("concValue").textContent = state.conc.toFixed(1);
});
startMethodSelect.addEventListener("change", (e) => {
  state.startMethod = e.target.value;
  if (state.isRunning) resetSimulation();
});
heatLocationSelect.addEventListener("change", (e) => {
  state.heatLocation = e.target.value;
  if (state.isRunning) resetSimulation();
});
syringeSelect.addEventListener("change", (e) => {
  state.syringe = e.target.value;
  if (state.isRunning) resetSimulation();
});

function calculateValue(t) {
  let k = 0.05 * state.conc * Math.exp((state.temp - 25) * 0.05);

  if (state.heatLocation === "top") k *= 0.5;
  if (state.heatLocation === "middle") k *= 0.8;
  if (state.heatLocation === "base") k *= 1.2;

  let value = 0;

  if (state.method === "gas") {
    value = maxVolume * (1 - Math.exp(-k * t));

    if (state.startMethod === "pour") {
      value -= 5;
    }
    if (value < 0) value = 0;

    if (state.syringe === "50_plastic") {
      if (value > 50) value = 50;
      value = Math.floor(value / 2) * 2;
    }
  } else if (state.method === "mass") {
    value = 100 - maxVolume * 0.01 * (1 - Math.exp(-k * t));
  } else {
    value = 100 * Math.exp(-k * t * 0.5);
  }
  return Number(value.toFixed(2));
}

function startSimulation() {
  if (state.isRunning) return;
  resetSimulation();
  // reveal workspace on first start
  if (workspaceContent && placeholderContent) {
    workspaceContent.classList.remove("hidden");
    placeholderContent.classList.add("hidden");
  }
  state.isRunning = true;
  startBtn.disabled = true;
  tempSlider.disabled = true;
  concSlider.disabled = true;
  startMethodSelect.disabled = true;
  heatLocationSelect.disabled = true;
  syringeSelect.disabled = true;

  timerInterval = setInterval(() => {
    state.time++;
    if (state.time >= 100) {
      state.isRunning = false;
      clearInterval(timerInterval);
    }
    if (state.time <= 100) {
      state.data.push({ time: state.time, value: calculateValue(state.time) });
    }
    updateUI();
  }, 100);
}

function resetSimulation() {
  state.isRunning = false;
  state.time = 0;
  state.data = [];
  if (timerInterval) clearInterval(timerInterval);
  startBtn.disabled = false;
  tempSlider.disabled = false;
  concSlider.disabled = false;
  startMethodSelect.disabled = false;
  heatLocationSelect.disabled = false;
  syringeSelect.disabled = false;
  updateUI();
}

function updateUI() {
  methodBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.method === state.method);
  });

  document.getElementById("timeDisplay").textContent = state.time + "s";
  document.getElementById("readingDisplay").textContent =
    state.data.length > 0 ? state.data[state.data.length - 1].value : 0;
  document.getElementById("statusDisplay").textContent = state.isRunning
    ? "Running"
    : state.time >= 100
      ? "Complete"
      : "Ready";

  renderDiagram();
  renderChart();
}

function getYAxisLabel() {
  if (state.method === "gas") return "Volume (cm³)";
  if (state.method === "mass") return "Mass (g)";
  return "Light Trans. (%)";
}

function renderDiagram() {
  diagramContainer.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "flask-diagram");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("width", "200");
  svg.setAttribute("height", "200");

  const liquidColor =
    state.method === "cross"
      ? state.isRunning
        ? "#cbd5e1"
        : "#e2e8f0"
      : "#bae6fd";
  const liquidPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  liquidPath.setAttribute(
    "d",
    "M 85 110 L 115 110 L 140 170 C 145 185 135 190 120 190 L 80 190 C 65 190 55 185 60 170 Z",
  );
  liquidPath.setAttribute("fill", liquidColor);
  svg.appendChild(liquidPath);

  if (state.isRunning && state.method !== "cross") {
    const bubbles = [
      { cx: 95, cy: 170, r: 3 },
      { cx: 105, cy: 150, r: 4 },
      { cx: 90, cy: 130, r: 2 },
      { cx: 110, cy: 160, r: 3 },
    ];
    bubbles.forEach((bubble) => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", bubble.cx);
      circle.setAttribute("cy", bubble.cy);
      circle.setAttribute("r", bubble.r);
      circle.setAttribute("fill", "#fff");
      circle.classList.add("animate-pulse");
      svg.appendChild(circle);
    });
  }

  const flaskPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  flaskPath.setAttribute(
    "d",
    "M 85 50 L 115 50 L 115 100 L 150 180 C 160 200 140 200 120 200 L 80 200 C 60 200 40 200 50 180 L 85 100 Z",
  );
  flaskPath.setAttribute("fill", "none");
  flaskPath.setAttribute("stroke", "#475569");
  flaskPath.setAttribute("stroke-width", "3");
  svg.appendChild(flaskPath);

  if (state.method === "mass") {
    const ellipse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse",
    );
    ellipse.setAttribute("cx", "100");
    ellipse.setAttribute("cy", "50");
    ellipse.setAttribute("rx", "20");
    ellipse.setAttribute("ry", "10");
    ellipse.setAttribute("fill", "#f8fafc");
    ellipse.setAttribute("stroke", "#cbd5e1");
    ellipse.setAttribute("stroke-width", "2");
    ellipse.setAttribute("stroke-dasharray", "2 2");
    svg.appendChild(ellipse);
  }

  if (state.method === "gas") {
    const bungPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    bungPath.setAttribute("d", "M 80 40 L 120 40 L 115 60 L 85 60 Z");
    bungPath.setAttribute("fill", "#334155");
    svg.appendChild(bungPath);

    const tubePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    tubePath.setAttribute(
      "d",
      "M 100 70 L 100 20 L 180 20 L 180 30 L 110 30 L 110 70 Z",
    );
    tubePath.setAttribute("fill", "#e2e8f0");
    tubePath.setAttribute("stroke", "#94a3b8");
    svg.appendChild(tubePath);
  }

  if (state.heatLocation !== "none") {
    const heatPositions = {
      base: { top: "85%", left: "50%" },
      middle: { top: "65%", left: "40%" },
      top: { top: "45%", left: "40%" },
    };
    const pos = heatPositions[state.heatLocation];
    const flameGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    const flame = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    flame.setAttribute("d", "M 10 20 Q 5 10 8 0 Q 12 10 15 5 Q 18 15 20 20 Z");
    flame.setAttribute("fill", "#f97316");
    flameGroup.appendChild(flame);
    flameGroup.classList.add("animate-pulse");
    flameGroup.style.position = "absolute";
    flameGroup.style.top = pos.top;
    flameGroup.style.left = pos.left;
    flameGroup.style.transform = "translate(-50%, -50%)";
    flameGroup.style.width = "24px";
    flameGroup.style.height = "24px";
    diagramContainer.appendChild(flameGroup);
  }

  if (state.method === "cross") {
    const eyeGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    const eyePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    eyePath.setAttribute(
      "d",
      "M 0 10 Q -5 5 -5 0 Q -5 -5 0 -10 Q 5 -5 5 0 Q 5 5 0 10 Z M 0 2 C -2 2 -3 1 -3 0 C -3 -1 -2 -2 0 -2 C 2 -2 3 -1 3 0 C 3 1 2 2 0 2 Z",
    );
    eyePath.setAttribute("fill", "#475569");
    eyeGroup.appendChild(eyePath);
    eyeGroup.style.position = "absolute";
    eyeGroup.style.top = "10%";
    eyeGroup.style.left = "50%";
    eyeGroup.style.transform = "translate(-50%, -50%)";
    eyeGroup.style.width = "24px";
    eyeGroup.style.height = "24px";
    diagramContainer.appendChild(eyeGroup);
  }

  if (state.method === "cross") {
    const crossDiv = document.createElement("div");
    crossDiv.style.position = "absolute";
    crossDiv.style.top = "75%";
    crossDiv.style.left = "50%";
    crossDiv.style.transform = "translate(-50%, -50%) rotate(-12deg)";
    crossDiv.style.backgroundColor = "white";
    crossDiv.style.padding = "1rem";
    crossDiv.style.borderRadius = "0.375rem";
    crossDiv.style.opacity = "0.5";
    crossDiv.style.fontWeight = "bold";
    crossDiv.style.fontSize = "2.25rem";
    crossDiv.textContent = "X";
    diagramContainer.appendChild(crossDiv);
  }

  if (state.method === "mass") {
    const scaleDiv = document.createElement("div");
    scaleDiv.style.position = "absolute";
    scaleDiv.style.top = "80%";
    scaleDiv.style.left = "50%";
    scaleDiv.style.transform = "translate(-50%, -50%)";
    scaleDiv.style.backgroundColor = "#3f3f46";
    scaleDiv.style.padding = "1rem";
    scaleDiv.style.borderRadius = "0.5rem";
    scaleDiv.style.borderBottom = "4px solid #27272a";
    scaleDiv.style.width = "12rem";
    scaleDiv.style.height = "3rem";
    scaleDiv.style.display = "flex";
    scaleDiv.style.alignItems = "center";
    scaleDiv.style.justifyContent = "center";

    const display = document.createElement("div");
    display.style.backgroundColor = "#d1fae5";
    display.style.color = "#065f46";
    display.style.fontFamily = "monospace";
    display.style.fontSize = "1.25rem";
    display.style.padding = "0.25rem 1rem";
    display.style.borderRadius = "0.375rem";
    display.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1)";
    display.textContent = state.isRunning ? "---.--" : "0.00";
    display.textContent += " g";
    scaleDiv.appendChild(display);
    diagramContainer.appendChild(scaleDiv);
  }

  diagramContainer.appendChild(svg);
}

function renderChart() {
  const ctx = chartCanvas.getContext("2d");
  const rect = chartCanvas.getBoundingClientRect();
  chartCanvas.width = rect.width;
  chartCanvas.height = rect.height;

  const padding = 60;
  const width = chartCanvas.width - padding * 2;
  const height = chartCanvas.height - padding * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = padding + (i * height) / 10;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(chartCanvas.width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, chartCanvas.height - padding);
  ctx.lineTo(chartCanvas.width - padding, chartCanvas.height - padding);
  ctx.stroke();

  ctx.fillStyle = "#475569";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Time (s)", chartCanvas.width / 2, chartCanvas.height - 20);

  ctx.save();
  ctx.translate(20, chartCanvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(getYAxisLabel(), 0, 0);
  ctx.restore();

  ctx.textAlign = "right";
  ctx.font = "11px sans-serif";
  let maxValue = 100;
  if (state.data.length > 0) {
    maxValue = Math.max(...state.data.map((d) => d.value)) * 1.1 || 100;
  }

  for (let i = 0; i <= 10; i++) {
    const value = (maxValue * (10 - i)) / 10;
    const y = padding + (i * height) / 10;
    ctx.fillStyle = "#64748b";
    ctx.fillText(value.toFixed(0), padding - 10, y + 4);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  for (let i = 0; i <= 10; i++) {
    const x = padding + (i * width) / 10;
    ctx.fillText((i * 10).toString(), x, chartCanvas.height - padding + 20);
  }

  if (state.data.length > 0) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.beginPath();

    state.data.forEach((point, index) => {
      const x = padding + (point.time / 100) * width;
      const y =
        chartCanvas.height - padding - (point.value / maxValue) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }
}

updateUI();
window.addEventListener("resize", updateUI);

if (enterLabBtn) {
  enterLabBtn.addEventListener("click", () => {
    if (welcomeModal) welcomeModal.classList.add("hidden");
    if (mainContainer) mainContainer.classList.remove("hidden");
    updateUI();
  });
}