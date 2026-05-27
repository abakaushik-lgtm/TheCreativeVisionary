/**
 * AntiGravity — Cyberpunk Corporate Portal Scripts
 * Logic for Web Audio Drone Synth, Biometric Overlay Canvas,
 * Interactive Console commands, and floating 3D tilting effects.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. DOM Elements & State
    // -----------------------------------------------------------------
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link');
    const atmosBtn = document.getElementById('atmos-toggle');
    const terminalInput = document.getElementById('terminal-cmd');
    const terminalHistory = document.getElementById('terminal-history');
    const terminalScreen = document.getElementById('terminal-screen');
    const shortcutButtons = document.querySelectorAll('.btn-shortcut');
    
    // Telemetry DOM
    const cognitiveValNode = document.getElementById('val-cognitive');
    const cognitiveBarNode = document.getElementById('bar-cognitive');
    const densityValNode = document.getElementById('val-density');
    const densityBarNode = document.getElementById('bar-density');

    // State Variables
    let isAtmosActive = false;
    let audioContext = null;
    let osc1 = null;
    let osc2 = null;
    let lfo = null;
    let masterGain = null;

    // -----------------------------------------------------------------
    // 2. Web Audio Synthesizer (Atmospheric Cyber Hum)
    // -----------------------------------------------------------------
    function initAtmosphere() {
        try {
            // Create Audio Context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContextClass();

            // Create Master Gain (Volume Control)
            masterGain = audioContext.createGain();
            masterGain.gain.setValueAtTime(0.0, audioContext.currentTime); // start silent
            masterGain.connect(audioContext.destination);

            // Low Pass Filter for deep cyber hum
            const lpFilter = audioContext.createBiquadFilter();
            lpFilter.type = 'lowpass';
            lpFilter.frequency.setValueAtTime(120, audioContext.currentTime);
            lpFilter.Q.setValueAtTime(4.0, audioContext.currentTime);
            lpFilter.connect(masterGain);

            // Oscillator 1 (Low Sub Drone - A1 55Hz)
            osc1 = audioContext.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(55.0, audioContext.currentTime); // A1
            osc1.connect(lpFilter);

            // Oscillator 2 (Harmonic Fifth - E2 82.4Hz)
            osc2 = audioContext.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(82.41, audioContext.currentTime); // E2
            osc2.connect(lpFilter);

            // LFO to sweep filter frequency for "breathing machine" effect
            lfo = audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.15, audioContext.currentTime); // very slow 0.15Hz
            
            const lfoGain = audioContext.createGain();
            lfoGain.gain.setValueAtTime(40, audioContext.currentTime); // Sweep depth of 40Hz
            
            lfo.connect(lfoGain);
            lfoGain.connect(lpFilter.frequency); // Modulate cutoff frequency

            // Start everything
            osc1.start();
            osc2.start();
            lfo.start();
        } catch (e) {
            console.error('Web Audio API is not supported or failed to initialize:', e);
        }
    }

    function toggleAtmosphere() {
        if (!audioContext) {
            initAtmosphere();
        }

        if (!audioContext) return;

        // Resume context if suspended (browser security)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (!isAtmosActive) {
            // Fade-in hum slowly
            masterGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 2.0);
            isAtmosActive = true;
            atmosBtn.classList.add('active');
            atmosBtn.querySelector('.atmos-label').innerText = 'ATMOSPHERE: ON';
            printToTerminal('Atmospheric drone activated. Quantum soundscape routing initialized.', 'log-info');
            playCyberChirp(600, 0.08);
        } else {
            // Fade-out hum
            masterGain.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 1.0);
            isAtmosActive = false;
            atmosBtn.classList.remove('active');
            atmosBtn.querySelector('.atmos-label').innerText = 'ATMOSPHERE: OFF';
            printToTerminal('Atmospheric drone offline. Soundscape muted.', 'log-warn');
        }
    }

    // Cyber chirp synth sound effect for UI interaction
    function playCyberChirp(freq = 800, duration = 0.1) {
        if (!audioContext || audioContext.state === 'suspended') return;
        
        try {
            const chirpGain = audioContext.createGain();
            chirpGain.gain.setValueAtTime(0.05, audioContext.currentTime);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            chirpGain.connect(audioContext.destination);

            const chirpOsc = audioContext.createOscillator();
            chirpOsc.type = 'sine';
            chirpOsc.frequency.setValueAtTime(freq, audioContext.currentTime);
            // pitch drop
            chirpOsc.frequency.exponentialRampToValueAtTime(freq / 2, audioContext.currentTime + duration);
            chirpOsc.connect(chirpGain);

            chirpOsc.start();
            chirpOsc.stop(audioContext.currentTime + duration);
        } catch (err) {
            // silent catch if audio context isn't running fully
        }
    }

    atmosBtn.addEventListener('click', toggleAtmosphere);

    // Add audio feedback to navigation link hovers and buttons
    const clickables = document.querySelectorAll('.nav-link, .btn-cyber, .btn-shortcut');
    clickables.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (isAtmosActive) playCyberChirp(1200, 0.04);
        });
    });


    // -----------------------------------------------------------------
    // 3. Holographic Biometric Scanner Canvas Overlay
    // -----------------------------------------------------------------
    const canvas = document.getElementById('biometric-scanner');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let scanY = 0;
    let scanDirection = 1;
    let telemetryRotation = 0;

    function drawBiometrics() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;

        // Draw HUD Target Box
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, w - 60, h - 60);

        // Corner brackets
        const cornerSize = 15;
        ctx.strokeStyle = 'var(--electric-blue)';
        ctx.lineWidth = 2;

        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(30 + cornerSize, 30); ctx.lineTo(30, 30); ctx.lineTo(30, 30 + cornerSize);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(w - 30 - cornerSize, 30); ctx.lineTo(w - 30, 30); ctx.lineTo(w - 30, 30 + cornerSize);
        ctx.stroke();

        // Bottom-Left Corner
        ctx.beginPath();
        ctx.moveTo(30 + cornerSize, h - 30); ctx.lineTo(30, h - 30); ctx.lineTo(30, h - 30 - cornerSize);
        ctx.stroke();

        // Bottom-Right Corner
        ctx.beginPath();
        ctx.moveTo(w - 30 - cornerSize, h - 30); ctx.lineTo(w - 30, h - 30); ctx.lineTo(w - 30, h - 30 - cornerSize);
        ctx.stroke();

        // Glowing Scan Line
        scanY += 1.5 * scanDirection;
        if (scanY > h - 60 || scanY < 0) {
            scanDirection *= -1;
        }

        const actualScanY = 30 + scanY;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'var(--electric-blue)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(35, actualScanY);
        ctx.lineTo(w - 35, actualScanY);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw Rotating Circular Scanner
        telemetryRotation += 0.01;
        ctx.save();
        ctx.translate(w - 70, 70);
        ctx.rotate(telemetryRotation);
        ctx.strokeStyle = 'rgba(189, 0, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([5, 10]);
        ctx.strokeStyle = 'var(--electric-blue)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Render Biometric Scanning text info
        ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.font = "9px 'Share Tech Mono', monospace";
        ctx.fillText("DECISION MATRIX: BALANCED", 45, 50);
        ctx.fillText("FACIAL GEOMETRY: SECURE", 45, 62);
        
        ctx.fillStyle = 'rgba(189, 0, 255, 0.85)';
        ctx.fillText("NEURAL DEVIATION: 0.02%", 45, h - 50);
        ctx.fillText("COGNITIVE LOCK: ACTIVE", 45, h - 38);

        // Grid Crosshair in Center
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 10, h / 2); ctx.lineTo(w / 2 + 10, h / 2);
        ctx.moveTo(w / 2, h / 2 - 10); ctx.lineTo(w / 2, h / 2 + 10);
        ctx.stroke();

        requestAnimationFrame(drawBiometrics);
    }
    
    // Start canvas loop
    drawBiometrics();


    // -----------------------------------------------------------------
    // 4. Interactive Command Console
    // -----------------------------------------------------------------
    function printToTerminal(text, className = '') {
        const line = document.createElement('p');
        line.className = `terminal-log ${className}`;
        
        if (className === 'log-response') {
            line.innerHTML = `&gt; ${text}`;
        } else {
            line.innerHTML = text;
        }

        terminalHistory.appendChild(line);
        
        // Auto scroll terminal to bottom
        terminalScreen.scrollTop = terminalScreen.scrollHeight;
    }

    // Process Terminal Commands
    function executeCommand(cmdStr) {
        const cleanCmd = cmdStr.trim().toLowerCase();
        
        // Log original input
        printToTerminal(cmdStr, 'log-response');
        if (isAtmosActive) playCyberChirp(900, 0.06);

        if (cleanCmd === '') return;

        // Custom commands
        if (cleanCmd === '/help') {
            printToTerminal('----- ANTIGRAVITY COGNITIVE DIRECTIVES -----', 'log-info');
            printToTerminal('<span class="text-neon-blue">/diagnose</span> : Scan system integrity and node matrices.', 'log-info');
            printToTerminal('<span class="text-neon-blue">/optimize</span> : Recalibrate cognitive and quantum grid alignments.', 'log-info');
            printToTerminal('<span class="text-neon-blue">/visualize</span>: Stream active holographic quantum vector lines.', 'log-info');
            printToTerminal('<span class="text-neon-blue">/core</span>      : Output mechanical specifications of local node.', 'log-info');
            printToTerminal('<span class="text-neon-blue">/atmosphere</span>: Toggle background noise generator on/off.', 'log-info');
            printToTerminal('<span class="text-neon-blue">/clear</span>     : Wipe console historical logs from memory.', 'log-info');
        } 
        else if (cleanCmd === '/diagnose') {
            printToTerminal('COMMENCING HIGH-SEC DIAGNOSTIC MATRIX...', 'log-info');
            
            setTimeout(() => {
                printToTerminal('[SYSTEM] Checking Quantum Shield Integrity... <span class="text-neon-blue">SHIELD-5 ACTIVE</span>');
            }, 300);
            
            setTimeout(() => {
                printToTerminal('[SYSTEM] Syncing with Cloud Distributed Lattice... <span class="text-neon-blue">LATENCY 0.74ms</span>');
            }, 600);
            
            setTimeout(() => {
                printToTerminal('[SYSTEM] Analysing Biometric Strategist Core... <span class="text-neon-blue">SYNCHRONIZED (99.8%)</span>');
            }, 900);

            setTimeout(() => {
                printToTerminal('[SYSTEM] CHECK COMPLETE: ALL MODULES IN GRAVITY-SHIELDED NOMINAL SPECS.', 'log-success');
                if (isAtmosActive) playCyberChirp(1400, 0.15);
            }, 1200);
        }
        else if (cleanCmd === '/optimize') {
            printToTerminal('INITIATING QUANTUM DE-FRAG AND ROUTING OPTIMIZATION...', 'log-info');
            
            // Dynamic telemetry bar growth simulation
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                if (progress <= 100) {
                    printToTerminal(`Recalibrating routing cells... ${progress}%`);
                } else {
                    clearInterval(interval);
                    
                    // Boost the stats
                    cognitiveValNode.innerText = '99.9%';
                    cognitiveBarNode.style.width = '99.9%';
                    densityValNode.innerText = '94.2 GFLOPS';
                    densityBarNode.style.width = '94.2%';
                    
                    printToTerminal('COGNITIVE ROUTING BALANCED. DE-FRAG COMPLETE. SYSTEM BOOSTED.', 'log-success');
                    if (isAtmosActive) playCyberChirp(1600, 0.2);
                }
            }, 250);
        }
        else if (cleanCmd === '/visualize') {
            printToTerminal('OPENING QUANTUM VECTOR LOG DUMP...', 'log-info');
            
            setTimeout(() => {
                printToTerminal('┌──────────────────────────────────────────────────┐');
                printToTerminal('│  ▲▲ 0.456  ▲▲ 0.892  ■■ CORE_ACTIVE              │');
                printToTerminal('│  [LATTICE_0] ======&gt; [LATTICE_1] (98.4% CAP)    │');
                printToTerminal('│  [LATTICE_2] ======&gt; [LATTICE_3] (G-SHIELD: ON)  │');
                printToTerminal('│  VECTOR MATRIX MATCH: QUANTUM_CELL_LOCKED        │');
                printToTerminal('└──────────────────────────────────────────────────┘');
            }, 200);
        }
        else if (cleanCmd === '/core') {
            printToTerminal('----- SYSTEM CORE ENGINE SPECIFICATIONS -----', 'log-info');
            printToTerminal('Core Engine: AntiGravity v3.5-Lattice');
            printToTerminal('Processor: 16-Core Bio-Quantum Integrated Matrix');
            printToTerminal('Memory Density: 512 Quantum-Tetrabytes Hologram Memory');
            printToTerminal('Security Framework: Holographic Shield-5 Lattice Lock');
            printToTerminal('Status: G-Force Shield Active');
        }
        else if (cleanCmd === '/atmosphere') {
            toggleAtmosphere();
        }
        else if (cleanCmd === '/clear') {
            terminalHistory.innerHTML = '';
        }
        else {
            printToTerminal(`DIRECTIVE ERR: '${cleanCmd}' NOT SECURED. Enter /help to see directive list.`, 'log-warn');
            if (isAtmosActive) playCyberChirp(300, 0.15);
        }
    }

    // Terminal listeners
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = terminalInput.value;
            executeCommand(val);
            terminalInput.value = '';
        }
    });

    // Shortcuts click actions
    shortcutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-cmd');
            executeCommand(cmd);
        });
    });


    // -----------------------------------------------------------------
    // 5. Dynamic Telemetry Drifting (Mock Activity)
    // -----------------------------------------------------------------
    setInterval(() => {
        // Drifts cognitive alignment between 97.4% and 99.4%
        if (cognitiveValNode.innerText !== '99.9%') { // skip if optimized boost is active
            const driftCog = (97.4 + Math.random() * 2).toFixed(1);
            cognitiveValNode.innerText = `${driftCog}%`;
            cognitiveBarNode.style.width = `${driftCog}%`;
        }

        // Drifts lattice density between 42.1 GFLOPS and 48.9 GFLOPS
        if (densityValNode.innerText !== '94.2 GFLOPS') { // skip if optimized boost is active
            const driftDens = (42.1 + Math.random() * 6.8).toFixed(1);
            densityValNode.innerText = `${driftDens} GFLOPS`;
            // map 42-49 to percentage fill 42%-49%
            densityBarNode.style.width = `${driftDens}%`;
        }
    }, 4000);


    // -----------------------------------------------------------------
    // 6. Premium 3D Mouse Tilting on Glassmorphism Cards
    // -----------------------------------------------------------------
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Cursor relative coordinates
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Normalize coordinates between -0.5 and 0.5
            const xNormalized = (x / rect.width) - 0.5;
            const yNormalized = (y / rect.height) - 0.5;

            // Maximum angles of tilt
            const tiltMaxAngle = 8; // degrees
            
            const tiltX = (yNormalized * -tiltMaxAngle).toFixed(2);
            const tiltY = (xNormalized * tiltMaxAngle).toFixed(2);

            // Apply 3D rotation and scale boost slightly
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            // Smoothly snap back to original position
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });


    // -----------------------------------------------------------------
    // 7. Scroll & Spy Mechanics
    // -----------------------------------------------------------------
    window.addEventListener('scroll', () => {
        // Toggle header collapse style
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Simple Scroll Spy active nav links
        let currentSection = '';
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
});
