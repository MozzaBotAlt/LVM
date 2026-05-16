// Quiz Questions
const questions = [
  {
    id: 1,
    question:
      "Which of the following is the most accurate definition of osmosis according to the IGCSE/SPM syllabus?",
    options: [
      "The movement of solutes from a high concentration to a low concentration.",
      "The net movement of water molecules from a region of higher water potential to a region of lower water potential, through a partially permeable membrane.",
      "The active transport of water molecules against a concentration gradient.",
      "The movement of water into a cell causing it to burst.",
    ],
    correct: 1,
    explanation:
      "Osmosis is specifically about water movement across a partially permeable membrane in response to water potential differences, not active movement of solutes.",
  },
  {
    id: 2,
    question:
      "An animal cell is placed in a hypertonic solution. What will happen to the cell?",
    options: [
      "The cell will remain unchanged.",
      "The cell will swell and burst (lyse).",
      "The cell will shrivel and crenate.",
      "The cell will absorb the solutes.",
    ],
    correct: 2,
    explanation:
      "In a hypertonic solution (high solute concentration outside), water moves out of the cell, causing it to shrivel. In animal cells, this creates a crenated appearance.",
  },
  {
    id: 3,
    question:
      "What is the role of the partially permeable cell membrane in osmosis?",
    options: [
      "It actively pumps water molecules across itself.",
      "It allows both water and solute molecules to pass through freely.",
      "It allows water molecules to pass through but restricts the passage of larger solute molecules.",
      "It prevents any movement of molecules across it.",
    ],
    correct: 2,
    explanation:
      "The partially permeable membrane is semipermeable - it allows small water molecules through but blocks larger dissolved solutes, creating the conditions for osmosis.",
  },
  {
    id: 4,
    question:
      "A plant cell is placed in a hypotonic solution. What happens to the cell?",
    options: [
      "The cell becomes plasmolysed.",
      "The cell becomes turgid and rigid.",
      "The cell remains flaccid.",
      "The cell wall dissolves.",
    ],
    correct: 1,
    explanation:
      "In a hypotonic solution (low solute concentration outside), water enters the cell by osmosis. The vacuole fills with water, pressing the cytoplasm against the cell wall, making the plant cell turgid and rigid.",
  },
  {
    id: 5,
    question: "What is the relationship between water potential and osmosis?",
    options: [
      "Water potential has no effect on osmosis.",
      "Water always moves from a region of higher water potential to a region of lower water potential.",
      "Water moves from lower to higher water potential.",
      "Water potential only affects plant cells.",
    ],
    correct: 1,
    explanation:
      "This is the fundamental principle: water molecules move by osmosis from regions of higher (less negative) water potential to regions of lower (more negative) water potential.",
  },
];

// State
let state = {
  cellType: "animal",
  externalConcentration: 1.0,
  volumeLevel: 70,
  currentQuestionIndex: 0,
  selectedAnswerIndex: null,
  showExplanation: false,
  score: 0,
  quizFinished: false,
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners();
  updateSimulation();
  renderQuiz();
});

// Event Listeners
function setupEventListeners() {
  // Cell type buttons
  document.querySelectorAll(".cell-type-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const type = this.getAttribute("data-type");
      state.cellType = type;

      document
        .querySelectorAll(".cell-type-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      updateSimulation();
    });
  });

  // Concentration slider
  document
    .getElementById("concentrationSlider")
    .addEventListener("input", function () {
      state.externalConcentration = parseFloat(this.value);
      updateSimulation();
    });

  // Volume slider
  document
    .getElementById("volumeSlider")
    .addEventListener("input", function () {
      state.volumeLevel = parseInt(this.value);
      updateSimulation();
    });

  const enterLabBtn = document.getElementById("enterLabBtn");
  const welcomeModal = document.getElementById("welcomeModal");
  const mainContainer = document.getElementById("mainContainer");

  if (enterLabBtn) {
    enterLabBtn.addEventListener("click", function () {
      if (welcomeModal) welcomeModal.classList.add("hidden");
      if (mainContainer) mainContainer.classList.remove("hidden");
    });
  }
}

