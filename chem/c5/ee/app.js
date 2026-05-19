// ===== REACTIONS DATA (from data.js) =====
// Note: Include data.js before this file in HTML, or define reactionsData here

// ===== STATE MANAGEMENT =====
let state = {
    selectedReaction: reactionsData[0],
    progress: 0,
    isPlaying: false,
    hasCatalyst: false,
    tempParams: 25,
    currentTemp: 25,
};

let scene, camera, renderer;
let particleSystem;
let energyDiagram;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeModal();
});

// ===== WELCOME MODAL =====
function setupWelcomeModal() {
    const enterLabBtn = document.getElementById('enterLabBtn');
    const welcomeModal = document.getElementById('welcomeModal');
    const mainContainer = document.getElementById('mainContainer');
    
    enterLabBtn.addEventListener('click', () => {
        welcomeModal.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        init3DScene();
        initializeUI();
        drawEnergyProfile();
    });
}

// ===== UI INITIALIZATION =====
function initializeUI() {
    energyDiagram = new EnergyDiagram('canvasEnergy');
    renderReactionList();
    setupEventListeners();
    updateDisplay();
}

function renderReactionList() {
    const container = document.getElementById('reactionList');
    container.innerHTML = '';
    
    reactionsData.forEach(reaction => {
        const btn = document.createElement('button');
        btn.className = `experiment-btn ${reaction.id === state.selectedReaction.id ? 'active' : ''}`;
        btn.innerHTML = `
            <span class="name">${reaction.name}</span>
            <span class="desc">${reaction.type.toUpperCase()} - ${reaction.description.substring(0, 50)}...</span>
        `;
        btn.addEventListener('click', () => selectReaction(reaction));
        container.appendChild(btn);
    });
}

function setupEventListeners() {
    // Show workspace content and hide placeholder
    const placeholderContent = document.getElementById('placeholderContent');
    const workspaceContent = document.getElementById('workspaceContent');
    
    placeholderContent.style.display = 'none';
    workspaceContent.classList.remove('hidden');
    
    document.getElementById('tempSlider').addEventListener('input', (e) => {
        const maxTemp = state.selectedReaction.id === 'thermal_decomp_caco3' ? 1000 : 100;
        document.getElementById('tempSlider').max = maxTemp;
        state.tempParams = Number(e.target.value);
        updateDisplay();
    });

    document.getElementById('catalystCheckbox').addEventListener('change', (e) => {
        state.hasCatalyst = e.target.checked;
        drawEnergyProfile();
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        if (state.progress >= 1) return;
        state.isPlaying = !state.isPlaying;
        updateDisplay();
        if (state.isPlaying) {
            animateReaction();
        }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        state.progress = 0;
        state.isPlaying = false;
        state.currentTemp = state.tempParams;
        state.hasCatalyst = false;
        updateDisplay();
        drawEnergyProfile();
    });
}

function selectReaction(reaction) {
    state.selectedReaction = reaction;
    state.progress = 0;
    state.isPlaying = false;
    state.hasCatalyst = false;
    state.tempParams = reaction.initialTemp;
    state.currentTemp = reaction.initialTemp;
    
    renderReactionList();
    updateDisplay();
    clearScene();
    drawEnergyProfile();
}

