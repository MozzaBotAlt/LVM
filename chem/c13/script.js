// State Management
const state = {
  selectedExperiment: null,
  chamberContents: [],
  chamberColor: 'transparent',
  isHeated: false,
  isMixed: false,
  hasGoggles: false,
  temperature: 20,
  messages: [],
  status: 'idle' // 'idle' | 'success' | 'failed'
};

// DOM Elements
const elements = {
  welcomeModal: document.getElementById('welcomeModal'),
  failureModal: document.getElementById('failureModal'),
  enterLabBtn: document.getElementById('enterLabBtn'),
  restartBtn: document.getElementById('restartBtn'),
  mainContainer: document.getElementById('mainContainer'),
  gogglesBtn: document.getElementById('gogglesBtn'),
  experimentList: document.getElementById('experimentList'),
  elementSearchInput: document.getElementById('elementSearchInput'),
  elementSearchBtn: document.getElementById('elementSearchBtn'),
  elementSearchResults: document.getElementById('elementSearchResults'),
  procedureSection: document.getElementById('procedureSection'),
  procedureSteps: document.getElementById('procedureSteps'),
  placeholderContent: document.getElementById('placeholderContent'),
  workspaceContent: document.getElementById('workspaceContent'),
  reactantsPanel: document.getElementById('reactantsPanel'),
  reactionChamber: document.getElementById('reactionChamber'),
  chamberContents: document.getElementById('chamberContents'),
  chamberBubbles: document.getElementById('chamberBubbles'),
  chamberFlame: document.getElementById('chamberFlame'),
  notebookContent: document.getElementById('notebookContent'),
  timeDisplay: document.getElementById('timeDisplay'),
  shakeBtn: document.getElementById('shakeBtn'),
  waterBathBtn: document.getElementById('waterBathBtn'),
  burnerBtn: document.getElementById('burnerBtn'),
  emptyBtn: document.getElementById('emptyBtn'),
  failureMessage: document.getElementById('failureMessage')
};

// Initialize the app
function init() {
  setupEventListeners();
  renderExperiments();
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);
}

// Event listeners
function setupEventListeners() {
  elements.enterLabBtn.addEventListener('click', enterLab);
  elements.restartBtn.addEventListener('click', exitFailure);
  elements.gogglesBtn.addEventListener('click', toggleGoggles);
  elements.shakeBtn.addEventListener('click', () => mixChamber());
  elements.waterBathBtn.addEventListener('click', () => heatChamber('bath'));
  elements.burnerBtn.addEventListener('click', () => heatChamber('burner'));
  elements.emptyBtn.addEventListener('click', resetLab);
  elements.elementSearchBtn.addEventListener('click', searchElements);
  elements.elementSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchElements();
    }
  });
}

// Welcome Modal
function enterLab() {
  elements.welcomeModal.classList.add('hidden');
  elements.mainContainer.classList.remove('hidden');
  state.hasGoggles = true;
  updateGogglesButton();
  addLog('Safety goggles put on.', 'success');
}

// Goggles Toggle
function toggleGoggles() {
  if (state.selectedExperiment === null) return;

  state.hasGoggles = !state.hasGoggles;
  const msg = state.hasGoggles ? "Safety goggles put on." : "Safety goggles removed. Warning: Eye hazard!";
  addLog(msg, state.hasGoggles ? 'success' : 'warning');
  updateGogglesButton();
}

function updateGogglesButton() {
  elements.gogglesBtn.textContent = state.hasGoggles ? '✓ Goggles ON' : '✗ Goggles OFF';
  elements.gogglesBtn.classList.toggle('active', state.hasGoggles);
}

