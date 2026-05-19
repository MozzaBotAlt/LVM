const TEMPLATE_EXPERIMENTS = {
  placeholder_a: {
    id: 'placeholder_a',
    name: 'Placeholder Test A',
    description: 'A generic experiment shell with no real content.',
    steps: [
      'Add a sample to the tube',
      'Add a reagent to the tube',
      'Use the controls to mix, heat, or empty',
    ],
    requiredReagents: ['reagent_a', 'reagent_b'],
  },
  placeholder_b: {
    id: 'placeholder_b',
    name: 'Placeholder Test B',
    description: 'Another generic lab flow for a reusable template.',
    steps: [
      'Select the sample',
      'Choose a reagent',
      'Observe the tube and log actions',
    ],
    requiredReagents: ['reagent_a'],
  }
};

const TEMPLATE_REAGENTS = {
  sample_alpha: {
    id: 'sample_alpha',
    label: 'Sample Alpha',
    color: '#f59e0b',
    category: 'sample'
  },
  sample_beta: {
    id: 'sample_beta',
    label: 'Sample Beta',
    color: '#60a5fa',
    category: 'sample'
  },
  reagent_a: {
    id: 'reagent_a',
    label: 'Reagent A',
    color: '#a855f7',
    category: 'reagent'
  },
  reagent_b: {
    id: 'reagent_b',
    label: 'Reagent B',
    color: '#22c55e',
    category: 'reagent'
  }
};

const state = {
  selectedTest: null,
  tubeContents: [],
  tubeColor: 'transparent',
  isHeated: false,
  isShaken: false,
  hasGoggles: false,
  temperature: 20,
  messages: [],
  status: 'idle'
};

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

function initTemplateLab() {
  setupEventListeners();
  renderExperiments();
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);
}

function setupEventListeners() {
  elements.enterLabBtn.addEventListener('click', enterLab);
  elements.restartBtn.addEventListener('click', exitFailure);
  elements.gogglesBtn.addEventListener('click', toggleGoggles);
  elements.shakeBtn.addEventListener('click', shakeTube);
  elements.waterBathBtn.addEventListener('click', () => heatTube('bath'));
  elements.burnerBtn.addEventListener('click', () => heatTube('burner'));
  elements.emptyBtn.addEventListener('click', resetLab);
}

function enterLab() {
  elements.welcomeModal.classList.add('hidden');
  elements.mainContainer.classList.remove('hidden');
  state.hasGoggles = true;
  updateGogglesButton();
  addLog('Template lab opened. Goggles on.', 'success');
}

function toggleGoggles() {
  state.hasGoggles = !state.hasGoggles;
  const message = state.hasGoggles
    ? 'Goggles are now on.'
    : 'Goggles are now off. Use caution.';
  addLog(message, state.hasGoggles ? 'success' : 'warning');
  updateGogglesButton();
}

function updateGogglesButton() {
  elements.gogglesBtn.textContent = state.hasGoggles ? '✓ Goggles ON' : '✗ Goggles OFF';
  elements.gogglesBtn.classList.toggle('active', state.hasGoggles);
}

function renderExperiments() {
  elements.experimentList.innerHTML = '';
  Object.values(TEMPLATE_EXPERIMENTS).forEach(test => {
    const btn = document.createElement('button');
    btn.className = 'experiment-btn';
    btn.innerHTML = `<span class="name">${test.name}</span><span class="desc">${test.description}</span>`;
    btn.addEventListener('click', () => selectTest(test.id, btn));
    elements.experimentList.appendChild(btn);
  });
}

function selectTest(testId, button) {
  state.selectedTest = TEMPLATE_EXPERIMENTS[testId];
  document.querySelectorAll('.experiment-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  renderProcedure();
  resetLab();
  renderReagents();
  elements.placeholderContent.style.display = 'none';
  elements.workspaceContent.classList.remove('hidden');
  addLog(`Selected ${state.selectedTest.name}.`, 'info');
}

function renderProcedure() {
  elements.procedureSection.style.display = 'flex';
  elements.procedureSteps.innerHTML = '';
  state.selectedTest.steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    elements.procedureSteps.appendChild(li);
  });
}

