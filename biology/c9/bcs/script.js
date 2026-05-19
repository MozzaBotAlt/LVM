// Circulatory System State
const circulatoryState = {
  pulseRate: 72,
  isAnimating: false,
  highlighted: null,
  currentQuestionIndex: 0,
  quizAnswers: []
};

// Quiz Questions
const quizQuestions = [
  {
    question: "What is the primary function of oxygenated blood?",
    options: [
      "To remove waste from the body",
      "To deliver oxygen to all body cells",
      "To cool the body",
      "To regulate blood pressure"
    ],
    correct: 1,
    explanation: "Oxygenated blood carries oxygen from the lungs to all body cells for respiration."
  },
  {
    question: "Where does blood get oxygenated?",
    options: [
      "In the heart",
      "In the body cells",
      "In the lungs",
      "In the liver"
    ],
    correct: 2,
    explanation: "The lungs are where gas exchange occurs - blood picks up oxygen and releases carbon dioxide."
  },
  {
    question: "What is the role of the heart in circulation?",
    options: [
      "To filter blood",
      "To pump blood throughout the body",
      "To produce blood cells",
      "To regulate body temperature"
    ],
    correct: 1,
    explanation: "The heart is a muscular pump that maintains continuous blood circulation throughout the body."
  },
  {
    question: "Which side of the heart pumps oxygenated blood to the body?",
    options: [
      "Right side",
      "Left side",
      "Both sides equally",
      "Neither side"
    ],
    correct: 1,
    explanation: "The left side of the heart pumps oxygenated blood from the lungs to the rest of the body."
  },
  {
    question: "How many times does blood complete a full circuit through the body per minute at rest?",
    options: [
      "Once (60 times at 72 bpm)",
      "Three times (216 times at 72 bpm)",
      "One complete cycle at each heartbeat",
      "Multiple times per heartbeat"
    ],
    correct: 2,
    explanation: "One complete circulation (heart → lungs → heart → body → heart) occurs with each heartbeat. At 72 bpm, the full circuit completes 72 times per minute."
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  const enterLabBtn = document.getElementById('enterLabBtn');
  if (enterLabBtn) {
    enterLabBtn.addEventListener('click', () => {
      document.getElementById('welcomeModal').classList.add('hidden');
      document.getElementById('mainContainer').classList.remove('hidden');
    });
  }

  createBloodCells();
  startPulseAnimation();
  showHighlightInfo('default');
}

// Blood Cell Animation
function createBloodCells() {
  const container = document.getElementById('bloodCells');
  if (!container) return;

  // Red blood cells (oxygenated)
  const redPaths = ['path-lungs-heart', 'path-heart-body'];
  redPaths.forEach((pathId, index) => {
    createAnimatedCell(pathId, '#dc2626', 'O₂', index);
  });

  // Blue blood cells (deoxygenated)
  const bluePaths = ['path-body-heart', 'path-heart-lungs'];
  bluePaths.forEach((pathId, index) => {
    createAnimatedCell(pathId, '#0284c7', 'CO₂', 2 + index);
  });
}

function createAnimatedCell(pathSelector, color, label, delay) {
  const path = document.querySelector(`#${pathSelector}`);
  if (!path) return;

  const svgContainer = document.getElementById('circulationDiagram');
  const interval = setInterval(() => {
    const cell = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cell.innerHTML = `
      <circle cx="0" cy="0" r="8" fill="${color}" opacity="0.8" />
      <text x="0" y="3" text-anchor="middle" font-size="10" fill="white" font-weight="bold">${label}</text>
    `;

    const animationDuration = 60000 / circulatoryState.pulseRate;
    let progress = 0;

    const animate = () => {
      progress += 16;
      const percentage = (progress % animationDuration) / animationDuration;

      const length = path.getTotalLength();
      const point = path.getPointAtLength(length * percentage);

      cell.setAttribute('transform', `translate(${point.x}, ${point.y})`);

      if (progress < animationDuration * 3) {
        setTimeout(animate, 16);
      } else {
        cell.remove();
      }
    };

    svgContainer.appendChild(cell);
    animate();
  }, (60000 / circulatoryState.pulseRate) + delay * 1000);

  // Store interval for cleanup
  if (!window.cellIntervals) window.cellIntervals = [];
  window.cellIntervals.push(interval);
}

// Pulse Control
function updatePulse(value) {
  circulatoryState.pulseRate = parseInt(value);
  document.getElementById('pulseValue').textContent = circulatoryState.pulseRate + ' bpm';
  document.getElementById('pulseRate').textContent = `Pulse: ${circulatoryState.pulseRate} bpm`;

  // Recreate blood cells with new speed
  if (window.cellIntervals) {
    window.cellIntervals.forEach(interval => clearInterval(interval));
    window.cellIntervals = [];
  }
  document.getElementById('bloodCells').innerHTML = '';
  createBloodCells();
}

function togglePulse() {
  // Play sounds or visual effects
  const heart = document.getElementById('heart');
  heart.style.animation = 'heartbeat 0.5s ease-in-out';
  setTimeout(() => {
    heart.style.animation = '';
  }, 500);
}

function startPulseAnimation() {
  const pulseController = document.getElementById('pulseSlider');
  if (!pulseController) return;

  pulseController.addEventListener('input', event => {
    updatePulse(event.target.value);
  });
}

// Path Highlighting
function highlightPath(pathType) {
  resetHighlight();

  const allPaths = document.querySelectorAll('[id^="path-"]');
  allPaths.forEach(path => {
    path.classList.add('path-fade');
  });

  if (pathType === 'oxygenated') {
    document.getElementById('path-lungs-heart').classList.remove('path-fade');
    document.getElementById('path-lungs-heart').classList.add('path-highlight');
    document.getElementById('path-heart-body').classList.remove('path-fade');
    document.getElementById('path-heart-body').classList.add('path-highlight');
    showHighlightInfo('oxygenated');
  } else {
    document.getElementById('path-body-heart').classList.remove('path-fade');
    document.getElementById('path-body-heart').classList.add('path-highlight');
    document.getElementById('path-heart-lungs').classList.remove('path-fade');
    document.getElementById('path-heart-lungs').classList.add('path-highlight');
    showHighlightInfo('deoxygenated');
  }
}

function resetHighlight() {
  const allPaths = document.querySelectorAll('[id^="path-"]');
  allPaths.forEach(path => {
    path.classList.remove('path-fade', 'path-highlight');
  });

  document.querySelectorAll('.panel').forEach(panel => {
    panel.style.background = '';
    panel.style.borderLeftColor = '';
  });
}

function clickElement(element) {
  if (element === 'heart') {
    highlightHeart();
    showHighlightInfo('heart');
  }
}

function highlightHeart() {
  const heart = document.getElementById('heart');
  if (heart) {
    heart.classList.add('path-highlight');
    setTimeout(() => {
      heart.classList.remove('path-highlight');
    }, 1400);
  }
}

function showHighlightInfo(type) {
  const info = document.getElementById('highlightInfo');
  if (!info) return;

  const infoMap = {
    default: {
      title: 'Try the interactive circuit',
      text: 'Click the heart or select oxygenated / deoxygenated flow to reveal the path and learn how blood moves through the body.'
    },
    oxygenated: {
      title: 'Oxygenated Blood Flow',
      text: 'Blood returns from the lungs to the left side of the heart, then is pumped through the aorta into the body carrying fresh oxygen to tissues.'
    },
    deoxygenated: {
      title: 'Deoxygenated Blood Flow',
      text: 'Blood from the body returns to the right side of the heart and is sent to the lungs to release carbon dioxide and pick up oxygen.'
    },
    heart: {
      title: 'Heart Function',
      text: 'The heart acts as a dual pump. The right side sends blood to the lungs, while the left side sends oxygenated blood to the body.'
    }
  };

  const chosen = infoMap[type] || infoMap.default;
  info.innerHTML = `<strong>${chosen.title}</strong><p>${chosen.text}</p>`;
}

// Quiz Functions
function startQuiz() {
  circulatoryState.currentQuestionIndex = 0;
  circulatoryState.quizAnswers = [];
  showQuizQuestion();
}

function showQuizQuestion() {
  const modal = document.getElementById('quizModal');
  const content = document.getElementById('quizContent');
  const question = quizQuestions[circulatoryState.currentQuestionIndex];

  let html = `
    <div class="quiz-question">
      Question ${circulatoryState.currentQuestionIndex + 1} of ${quizQuestions.length}:
      <br>${question.question}
    </div>
    <div class="quiz-options">
  `;

  question.options.forEach((option, index) => {
    html += `
      <button class="quiz-option" onclick="selectQuizOption(${index})">
        ${String.fromCharCode(65 + index)}) ${option}
      </button>
    `;
  });

  html += '</div>';
  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function selectQuizOption(optionIndex) {
  const question = quizQuestions[circulatoryState.currentQuestionIndex];
  const isCorrect = optionIndex === question.correct;
  circulatoryState.quizAnswers.push(isCorrect);

  const options = document.querySelectorAll('.quiz-option');
  options.forEach((opt, idx) => {
    opt.disabled = true;
  });

  if (isCorrect) {
    options[optionIndex].classList.add('correct');
  } else {
    options[optionIndex].classList.add('incorrect');
    options[question.correct].classList.add('correct');
  }

  const content = document.getElementById('quizContent');
  const feedback = document.createElement('div');
  feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  feedback.innerHTML = `
    <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong><br>
    ${question.explanation}
  `;
  content.appendChild(feedback);

  setTimeout(() => {
    if (circulatoryState.currentQuestionIndex < quizQuestions.length - 1) {
      circulatoryState.currentQuestionIndex++;
      showQuizQuestion();
    } else {
      showQuizScore();
    }
  }, 2000);
}

function showQuizScore() {
  const score = circulatoryState.quizAnswers.filter(a => a).length;
  const total = quizQuestions.length;
  const percentage = Math.round((score / total) * 100);

  const content = document.getElementById('quizContent');
  content.innerHTML = `
    <div style="text-align: center; padding: 24px;">
      <h2 style="font-size: 32px; margin-bottom: 12px;">Quiz Complete! 🎉</h2>
      <p style="font-size: 48px; font-weight: 700; color: #2563eb; margin: 16px 0;">
        ${score}/${total}
      </p>
      <p style="font-size: 18px; color: #6b7280; margin-bottom: 24px;">
        ${percentage}% correct
      </p>
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
        ${percentage >= 80 ? '🌟 Excellent understanding of blood circulation!' :
          percentage >= 60 ? '👍 Good knowledge! Review the diagram for more details.' :
          '📚 Review the circulation system and try again!'}
      </p>
      <button class="btn-primary" onclick="closeQuiz()" style="width: 100%; padding: 12px;">
        Close Quiz
      </button>
    </div>
  `;
}

function closeQuiz() {
  document.getElementById('quizModal').classList.add('hidden');
}

// Add CSS animation for heartbeat
const style = document.createElement('style');
style.textContent = `
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.1); }
    50% { transform: scale(1); }
  }
`;
document.head.appendChild(style);