// Calculate tonicity based on external concentration
function calculateTonicity(externalConc) {
  const internalConc = 1.0; // Fixed at 1%
  if (externalConc < 0.9) return "hypotonic";
  if (externalConc > 1.1) return "hypertonic";
  return "isotonic";
}

// Update simulation display
function updateSimulation() {
  const tonicity = calculateTonicity(state.externalConcentration);

  // Update concentration display
  document.getElementById("concValue").textContent =
    state.externalConcentration.toFixed(1) + "%";

  // Update tonicity indicator
  let tonicityText = "Equal (Isotonic)";
  let tonicityClass = "text-green-600";
  if (state.externalConcentration < 0.9) {
    tonicityText = "High (Hypotonic)";
    tonicityClass = "text-blue-600";
  } else if (state.externalConcentration > 1.1) {
    tonicityText = "Low (Hypertonic)";
    tonicityClass = "text-red-600";
  }
  const indicator = document.getElementById("tonicityIndicator");
  indicator.textContent = tonicityText;
  indicator.className = tonicityClass + " text-base font-bold";

  // Update volume display
  document.getElementById("volumeValue").textContent =
    state.volumeLevel + " mL";

  // Render cell
  renderCell(tonicity);

  // Update status cards
  updateStatusCards(tonicity);
}

// Render SVG Cell
function renderCell(tonicity) {
  const svg = document.getElementById("cellSvg");
  svg.innerHTML = "";

  const cellColor = state.cellType === "animal" ? "#EFF6FF" : "#DCFCE7";
  const borderColor = state.cellType === "animal" ? "#3B82F6" : "#16A34A";

  if (state.cellType === "animal") {
    // Animal cell (circle)
    const cellShapeScale =
      tonicity === "isotonic" ? 1 : tonicity === "hypertonic" ? 0.75 : 1.1;
    const size = 50 * cellShapeScale;
    const offset = (100 - size) / 2;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", size / 2);
    circle.setAttribute("fill", cellColor);
    circle.setAttribute("stroke", borderColor);
    circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);

    // Add nucleus
    const nucleus = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    nucleus.setAttribute("cx", "50");
    nucleus.setAttribute("cy", "50");
    nucleus.setAttribute("r", "6");
    nucleus.setAttribute("fill", "#9333EA");
    svg.appendChild(nucleus);
  } else {
    // Plant cell (rectangle with curved corners)
    let cellScale = 1;
    let vacuoleScale = 0.6;

    if (tonicity === "hypertonic") {
      cellScale = 0.85;
      vacuoleScale = 0.3;
    } else if (tonicity === "hypotonic") {
      cellScale = 1;
      vacuoleScale = 0.85;
    }

    const size = 60 * cellScale;
    const offset = (100 - size) / 2;

    // Cell wall
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", offset);
    rect.setAttribute("y", offset);
    rect.setAttribute("width", size);
    rect.setAttribute("height", size);
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", cellColor);
    rect.setAttribute("stroke", borderColor);
    rect.setAttribute("stroke-width", "2");
    svg.appendChild(rect);

    // Vacuole
    const vacuoleSize = 30 * vacuoleScale;
    const vacuoleOffset = (100 - vacuoleSize) / 2;
    const vacuole = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    vacuole.setAttribute("cx", "50");
    vacuole.setAttribute("cy", "50");
    vacuole.setAttribute("r", vacuoleSize / 2);
    vacuole.setAttribute("fill", "#BFDBFE");
    vacuole.setAttribute("opacity", "0.6");
    svg.appendChild(vacuole);

    // Nucleus
    const nucleus = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    nucleus.setAttribute("cx", "50");
    nucleus.setAttribute("cy", "35");
    nucleus.setAttribute("r", "4");
    nucleus.setAttribute("fill", "#9333EA");
    svg.appendChild(nucleus);
  }
}

