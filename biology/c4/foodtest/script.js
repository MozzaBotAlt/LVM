// State Management
const state = {
  selectedTest: null,
  tubeContents: [],
  tubeColor: 'transparent',
  isHeated: false,
  isShaken: false,
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
  procedureSection: document.getElementById('procedureSection'),
  procedureSteps: document.getElementById('procedureSteps'),
  placeholderContent: document.getElementById('placeholderContent'),
  workspaceContent: document.getElementById('workspaceContent'),
  samplesPanel: document.getElementById('samplesPanel'),
  reagentsPanel: document.getElementById('reagentsPanel'),
  testTube: document.getElementById('testTube'),
  tubeLiquid: document.getElementById('tubeLiquid'),
  tubeBubbles: document.getElementById('tubeBubbles'),
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
  elements.shakeBtn.addEventListener('click', () => shakeTube());
  elements.waterBathBtn.addEventListener('click', () => heatTube('bath'));
  elements.burnerBtn.addEventListener('click', () => heatTube('burner'));
  elements.emptyBtn.addEventListener('click', resetLab);
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
  if (state.selectedTest === null) return;

  state.hasGoggles = !state.hasGoggles;
  const msg = state.hasGoggles ? "Safety goggles put on." : "Safety goggles removed. Warning: Eye hazard!";
  addLog(msg, state.hasGoggles ? 'success' : 'warning');
  updateGogglesButton();
}

function updateGogglesButton() {
  elements.gogglesBtn.textContent = state.hasGoggles ? '✓ Goggles ON' : '✗ Goggles OFF';
  elements.gogglesBtn.classList.toggle('active', state.hasGoggles);
}

// Experiment Rendering
function renderExperiments() {
  elements.experimentList.innerHTML = '';

  Object.values(EXPERIMENTS).forEach(exp => {
    const btn = document.createElement('button');
    btn.className = 'experiment-btn';
    btn.innerHTML = `
      <span class="name">${exp.name}</span>
      <span class="desc">${exp.description}</span>
    `;
    btn.addEventListener('click', () => selectTest(exp.id, btn));
    elements.experimentList.appendChild(btn);
  });
}

// Select Test
function selectTest(testId, button) {
  state.selectedTest = testId;

  // Update UI
  document.querySelectorAll('.experiment-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (button) {
    button.classList.add('active');
  }

  // Show procedure
  const experiment = EXPERIMENTS[testId];
  elements.procedureSection.style.display = 'flex';
  elements.procedureSteps.innerHTML = '';
  experiment.steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    elements.procedureSteps.appendChild(li);
  });

  // Reset lab
  resetLab();

  // Render reagents
  renderReagents(experiment);

  // Show workspace
  elements.placeholderContent.style.display = 'none';
  elements.workspaceContent.classList.remove('hidden');

  addLog(`Selected ${experiment.name}.`, 'info');
}

// Render Reagents based on selected test
function renderReagents(experiment) {
  // Always show samples
  elements.samplesPanel.innerHTML = '';
  const sampleReagents = Object.values(REAGENTS).filter(r => r.category === 'sample');
  sampleReagents.forEach(reagent => {
    const bottle = createReagentBottle(reagent);
    elements.samplesPanel.appendChild(bottle);
  });

  // Show relevant test reagents
  elements.reagentsPanel.innerHTML = '';
  const testReagents = experiment.reagents.map(id => REAGENTS[id]);
  testReagents.forEach(reagent => {
    const bottle = createReagentBottle(reagent);
    elements.reagentsPanel.appendChild(bottle);
  });
}

// Create Reagent Bottle Button
function createReagentBottle(reagent) {
  const btn = document.createElement('button');
  btn.className = 'reagent-bottle';
  btn.disabled = state.status === 'failed';
  btn.innerHTML = `
    <div class="bottle-visual" style="background: ${reagent.color}"></div>
    <span class="bottle-label">${reagent.label}</span>
  `;
  btn.addEventListener('click', () => addReagent(reagent.id));
  return btn;
}

// Add Reagent to Tube
function addReagent(reagentId) {
  if (state.status === 'failed') return;

  if (!state.hasGoggles) {
    addLog("Warning: Handling chemicals without safety goggles!", 'warning');
  }

  state.tubeContents.push(reagentId);

  // Update tube color
  const newColor = calculateTubeColor();
  state.tubeColor = newColor;
  updateTubeColor();

  const reagent = REAGENTS[reagentId];
  addLog(`Added ${reagentId.replace('sample_', 'Sample: ')}`, 'info');

  // Check reaction
  setTimeout(() => checkReaction('add'), 100);
}