function generateAllPairExperiments(elementsList) {
  const experiments = [];
  const symbols = elementsList.map(el => el.symbol);

  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const symbolA = symbols[i];
      const symbolB = symbols[j];
      const elementA = elementsList.find(el => el.symbol === symbolA);
      const elementB = elementsList.find(el => el.symbol === symbolB);
      const id = `${symbolA.toLowerCase()}_${symbolB.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');
      const reactionColor = blendColors(elementA.color, elementB.color);

      experiments.push({
        id,
        name: `${elementA.name} + ${elementB.name}`,
        equation: `${symbolA} + ${symbolB} -> ${symbolA}${symbolB}`,
        description: `Simulate a two-reactant reaction between ${elementA.name} and ${elementB.name}.`,
        reactants: [symbolA, symbolB],
        products: [`${symbolA}${symbolB}`],
        requiresHeat: false,
        requiresWaterBath: false,
        reactantColors: {
          [symbolA]: elementA.color,
          [symbolB]: elementB.color
        },
        reactionColor,
        productColors: {
          [`${symbolA}${symbolB}`]: reactionColor
        },
        steps: [
          `Add ${elementA.name} to the reaction chamber`,
          `Add ${elementB.name} to the reaction chamber`,
          `Mix the reactants`,
          `Observe the reaction`
        ]
      });
    }
  }

  return experiments;
}

function blendColors(colorA, colorB) {
  const rgbA = parseHexColor(colorA);
  const rgbB = parseHexColor(colorB);
  return `rgb(${Math.round((rgbA[0] + rgbB[0]) / 2)}, ${Math.round((rgbA[1] + rgbB[1]) / 2)}, ${Math.round((rgbA[2] + rgbB[2]) / 2)})`;
}

function parseHexColor(hex) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  if (normalized.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  return [255, 255, 255];
}

// Generate all possible two-reactant element experiments from the dataset only when no experiments are defined
if (Array.isArray(ELEMENTS.elements) && (!Array.isArray(ELEMENTS.experiments) || ELEMENTS.experiments.length === 0)) {
  ELEMENTS.experiments = generateAllPairExperiments(ELEMENTS.elements);
}

// Element search
function searchElements() {
  const query = elements.elementSearchInput.value.trim().toLowerCase();
  const results = query.length === 0
    ? []
    : ELEMENTS.elements.filter(el => {
        return el.symbol.toLowerCase().includes(query)
          || el.name.toLowerCase().includes(query)
          || (el.state && el.state.toLowerCase().includes(query));
      });
  renderElementSearchResults(results, query);
}

function renderElementSearchResults(results, query) {
  elements.elementSearchResults.innerHTML = '';

  if (!query) {
    elements.elementSearchResults.innerHTML = '<p class="search-hint">Type any element name or symbol and press Search.</p>';
    return;
  }

  if (results.length === 0) {
    elements.elementSearchResults.innerHTML = '<p class="search-hint">No elements found for that query.</p>';
    return;
  }

  results.forEach(element => {
    const card = document.createElement('div');
    card.className = 'search-card';
    card.innerHTML = `
      <div class="search-row">
        <div>
          <h4>${element.name} (${element.symbol})</h4>
          <span>Atomic number: ${element.atomicNumber}</span>
          <span>State: ${element.state}</span>
        </div>
        <div class="search-color" style="background:${element.color};"></div>
      </div>
    `;
    elements.elementSearchResults.appendChild(card);
  });
}

// Experiment Rendering
function renderExperiments() {
  elements.experimentList.innerHTML = '';

  ELEMENTS.experiments.forEach(exp => {
    const btn = document.createElement('button');
    btn.className = 'experiment-btn';
    btn.innerHTML = `
      <span class="name">${exp.name}</span>
      <span class="desc">${exp.equation}</span>
    `;
    btn.addEventListener('click', (e) => selectExperiment(exp.id, e));
    elements.experimentList.appendChild(btn);
  });
}

// Select Experiment
function selectExperiment(experimentId, event) {
  state.selectedExperiment = experimentId;

  // Update UI
  document.querySelectorAll('.experiment-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.experiment-btn').classList.add('active');

  // Show procedure
  const experiment = ELEMENTS.experiments.find(exp => exp.id === experimentId);
  elements.procedureSection.style.display = 'flex';
  elements.procedureSteps.innerHTML = '';
  experiment.steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    elements.procedureSteps.appendChild(li);
  });

  // Reset lab
  resetLab();

  // Render reactants
  renderReactants(experiment);

  // Show workspace
  elements.placeholderContent.style.display = 'none';
  elements.workspaceContent.classList.remove('hidden');

  addLog(`Selected ${experiment.name}.`, 'info');
}

// Render Reactants based on selected experiment
function renderReactants(experiment) {
  elements.reactantsPanel.innerHTML = '';

  experiment.reactants.forEach(reactantSymbol => {
    const element = ELEMENTS.elements.find(el => el.symbol === reactantSymbol);
    if (element) {
      const bottle = createReactantBottle(element);
      elements.reactantsPanel.appendChild(bottle);
    }
  });
}

// Create Reactant Bottle Button
function createReactantBottle(element) {
  const btn = document.createElement('button');
  btn.className = 'reagent-bottle';
  btn.disabled = state.status === 'failed';
  btn.innerHTML = `
    <div class="bottle-visual" style="background: ${element.color}"></div>
    <span class="bottle-label">${element.symbol} - ${element.name}</span>
  `;
  btn.addEventListener('click', () => addReactant(element.symbol));
  return btn;
}

// Add Reactant to Chamber
function addReactant(reactantSymbol) {
  if (state.status === 'failed') return;

  if (!state.hasGoggles) {
    addLog("Warning: Handling chemicals without safety goggles!", 'warning');
  }

  state.chamberContents.push(reactantSymbol);

  // Update chamber color
  const newColor = calculateChamberColor();
  state.chamberColor = newColor;
  updateChamberColor();

  const element = ELEMENTS.elements.find(el => el.symbol === reactantSymbol);
  addLog(`Added ${element.name} (${element.symbol})`, 'info');

  // Check reaction
  setTimeout(() => checkReaction('add'), 100);
}

// Calculate Chamber Color
function calculateChamberColor() {
  if (state.chamberContents.length === 0) return 'transparent';

  const first = state.chamberContents[0];
  const element = ELEMENTS.elements.find(el => el.symbol === first);
  if (element) {
    return element.color;
  }
  return '#f1f5f9';
}

// Heat Chamber
function heatChamber(method) {
  if (state.status === 'failed') return;

  if (!state.hasGoggles) {
    failExperiment("Safety Violation: Heating substances without eye protection is dangerous!");
    return;
  }

  state.isHeated = true;
  state.temperature = method === 'burner' ? 100 : 80;
  addLog(`Heating chamber using ${method === 'burner' ? 'Bunsen Burner' : 'Water Bath'}...`, 'info');
  updateChamberVisuals();

  setTimeout(() => checkReaction('heat'), 1500);
}

// Mix Chamber
function mixChamber() {
  if (state.status === 'failed') return;

  state.isMixed = true;
  addLog("Mixing reactants in chamber...", 'info');

  // Visual mix animation
  elements.reactionChamber.style.animation = 'none';
  setTimeout(() => {
    elements.reactionChamber.style.animation = 'shake 0.5s';
  }, 10);

  updateChamberVisuals();

  setTimeout(() => {
    state.isMixed = false;
    checkReaction('mix');
  }, 1000);
}

// Reset Lab
function resetLab() {
  state.chamberContents = [];
  state.chamberColor = 'transparent';
  state.isHeated = false;
  state.isMixed = false;
  state.temperature = 20;
  state.status = 'idle';

  updateChamberColor();
  updateChamberVisuals();

  // Clear notebook except for experiment selection
  const lastMsg = state.messages[state.messages.length - 1];
  if (lastMsg && lastMsg.type === 'info' && lastMsg.text.includes('Selected')) {
    // Keep only the selection message
    state.messages = [lastMsg, { id: Date.now().toString(), text: "--- Lab Reset ---", type: 'info' }];
  } else {
    state.messages.push({ id: Date.now().toString(), text: "--- Lab Reset ---", type: 'info' });
  }

  renderNotebook();
}

// Check Reaction Logic
function checkReaction(trigger) {
  const experiment = ELEMENTS.experiments.find(exp => exp.id === state.selectedExperiment);
  if (!experiment) return;

  const allPresent = experiment.reactants.every(symbol => state.chamberContents.includes(symbol));
  if (!allPresent) return;

  if (experiment.requiresHeat && !(state.isHeated || trigger === 'heat')) {
    addLog('This reaction needs heat to proceed.', 'warning');
    return;
  }

  if (state.status === 'success') return;

  state.chamberColor = experiment.reactionColor || blendReactionColor(experiment.reactants);
  updateChamberColor();

  if (experiment.requiresHeat) {
    elements.chamberFlame.style.display = 'block';
  }

  const productNames = experiment.products.join(', ');
  addLog(`Result: ${experiment.name} reacted to form ${productNames}.`, 'success');
  state.status = 'success';
}

function blendReactionColor(reactantSymbols) {
  const colors = reactantSymbols
    .map(symbol => ELEMENTS.elements.find(el => el.symbol === symbol))
    .filter(Boolean)
    .map(el => el.color);

  if (colors.length === 0) return '#ffffff';
  return colors.reduce((acc, next) => blendColors(acc, next));
}

// Update Chamber Color
function updateChamberColor() {
  elements.chamberContents.style.backgroundColor = state.chamberColor;
}

// Update Chamber Visuals
function updateChamberVisuals() {
  elements.chamberFlame.style.display = 'none';
  elements.chamberBubbles.style.display = 'none';

  if (state.isHeated) {
    elements.chamberContents.style.boxShadow = 'inset 0 0 20px rgba(255, 100, 0, 0.5)';
  } else {
    elements.chamberContents.style.boxShadow = 'none';
  }
}

// Fail Experiment
function failExperiment(message) {
  state.status = 'failed';
  elements.failureMessage.textContent = message;
  elements.failureModal.classList.remove('hidden');
  addLog(message, 'danger');
}

// Exit Failure
function exitFailure() {
  elements.failureModal.classList.add('hidden');
  resetLab();
}

// Add Log Message
function addLog(text, type = 'info') {
  const message = {
    id: Date.now().toString(),
    text: text,
    type: type,
    timestamp: new Date().toLocaleTimeString()
  };
  state.messages.push(message);
  renderNotebook();
}

// Render Notebook
function renderNotebook() {
  elements.notebookContent.innerHTML = '';

  if (state.messages.length === 0) {
    elements.notebookContent.innerHTML = '<div class="notebook-placeholder"><p>Actions will be recorded here.</p></div>';
    return;
  }

  state.messages.forEach(message => {
    const entry = document.createElement('div');
    entry.className = `notebook-entry ${message.type}`;
    entry.innerHTML = `
      <span class="timestamp">${message.timestamp}</span>
      <span class="message">${message.text}</span>
    `;
    elements.notebookContent.appendChild(entry);
  });

  // Auto-scroll to bottom
  elements.notebookContent.scrollTop = elements.notebookContent.scrollHeight;
}

// Update Time Display
function updateTimeDisplay() {
  const now = new Date();
  elements.timeDisplay.textContent = now.toLocaleTimeString();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);