function renderReagents() {
  elements.samplesPanel.innerHTML = '';
  elements.reagentsPanel.innerHTML = '';
  Object.values(TEMPLATE_REAGENTS).forEach(reagent => {
    const bottle = createReagentBottle(reagent);
    if (reagent.category === 'sample') {
      elements.samplesPanel.appendChild(bottle);
    } else {
      elements.reagentsPanel.appendChild(bottle);
    }
  });
}

function createReagentBottle(reagent) {
  const btn = document.createElement('button');
  btn.className = 'reagent-bottle';
  btn.disabled = state.status === 'failed';
  btn.innerHTML = `<div class="bottle-visual" style="background: ${reagent.color}"></div><span class="bottle-label">${reagent.label}</span>`;
  btn.addEventListener('click', () => addReagent(reagent.id));
  return btn;
}

function addReagent(reagentId) {
  if (state.status === 'failed') return;
  if (!state.hasGoggles) {
    addLog('Warning: Use goggles before handling reagents.', 'warning');
  }
  state.tubeContents.push(reagentId);
  state.tubeColor = calculateTubeColor();
  updateTubeColor();
  addLog(`Added ${TEMPLATE_REAGENTS[reagentId].label}.`, 'info');
}

function calculateTubeColor() {
  if (state.tubeContents.length === 0) return 'transparent';
  const lastReagent = state.tubeContents[state.tubeContents.length - 1];
  return TEMPLATE_REAGENTS[lastReagent]?.color || '#38bdf8';
}

function heatTube(method) {
  if (state.status === 'failed') return;
  if (!state.hasGoggles) {
    failExperiment('Safety violation: heating without eye protection.');
    return;
  }
  state.isHeated = true;
  state.temperature = method === 'burner' ? 100 : 80;
  updateTubeVisuals();
  addLog(`Heating using ${method === 'burner' ? 'burner' : 'water bath'}.`, 'info');
}

function shakeTube() {
  if (state.status === 'failed') return;
  state.isShaken = true;
  addLog('Shaking the test tube.', 'info');
  elements.testTube.style.animation = 'none';
  setTimeout(() => { elements.testTube.style.animation = 'shake 0.5s'; }, 10);
  setTimeout(() => { state.isShaken = false; }, 600);
}

function resetLab() {
  state.tubeContents = [];
  state.tubeColor = 'transparent';
  state.isHeated = false;
  state.isShaken = false;
  state.temperature = 20;
  state.status = 'idle';
  updateTubeColor();
  updateTubeVisuals();
  addLog('Lab reset to template defaults.', 'info');
}

function failExperiment(reason) {
  state.status = 'failed';
  addLog(reason, 'error');
  elements.failureMessage.textContent = reason;
  elements.failureModal.classList.remove('hidden');
}

function exitFailure() {
  elements.failureModal.classList.add('hidden');
  resetLab();
}

function updateTubeColor() {
  const height = Math.min(state.tubeContents.length * 20, 84);
  elements.tubeLiquid.style.height = `${height}%`;
  elements.tubeLiquid.style.backgroundColor = state.tubeColor;
}

function updateTubeVisuals() {
  elements.tubeBubbles.innerHTML = '';
  if (state.isHeated) {
    for (let i = 0; i < 8; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.width = `${Math.random() * 5 + 3}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.left = `${Math.random() * 90}%`;
      bubble.style.animationDelay = `${Math.random()}s`;
      elements.tubeBubbles.appendChild(bubble);
    }
  }
}

function addLog(text, type = 'info') {
  const message = { id: Date.now().toString(), text, type };
  state.messages.push(message);
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
  elements.notebookContent.scrollTop = elements.notebookContent.scrollHeight;
}

function updateTimeDisplay() {
  const now = new Date();
  elements.timeDisplay.textContent = now.toLocaleTimeString();
}

const style = document.createElement('style');
style.textContent = `@keyframes shake {0%,100%{transform: translateX(0) rotate(0deg);}25%{transform: translateX(-5px) rotate(-1deg);}50%{transform: translateX(5px) rotate(1deg);}75%{transform: translateX(-5px) rotate(-1deg);}}`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initTemplateLab);