// ===== DISPLAY UPDATES =====
function updateDisplay() {
    // Reaction info
    document.getElementById('reactionName').textContent = state.selectedReaction.name;
    document.getElementById('reactionDescription').textContent = state.selectedReaction.description;
    document.getElementById('equationBox').textContent = state.selectedReaction.equation;
    
    // Type and enthalpy
    const typeBadge = document.getElementById('reactionTypeBadge');
    typeBadge.textContent = state.selectedReaction.type.toUpperCase();
    typeBadge.className = `reaction-type-badge ${state.selectedReaction.type === 'exothermic' ? 'exo' : 'endo'}`;
    
    document.getElementById('enthalpyDisplay').textContent = 
        `ΔH = ${state.selectedReaction.enthalpyChange > 0 ? '+' : ''}${state.selectedReaction.enthalpyChange} kJ/mol`;
    
    // Header glow
    const glow = document.getElementById('headerGlow');
    if (glow) {
        glow.className = `header-glow ${state.selectedReaction.type}`;
    }
    
    // Temperature display
    document.getElementById('tempDisplay').textContent = `${Math.round(state.tempParams)} °C`;
    document.getElementById('tempSlider').value = state.tempParams;
    
    // Catalyst section
    const catalystContainer = document.getElementById('catalystContainer');
    if (state.selectedReaction.catalyzedActivationEnergy) {
        catalystContainer.style.display = 'block';
        const name = state.selectedReaction.id === 'hydrogen_peroxide' ? '(MnO₂)' : '(General)';
        document.getElementById('catalystName').textContent = name;
    } else {
        catalystContainer.style.display = 'none';
    }
    
    // Warning for thermal decomposition
    const warningContainer = document.getElementById('warningContainer');
    if (state.selectedReaction.id === 'thermal_decomp_caco3' && state.tempParams < 500) {
        warningContainer.style.display = 'flex';
        document.getElementById('warningText').textContent = 
            'This reaction requires high temperature (>800°C) to proceed efficiently.';
    } else {
        warningContainer.style.display = 'none';
    }
    
    // Temperature slider
    const slider = document.getElementById('tempSlider');
    slider.max = state.selectedReaction.id === 'thermal_decomp_caco3' ? 1000 : 100;
    slider.disabled = state.progress > 0;
    document.getElementById('catalystCheckbox').disabled = state.progress > 0;
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (state.progress >= 1) {
        playBtn.textContent = '▶ START REACTION';
        playBtn.disabled = true;
    } else if (state.isPlaying) {
        playBtn.textContent = '⏸ PAUSE';
        playBtn.classList.add('paused');
        playBtn.disabled = false;
    } else {
        playBtn.textContent = state.progress > 0 ? '▶ RESUME' : '▶ START REACTION';
        playBtn.classList.remove('paused');
        playBtn.disabled = state.progress >= 1;
    }
    
    // Complete message
    document.getElementById('completeMsg').style.display = state.progress >= 1 ? 'block' : 'none';
    
    // Progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${state.progress * 100}%`;
    progressBar.className = `progress-bar ${state.selectedReaction.type}`;
    
    // Live temperature
    state.currentTemp = state.tempParams + state.selectedReaction.finalTempChange * state.progress;
    document.getElementById('liveTemp').textContent = Math.round(state.currentTemp);
    
    // Thermometer icon
    const thermIcon = document.getElementById('thermIcon');
    if (state.currentTemp > 40) {
        thermIcon.textContent = '🔥';
        thermIcon.className = 'therm-icon hot';
    } else if (state.currentTemp < 10) {
        thermIcon.textContent = '❄️';
        thermIcon.className = 'therm-icon cold';
    } else {
        thermIcon.textContent = '🌡️';
        thermIcon.className = 'therm-icon';
    }
    
    // Temperature trend
    const tempTrend = document.getElementById('tempTrend');
    if (state.progress > 0 && state.selectedReaction.finalTempChange !== 0) {
        tempTrend.style.display = 'block';
        if (state.selectedReaction.finalTempChange > 0) {
            tempTrend.textContent = '↑ Heating Up';
            tempTrend.className = 'temp-trend heating';
        } else {
            tempTrend.textContent = '↓ Cooling Down';
            tempTrend.className = 'temp-trend cooling';
        }
    } else {
        tempTrend.style.display = 'none';
    }
    
    // Energy diagram description
    const description = state.selectedReaction.type === 'exothermic'
        ? "Exothermic: Heat is released (bond making > bond breaking)."
        : "Endothermic: Heat is absorbed (bond breaking > bond making).";
    document.getElementById('diagramDescription').textContent = description;
}

