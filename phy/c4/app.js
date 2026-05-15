/* app.js - Vanilla JS port of the React app and simulation */
(function () {
  const state = {
    mode: "motor",
    inputMagnitude: 50,
    magneticField: 50,
    reverseInput: false,
    reverseMagnets: false,
    isPlaying: true,
  };

  function q(sel, root = document) {
    return root.querySelector(sel);
  }
  function qAll(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  // Setup welcome modal
  function setupWelcomeModal() {
    const enterLabBtn = q('#enterLabBtn');
    const welcomeModal = q('#welcomeModal');
    const mainContainer = q('#mainContainer');
    
    enterLabBtn.addEventListener('click', () => {
      welcomeModal.classList.add('hidden');
      mainContainer.classList.remove('hidden');
      initializeApp();
    });
  }

  function initializeApp() {
    makeDiagrams();
    const canvas = q("#simCanvas");
    const sim = MotorSim(canvas);
    wireEvents(sim);
  }

  function makeDiagrams() {
    const grid = q("#diagramGrid");
    const flemingMotor = `<div class="diagram-card">${flemingSVG("motor")}</div>`;
    const flemingGen = `<div class="diagram-card">${flemingSVG("generator")}</div>`;
    const grip = `<div class="diagram-card">${gripSVG()}</div>`;
    const lenz = `<div class="diagram-card">${lenzSVG()}</div>`;
    const crossdot = `<div class="diagram-card">${crossDotSVG()}</div>`;
    grid.innerHTML = flemingMotor + flemingGen + grip + lenz + crossdot;
  }

  function flemingSVG(mode) {
    const isLeft = mode === "motor";
    const primary = isLeft ? "#c026d3" : "#ea580c";
    const bColor = "#6b7280";
    const iColor = isLeft ? "#0284c7" : "#d97706";
    return `
      <h4>Fleming's ${isLeft ? "Left" : "Right"}-Hand Rule</h4>
      <p>${isLeft ? "(Motor Effect)" : "(Electromagnetic Induction)"}</p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <circle cx="50" cy="50" r="5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
        <line x1="50" y1="50" x2="50" y2="10" stroke="${primary}" stroke-width="6" stroke-linecap="round" />
        <polygon points="43,15 57,15 50,0" fill="${primary}" />
        <line x1="50" y1="50" x2="20" y2="80" stroke="${bColor}" stroke-width="6" stroke-linecap="round" />
        <line x1="50" y1="50" x2="${isLeft ? 85 : 15}" y2="50" stroke="${iColor}" stroke-width="6" stroke-linecap="round" />
      </svg>
    `;
  }
  function gripSVG() {
    return `
      <h4>Right Hand Grip Rule</h4>
      <p>Magnetic Field of a Straight Wire</p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <line x1="50" y1="90" x2="50" y2="10" stroke="#0f172a" stroke-width="8" stroke-linecap="round" />
        <polygon points="42,30 58,30 50,15" fill="#fbbf24" />
        <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="#6b7280" stroke-width="2.5" stroke-dasharray="6 3" />
      </svg>
    `;
  }
  function lenzSVG() {
    return `
      <h4>Lenz's Law</h4>
      <p>Induced current opposes change</p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <rect x="5" y="40" width="25" height="20" fill="#3b82f6" />
        <rect x="30" y="40" width="20" height="20" fill="#ef4444" />
        <ellipse cx="75" cy="50" rx="12" ry="35" fill="none" stroke="#d97706" stroke-width="5" />
      </svg>
    `;
  }
  function crossDotSVG() {
    return `
      <h4>Cross & Dot</h4>
      <p>Current / Arrow Direction</p>
      <div style="display:flex;justify-content:space-around;align-items:center">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style="width:40px;height:40px">
          <line x1="20" y1="20" x2="80" y2="80" stroke="#334155" stroke-width="12" stroke-linecap="round"/>
          <line x1="80" y1="20" x2="20" y2="80" stroke="#334155" stroke-width="12" stroke-linecap="round"/>
        </svg>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style="width:40px;height:40px">
          <circle cx="50" cy="50" r="15" fill="#334155" />
        </svg>
      </div>
    `;
  }

  // Canvas simulation adapted from original React code
  function MotorSim(canvas) {
    const ctx = canvas.getContext("2d");
    let angle = 0;
    let raf = null;
    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 400;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    function render() {
      ctx.clearRect(0, 0, width, height);
      // background
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const InputVal =
        (state.inputMagnitude / 100) * (state.reverseInput ? -1 : 1);
      const B = (state.magneticField / 100) * (state.reverseMagnets ? -1 : 1);
      const rotationalSpeed =
        state.mode === "motor"
          ? state.isPlaying
            ? InputVal * B * 0.25
            : 0
          : state.isPlaying
            ? InputVal * 0.25
            : 0;
      const inducedCurrent =
        state.mode === "generator" ? rotationalSpeed * B : InputVal;
      let I_external =
        state.mode === "motor" ? InputVal : Math.abs(inducedCurrent);

      angle += rotationalSpeed;
      const theta = angle;
      const tilt = Math.PI / 6;

      // draw simple magnets
      function drawMagnet(isNorth, mx) {
        ctx.save();
        ctx.fillStyle = isNorth ? "#ef4444" : "#3b82f6";
        ctx.fillRect(cx + mx - 40, cy - 80, 80, 160);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isNorth ? "N" : "S", cx + mx, cy);
        ctx.restore();
      }
      drawMagnet(!state.reverseMagnets, -240);
      drawMagnet(state.reverseMagnets, 240);

      // simple field lines
      if (state.magneticField > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(107,114,128,0.3)";
        ctx.setLineDash([6, 6]);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(80, 120 + i * 20);
          ctx.lineTo(720, 120 + i * 20);
          ctx.stroke();
        }
        ctx.restore();
      }

      // coil box
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(theta);
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 6;
      ctx.strokeRect(-60, -90, 120, 180);
      ctx.restore();

      // commutator representation
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(cx, cy + 120, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // current markers (cross/dot)
      if (Math.abs(I_external) > 0.01) {
        ctx.save();
        ctx.fillStyle = state.mode === "motor" ? "#0284c7" : "#d97706";
        ctx.beginPath();
        ctx.arc(cx - 40, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", cx - 40, cy);
        ctx.beginPath();
        ctx.fillStyle = state.mode === "motor" ? "#0284c7" : "#d97706";
        ctx.arc(cx + 40, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText("•", cx + 40, cy);
        ctx.restore();
      }

      // simple shaft
      ctx.save();
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 120);
      ctx.lineTo(cx, cy + 140);
      ctx.stroke();
      ctx.restore();

      // legend
      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        state.mode === "motor"
          ? "Fleming's Left-Hand Rule"
          : "Fleming's Right-Hand Rule",
        20,
        height - 20,
      );

      raf = requestAnimationFrame(render);
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(render);
    }
    function stop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }
    start();
    return { start, stop };
  }

  function wireEvents(sim) {
    q("#btn-motor").addEventListener("click", () => {
      state.mode = "motor";
      q("#btn-motor").classList.add("active");
      q("#btn-generator").classList.remove("active");
    });
    q("#btn-generator").addEventListener("click", () => {
      state.mode = "generator";
      q("#btn-generator").classList.add("active");
      q("#btn-motor").classList.remove("active");
    });

    q("#playPause").addEventListener("click", () => {
      state.isPlaying = !state.isPlaying;
      q("#playPause").textContent = state.isPlaying ? "⏸ Pause" : "▶ Play";
    });
    q("#rangeInput").addEventListener("input", (e) => {
      state.inputMagnitude = Number(e.target.value);
      q("#valInput").textContent = state.inputMagnitude + "%";
    });
    q("#rangeB").addEventListener("input", (e) => {
      state.magneticField = Number(e.target.value);
      q("#valB").textContent = state.magneticField + "%";
    });
    q("#revInput").addEventListener("change", (e) => {
      state.reverseInput = e.target.checked;
    });
    q("#revMag").addEventListener("change", (e) => {
      state.reverseMagnets = e.target.checked;
    });
  }

  // init
  document.addEventListener('DOMContentLoaded', setupWelcomeModal);
})();