// Update status cards
function updateStatusCards(tonicity) {
  // Tonicity label
  document.getElementById("tonicityLabel").textContent = tonicity;

  // Water flow
  let waterFlowText = "Zero net movement";
  if (tonicity === "hypertonic") {
    waterFlowText = "Moves OUT (Down gradient)";
  } else if (tonicity === "hypotonic") {
    waterFlowText = "Moves IN (Down gradient)";
  }
  document.getElementById("waterFlow").textContent = waterFlowText;

  // Cell condition
  let cellConditionText = "Normal";
  if (state.cellType === "animal") {
    if (tonicity === "isotonic") cellConditionText = "Normal";
    else if (tonicity === "hypertonic") cellConditionText = "Crenated";
    else cellConditionText = "Haemolysed (Burst)";
  } else {
    if (tonicity === "isotonic") cellConditionText = "Flaccid";
    else if (tonicity === "hypertonic") cellConditionText = "Plasmolysed";
    else cellConditionText = "Turgid";
  }
  document.getElementById("cellCondition").textContent = cellConditionText;
}

// Quiz Functions
function renderQuiz() {
  const container = document.getElementById("quizContainer");

  if (state.quizFinished) {
    renderQuizFinished(container);
    return;
  }

  const q = questions[state.currentQuestionIndex];
  container.innerHTML = `
    <div>
      <div class="flex justify-between items-center text-sm font-medium text-gray-400 mb-6">
        <span>Question ${state.currentQuestionIndex + 1} of ${questions.length}</span>
        <span>Score: ${state.score}</span>
      </div>
      
      <h3 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-8 leading-tight">
        ${q.question}
      </h3>

      <div class="flex flex-col gap-3 mb-8" id="optionsContainer">
        ${q.options
          .map(
            (opt, idx) => `
          <button class="quiz-option-btn" data-index="${idx}">
            <span>${opt}</span>
            ${state.showExplanation && idx === q.correct ? "✓" : ""}
            ${state.showExplanation && state.selectedAnswerIndex === idx && idx !== q.correct ? "✗" : ""}
          </button>
        `,
          )
          .join("")}
      </div>

      ${
        state.showExplanation
          ? `
        <div class="quiz-explanation">
          <p class="text-sm text-blue-900 leading-relaxed font-medium">
            <span class="font-bold mr-1">Explanation:</span> ${q.explanation}
          </p>
          <button class="quiz-next-btn" id="nextBtn">
            ${state.currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      `
          : ""
      }
    </div>
  `;

  // Add event listeners
  document.querySelectorAll(".quiz-option-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (!state.showExplanation) {
        const selectedIdx = parseInt(this.getAttribute("data-index"));
        state.selectedAnswerIndex = selectedIdx;
        state.showExplanation = true;
        if (selectedIdx === q.correct) {
          state.score += 1;
        }
        renderQuiz();
      }
    });
  });

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (state.currentQuestionIndex < questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.selectedAnswerIndex = null;
        state.showExplanation = false;
      } else {
        state.quizFinished = true;
      }
      renderQuiz();
    });
  }
}

function renderQuizFinished(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center">
      <div class="text-6xl mb-6">🏆</div>
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
      <p class="text-lg text-gray-600 mb-8">
        You scored <span class="font-bold text-blue-600">${state.score}</span> out of ${questions.length}.
      </p>
      <button id="restartBtn" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors">
        🔄 Retake Quiz
      </button>
    </div>
  `;

  document.getElementById("restartBtn").addEventListener("click", function () {
    state.currentQuestionIndex = 0;
    state.selectedAnswerIndex = null;
    state.showExplanation = false;
    state.score = 0;
    state.quizFinished = false;
    renderQuiz();
  });
}