// Calculate Tube Color
function calculateTubeColor() {
  if (state.tubeContents.length === 0) return 'transparent';

  const first = state.tubeContents[0];
  if (REAGENTS[first]) {
    return REAGENTS[first].color;
  }
  return '#f1f5f9';
}

// Heat Tube
function heatTube(method) {
  if (state.status === 'failed') return;

  if (!state.hasGoggles) {
    failExperiment("Safety Violation: Heating substances without eye protection is dangerous!");
    return;
  }

  // Ethanol safety check
  if (state.tubeContents.includes('ethanol') && method === 'burner') {
    failExperiment("DANGER: Ethanol is highly flammable! Never heat it directly over a Bunsen burner. Use a water bath.");
    return;
  }

  state.isHeated = true;
  state.temperature = method === 'burner' ? 100 : 80;
  addLog(`Heating tube using ${method === 'burner' ? 'Bunsen Burner' : 'Water Bath'}...`, 'info');
  updateTubeVisuals();

  setTimeout(() => checkReaction('heat'), 1500);
}

// Shake Tube
function shakeTube() {
  if (state.status === 'failed') return;

  state.isShaken = true;
  addLog("Shaking test tube to mix contents...", 'info');

  // Visual shake animation
  elements.testTube.style.animation = 'none';
  setTimeout(() => {
    elements.testTube.style.animation = 'shake 0.5s';
  }, 10);

  updateTubeVisuals();

  setTimeout(() => {
    state.isShaken = false;
    checkReaction('shake');
  }, 1000);
}

// Reset Lab
function resetLab() {
  state.tubeContents = [];
  state.tubeColor = 'transparent';
  state.isHeated = false;
  state.isShaken = false;
  state.temperature = 20;
  state.status = 'idle';

  updateTubeColor();
  updateTubeVisuals();

  // Clear notebook except for test selection
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
  const test = state.selectedTest;
  const contents = state.tubeContents;

  if (test === 'benedicts') {
    checkBenedictsReaction(contents, trigger);
  } else if (test === 'iodine') {
    checkIodineReaction(contents, trigger);
  } else if (test === 'biuret') {
    checkBiuretReaction(contents, trigger);
  } else if (test === 'ethanol') {
    checkEthanolReaction(contents, trigger);
  }
}

// Benedict's Test
function checkBenedictsReaction(contents, trigger) {
  const hasSample = contents.some(c => c.startsWith('sample_'));
  const hasReagent = contents.includes('benedicts');
  const isGlucoseHigh = contents.includes('sample_glucose');
  const isGlucoseLow = contents.includes('sample_glucose_low');

  if (hasSample && hasReagent) {
    if (state.isHeated || trigger === 'heat') {
      if (isGlucoseHigh) {
        showSequenceColor(COLOR_SEQUENCES.benedicts_high);
        addLog("Result: Solution turned brick-red. High concentration of reducing sugar!", 'success');
        state.status = 'success';
      } else if (isGlucoseLow) {
        showSequenceColor(COLOR_SEQUENCES.benedicts_low);
        addLog("Result: Solution turned yellow/green. Low concentration of reducing sugar.", 'success');
        state.status = 'success';
      } else if (trigger === 'heat') {
        state.tubeColor = '#3b82f6';
        updateTubeColor();
        addLog("Result: Solution remained blue. No reducing sugar.", 'info');
        state.status = 'success';
      }
    }
  }
}

// Iodine Test
function checkIodineReaction(contents, trigger) {
  const hasSample = contents.some(c => c.startsWith('sample_'));
  const hasReagent = contents.includes('iodine');
  const isStarch = contents.includes('sample_starch');

  if (hasSample && hasReagent && state.status !== 'success') {
    if (isStarch) {
      state.tubeColor = '#0f172a';
      updateTubeColor();
      addLog("Result: Solution turned blue-black. Starch present!", 'success');
      state.status = 'success';
    } else {
      state.tubeColor = '#d97706';
      updateTubeColor();
      addLog("Result: Solution remained orange-brown. No starch.", 'info');
      state.status = 'success';
    }
  }
}