// ===== ANIMATION LOOP =====
function animateReaction() {
    if (!state.isPlaying || state.progress >= 1) return;
    
    let lastTime = performance.now();
    
    function update(time) {
        const delta = time - lastTime;
        lastTime = time;
        
        if (state.isPlaying && state.progress < 1) {
            let speed = 0.0005 * delta;
            
            if (state.hasCatalyst) speed *= 1.5;
            
            if (state.selectedReaction.id === 'thermal_decomp_caco3') {
                if (state.tempParams < 800) {
                    speed *= 0.1;
                } else {
                    speed *= 2.0;
                }
            } else {
                speed *= (1 + (state.tempParams - 25) * 0.01);
            }
            
            state.progress = Math.min(state.progress + Math.max(speed, 0.0001), 1);
            
            if (state.progress >= 1) {
                state.isPlaying = false;
            }
            
            updateDisplay();
            drawEnergyProfile();
            updateParticles();
        }
        
        if (state.isPlaying && state.progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== 3D SCENE INITIALIZATION =====
function init3DScene() {
    const canvas = document.getElementById('canvas3d');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    
    // Camera
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 10;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 100, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(10, 10, 10);
    spotLight.angle = 0.15;
    spotLight.penumbra = 1;
    scene.add(spotLight);
    
    // Container wireframe
    const geometry = new THREE.BoxGeometry(8.8, 8.8, 8.8);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xaaddff, 
        transparent: true, 
        opacity: 0.1,
        depthWrite: false
    });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);
    
    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
    );
    scene.add(wireframe);
    //Initialize particle system
    particleSystem = new ParticleSystem(scene, 4);
    
    // Auto rotation
    let rotation = 0;
    function animate() {
        requestAnimationFrame(animate);
        rotation += 0.0005;
        box.rotation.x = rotation * 0.5;
        box.rotation.y = rotation;
        wireframe.rotation.copy(box.rotation);
        
        // Update particles motion
        const speedMultiplier = Math.max(0.1, 1 + (state.currentTemp - 25) * 0.05);
        particleSystem.updateMotion(speedMultiplier);
        
        renderer.render(scene, camera);
    }
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = canvas.clientWidth;
        const newHeight = canvas.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
    
    if (particleSystem) {
        particleSystem.createFromReaction(state.selectedReaction, state.progress);
    }
}

function updateParticles() {
    if (particleSystem) {
        const speedMultiplier = Math.max(0.1, 1 + (state.currentTemp - 25) * 0.05);
        particleSystem.updateMotion(speedMultiplier);
    }
}

function clearScene() {
    if (particleSystem) {
        particleSystem.clearAll();
    }
}

// ===== ENERGY PROFILE DIAGRAM =====
function drawEnergyProfile() {
    const canvas = document.getElementById('canvasEnergy');
    const ctx = canvas.getContext('2d');
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    const reaction = state.selectedReaction;
    const isExo = reaction.type === 'exothermic';
    
    const startX = padding;
    const endX = width - padding;
    const midX = startX + graphWidth / 2;
    
    const reactY = isExo ? padding + graphHeight * 0.3 : padding + graphHeight * 0.7;
    const prodY = isExo ? padding + graphHeight * 0.8 : padding + graphHeight * 0.2;
    
    const eaHeightUncat = reaction.activationEnergy * 0.5;
    const peakYUncat = Math.max(padding, reactY - eaHeightUncat);
    
    const eaHeightCat = reaction.catalyzedActivationEnergy 
        ? reaction.catalyzedActivationEnergy * 0.5 
        : eaHeightUncat * 0.6;
    const peakYCat = Math.max(padding, reactY - eaHeightCat);
    
    // Draw axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding + 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding - 10, height - padding);
    ctx.lineTo(width - padding + 20, height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    
    for (let i = 0; i <= 5; i++) {
        const y = height - padding - (graphHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Draw curves
    if (energyDiagram) {
        energyDiagram.draw(
            state.selectedReaction, 
            state.progress, 
            state.hasCatalyst
        )
    }
}