// Biuret Test
function checkBiuretReaction(contents, trigger) {
  const hasSample = contents.some(c => c.startsWith('sample_'));
  const hasA = contents.includes('biuretA');
  const hasB = contents.includes('biuretB');
  const isProtein = contents.includes('sample_protein');

  if (hasSample && hasA && hasB && state.status !== 'success') {
    if (state.isShaken || trigger === 'shake') {
      if (isProtein) {
        state.tubeColor = '#a855f7';
        updateTubeColor();
        addLog("Result: Solution turned purple. Protein present!", 'success');
        state.status = 'success';
      } else {
        state.tubeColor = '#3b82f6';
        updateTubeColor();
        addLog("Result: Solution remained blue. No protein.", 'info');
        state.status = 'success';
      }
    } else if (!state.messages.some(m => m.text.includes("Shake"))) {
      addLog("Hint: Shake the tube to mix the reagents.", 'info');
    }
  }
}

// Ethanol Test
function checkEthanolReaction(contents, trigger) {
  const hasSample = contents.some(c => c.startsWith('sample_'));
  const hasEthanol = contents.includes('ethanol');
  const hasWater = contents.includes('water');
  const isLipid = contents.includes('sample_lipid');

  const ethanolIndex = contents.indexOf('ethanol');
  const waterIndex = contents.indexOf('water');

  if (hasSample && hasEthanol && hasWater && state.status !== 'success') {
    if (waterIndex > ethanolIndex && (state.isShaken || trigger === 'shake')) {
      if (isLipid) {
        state.tubeColor = '#ffffff';
        updateTubeColor(true); // Add blur effect
        addLog("Result: White emulsion formed. Lipids present!", 'success');
        state.status = 'success';
      } else {
        state.tubeColor = 'transparent';
        updateTubeColor();
        addLog("Result: Solution remained clear. No lipids.", 'info');
        state.status = 'success';
      }
    } else if (waterIndex < ethanolIndex) {
      if (!state.messages.some(m => m.text.includes("Nothing happened"))) {
        addLog("Observation: Nothing happened. Did you add water before ethanol?", 'warning');
      }
    }
  }
}

// Show sequential color change
function showSequenceColor(colors) {
  let colorIndex = 0;
  state.tubeColor = colors[0];
  updateTubeColor();

  const colorInterval = setInterval(() => {
    colorIndex++;
    if (colorIndex < colors.length) {
      state.tubeColor = colors[colorIndex];
      updateTubeColor();
    } else {
      clearInterval(colorInterval);
      state.status = 'success';
    }
  }, 1000);
}

// Fail Experiment
function failExperiment(reason) {
  state.status = 'failed';
  state.failureReason = reason;
  addLog(reason, 'error');
  elements.failureMessage.textContent = reason;
  elements.failureModal.classList.remove('hidden');
}

function exitFailure() {
  elements.failureModal.classList.add('hidden');
  resetLab();
}

// UI Updates
function updateTubeColor() {
  const height = Math.min(state.tubeContents.length * 20, 85);
  elements.tubeLiquid.style.height = height + '%';

  if (Array.isArray(state.tubeColor)) {
    // Sequential color change not directly supported in CSS, using first color
    elements.tubeLiquid.style.backgroundColor = state.tubeColor[0];
  } else {
    elements.tubeLiquid.style.backgroundColor = state.tubeColor;
  }
}

function updateTubeVisuals() {
  // Update bubbles if heated
  elements.tubeBubbles.innerHTML = '';
  if (state.isHeated) {
    for (let i = 0; i < 8; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.width = (Math.random() * 4 + 2) + 'px';
      bubble.style.height = bubble.style.width;
      bubble.style.left = Math.random() * 90 + '%';
      bubble.style.animationDelay = Math.random() + 's';
      elements.tubeBubbles.appendChild(bubble);
    }
  }
}

// Logging
function addLog(text, type = 'info') {
  const log = {
    id: Date.now().toString(),
    text,
    type
  };
  state.messages.push(log);
  renderNotebook();
}

function renderNotebook() {
  if (state.messages.length === 0) {
    elements.notebookContent.innerHTML = '<div class="notebook-placeholder"><p>Actions will be recorded here.</p></div>';
    return;
  }

  elements.notebookContent.innerHTML = '';
  state.messages.forEach(msg => {
    const entry = document.createElement('div');
    entry.className = `log-entry ${msg.type}`;
    entry.textContent = msg.text;
    elements.notebookContent.appendChild(entry);
  });

  // Auto-scroll to bottom
  elements.notebookContent.scrollTop = elements.notebookContent.scrollHeight;
}

// Time Display
function updateTimeDisplay() {
  const now = new Date();
  elements.timeDisplay.textContent = now.toLocaleTimeString();
}

// Add CSS animation for shake
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(-5px) rotate(-1deg); }
    50% { transform: translateX(5px) rotate(1deg); }
    75% { transform: translateX(-5px) rotate(-1deg); }
  }
`;
document.head.appendChild(style);

// Start the app
init();
