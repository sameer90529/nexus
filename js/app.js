/**
 * NEXUS - Master Application Controller
 * Orchestrates the Bioluminescent Cryptography realm:
 * Background particles, cinematic intro, audio synthesis, Keykeeper serpent,
 * board rendering, manual typing interaction, auto-play scheduler, row harvesting,
 * decryption path reconstruction, and arcade challenge trials.
 */

(function () {
  'use strict';

  // State
  const state = {
    mode: 'encrypt', // 'encrypt' | 'decrypt'
    rawText: 'HELLOWORLD',
    normalizedText: 'HELLOWORLD',
    numRails: 3,
    normalize: true,
    speedMode: 'normal', // 'slow' | 'normal' | 'hyper'
    stepDelay: 350, // ms
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    isComplete: false,
    isHarvesting: false,
    cipherData: null,
    playTimer: null,
    animationFrameId: null
  };

  const SPEED_CONFIGS = {
    slow: { delay: 650, moveDuration: 500 },
    normal: { delay: 350, moveDuration: 280 },
    hyper: { delay: 110, moveDuration: 85 }
  };

  // Subsystem instances
  let board = null;
  let serpent = null;
  let trials = null;

  // DOM Elements
  const DOM = {
    // Canvas & Intro
    particleCanvas: document.getElementById('nexus-particle-canvas'),
    introScreen: document.getElementById('cinematic-intro'),
    btnSkipIntro: document.getElementById('btn-skip-intro'),
    btnEnterSystem: document.getElementById('btn-enter-system'),
    btnOpenGuideIntro: document.getElementById('btn-open-guide-intro'),

    // HUD Header
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    soundIcon: document.getElementById('sound-icon'),
    soundLabel: document.getElementById('sound-label'),
    btnOpenTrials: document.getElementById('btn-open-trials'),
    btnOpenGuide: document.getElementById('btn-open-guide'),
    btnGlobalReset: document.getElementById('btn-global-reset'),
    brandHome: document.getElementById('brand-home'),

    // Telemetry Cards
    valPlainLen: document.getElementById('val-plain-len'),
    valPlainText: document.getElementById('val-plain-text'),
    valCipherStatus: document.getElementById('val-cipher-status'),
    valCipherText: document.getElementById('val-cipher-text'),
    valStepIndex: document.getElementById('val-step-index'),
    valInspectorChar: document.getElementById('val-inspector-char'),
    valInspectorCoords: document.getElementById('val-inspector-coords'),
    valProgressPct: document.getElementById('val-progress-pct'),
    valProgressFraction: document.getElementById('val-progress-fraction'),
    signalMeterFill: document.getElementById('signal-meter-fill'),
    valPeriodCycle: document.getElementById('val-period-cycle'),
    valKeyDisplay: document.getElementById('val-key-display'),

    // Central Realm
    realmSvg: document.getElementById('realm-svg'),
    emptyState: document.getElementById('realm-empty-state'),
    btnQuickStart: document.getElementById('btn-quick-start'),
    transformationBanner: document.getElementById('transformation-banner'),
    btnCopyCiphertext: document.getElementById('btn-copy-ciphertext'),

    // Command Console
    inputModeLabel: document.getElementById('input-mode-label'),
    cipherInput: document.getElementById('cipher-input'),
    railSelector: document.getElementById('rail-selector'),
    currentRailIndicator: document.getElementById('current-rail-indicator'),
    modeEncrypt: document.getElementById('mode-encrypt'),
    modeDecrypt: document.getElementById('mode-decrypt'),
    btnInitCipher: document.getElementById('btn-init-cipher'),

    btnPlayPause: document.getElementById('btn-play-pause'),
    playPauseIcon: document.getElementById('play-pause-icon'),
    playPauseLabel: document.getElementById('play-pause-label'),
    btnStepForward: document.getElementById('btn-step-forward'),
    btnResetPlayback: document.getElementById('btn-reset-playback'),
    speedChips: document.querySelectorAll('.speed-chip'),
    checkNormalize: document.getElementById('check-normalize'),

    // Modals
    modalGuide: document.getElementById('modal-guide'),
    btnCloseGuide: document.getElementById('btn-close-guide'),
    modalTrials: document.getElementById('modal-trials'),
    btnCloseTrials: document.getElementById('btn-close-trials'),

    // Trials Elements
    trialValScore: document.getElementById('trial-val-score'),
    trialValHigh: document.getElementById('trial-val-high'),
    trialValStreak: document.getElementById('trial-val-streak'),
    trialValTimer: document.getElementById('trial-val-timer'),
    tierTabs: document.querySelectorAll('.tier-tab'),
    trialTargetPlaintext: document.getElementById('trial-target-plaintext'),
    trialTargetKey: document.getElementById('trial-target-key'),
    trialSubmitForm: document.getElementById('trial-submit-form'),
    trialUserInput: document.getElementById('trial-user-input'),
    trialResultCard: document.getElementById('trial-result-card'),
    trialEvalAccuracy: document.getElementById('trial-eval-accuracy'),
    trialDiffContainer: document.getElementById('trial-diff-container'),
    btnVisualizeTrial: document.getElementById('btn-visualize-trial'),
    btnNextTrial: document.getElementById('btn-next-trial'),

    // Toast
    toast: document.getElementById('nexus-toast'),
    toastMsg: document.getElementById('toast-msg')
  };

  /* ========================================================================
     1. BACKGROUND STARFIELD PARTICLES
     ======================================================================== */
  function initParticleCanvas() {
    const canvas = DOM.particleCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(80, Math.floor((width * height) / 14000));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      // Draw faint constellation links between nearby particles
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.fillStyle = `rgba(0, 240, 255, ${p1.alpha})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 85) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.12 * (1 - dist / 85)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  /* ========================================================================
     2. AUDIO INTEGRATION & TOAST
     ======================================================================== */
  function updateSoundUI() {
    const muted = window.NexusAudio.isMuted();
    DOM.soundIcon.textContent = muted ? '🔇' : '🔊';
    DOM.soundLabel.textContent = muted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE';
    DOM.btnToggleSound.classList.toggle('active', !muted);
  }

  function showToast(msg) {
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.add('show');
    setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2400);
  }

  /* ========================================================================
     3. CIPHER INITIALIZATION & BOARD LAYOUT
     ======================================================================== */
  function getPreparedText() {
    const raw = DOM.cipherInput.value || '';
    if (state.normalize) {
      return window.NexusCipher.normalizeText(raw, { uppercase: true, stripSpaces: true, lettersOnly: false });
    }
    return raw;
  }

  function initializeCipher() {
    pauseAutoPlay();
    DOM.transformationBanner.classList.remove('show');

    state.rawText = DOM.cipherInput.value;
    state.normalizedText = getPreparedText();

    if (!state.normalizedText) {
      state.normalizedText = 'HELLOWORLD';
      DOM.cipherInput.value = 'HELLOWORLD';
    }

    const text = state.normalizedText;
    const rails = state.numRails;

    // Calculate cipher trajectory & matrix
    if (state.mode === 'encrypt') {
      state.cipherData = window.NexusCipher.encrypt(text, rails);
    } else {
      state.cipherData = window.NexusCipher.decrypt(text, rails);
    }

    state.totalSteps = text.length;
    state.currentStep = 0;
    state.isComplete = false;
    state.isHarvesting = false;

    // Setup board SVG canvas
    board.setupBoard(rails, text.length, state.cipherData.trajectory);

    // If Decrypt mode, pre-populate the matrix with ciphertext characters on rails
    if (state.mode === 'decrypt') {
      board.populateDecryptionMatrix(state.cipherData.railBuckets);
    }

    // Initialize & spawn Keykeeper serpent
    serpent.init(DOM.realmSvg);

    if (state.totalSteps > 0) {
      const firstCoord = board.getNodeCoordinates(0, 0);
      const nextCoord = state.totalSteps > 1 ? board.getNodeCoordinates(1, rails > 1 ? 1 : 0) : firstCoord;
      serpent.spawnAt(firstCoord.x, firstCoord.y, nextCoord.x, nextCoord.y);
      board.highlightNode(0, true);
    }

    // Update Telemetry Display
    updateTelemetry();
    DOM.emptyState.classList.add('hidden');
    DOM.btnStepForward.disabled = false;
    DOM.btnPlayPause.disabled = false;

    window.NexusAudio.playClick();
  }

  function updateTelemetry() {
    const isEncrypt = state.mode === 'encrypt';

    if (isEncrypt) {
      DOM.valPlainLen.textContent = `[LEN: ${state.normalizedText.length}]`;
      DOM.valPlainText.textContent = state.normalizedText;
      DOM.valCipherStatus.textContent = state.isComplete ? '[HARVEST: COMPLETE]' : '[HARVEST: PENDING]';
      DOM.valCipherText.textContent = state.isComplete ? state.cipherData.ciphertext : 'CALCULATING...';
    } else {
      DOM.valPlainLen.textContent = `[CIPHER: ${state.normalizedText.length}]`;
      DOM.valPlainText.textContent = state.isComplete 
        ? state.cipherData.plaintext 
        : (state.currentStep > 0 ? state.cipherData.plaintext.slice(0, state.currentStep) : 'TRACING PATH...');
      DOM.valCipherStatus.textContent = '[CIPHERTEXT INPUT]';
      DOM.valCipherText.textContent = state.normalizedText;
    }

    // Inspector
    if (state.currentStep > 0 && state.cipherData && state.currentStep <= state.totalSteps) {
      const lastStepNode = state.cipherData.trajectory[state.currentStep - 1];
      const char = state.mode === 'encrypt' 
        ? state.normalizedText[lastStepNode.step]
        : state.cipherData.plaintext[lastStepNode.step];

      DOM.valStepIndex.textContent = `STEP ${String(state.currentStep).padStart(2, '0')} / ${state.totalSteps}`;
      DOM.valInspectorChar.textContent = char || '-';
      const dirText = lastStepNode.dir > 0 ? '↓ DOWNWARD' : (lastStepNode.dir < 0 ? '↑ UPWARD' : '→ LINEAR');
      DOM.valInspectorCoords.innerHTML = `<span>RAIL: R${lastStepNode.rail}</span> | <span>DIR: ${dirText}</span>`;
    } else {
      DOM.valStepIndex.textContent = `STEP 00 / ${state.totalSteps}`;
      DOM.valInspectorChar.textContent = state.totalSteps > 0 ? state.normalizedText[0] : '-';
      DOM.valInspectorCoords.innerHTML = `<span>RAIL: R0</span> | <span>DIR: READY</span>`;
    }

    // Signal Progress
    const pct = state.totalSteps > 0 ? Math.round((state.currentStep / state.totalSteps) * 100) : 0;
    DOM.valProgressPct.textContent = `${pct}%`;
    DOM.valProgressFraction.textContent = `${state.currentStep} / ${state.totalSteps}`;
    DOM.signalMeterFill.style.width = `${pct}%`;

    // Key Observatory
    const cycle = state.numRails > 1 ? 2 * (state.numRails - 1) : 1;
    DOM.valPeriodCycle.textContent = `PERIOD: ${cycle}`;
    DOM.valKeyDisplay.textContent = `${state.numRails} RAILS`;
  }

  /* ========================================================================
     4. STEP FORWARD & FLUID SERPENT MOVEMENT
     ======================================================================== */
  function stepForward() {
    if (state.isComplete || state.isHarvesting) return;
    if (state.currentStep >= state.totalSteps) {
      finishCipherSequence();
      return;
    }

    const stepIndex = state.currentStep;
    const currentNode = state.cipherData.trajectory[stepIndex];
    const isEncrypt = state.mode === 'encrypt';
    const char = isEncrypt 
      ? state.normalizedText[stepIndex] 
      : state.cipherData.plaintext[stepIndex];

    const coord = board.getNodeCoordinates(currentNode.col, currentNode.rail);
    const speed = SPEED_CONFIGS[state.speedMode] || SPEED_CONFIGS.normal;

    // Move serpent to this node
    serpent.moveTo(coord.x, coord.y, speed.moveDuration, () => {
      // 1. Lock character tile onto board or activate decryption node
      if (isEncrypt) {
        board.lockCharacterAt(stepIndex, char, {
          color: '#00ff9d',
          letterColor: '#ffffff'
        });
      } else {
        board.activateDecryptionStep(stepIndex);
        DOM.valPlainText.textContent = state.cipherData.plaintext.slice(0, stepIndex + 1);
      }

      // 2. Audio chime
      window.NexusAudio.playCharLock(stepIndex);
      window.NexusAudio.playSerpentMove(currentNode.rail, state.numRails);

      // 3. Increment step
      state.currentStep++;
      updateTelemetry();

      // Highlight next target node if available
      if (state.currentStep < state.totalSteps) {
        board.highlightNode(state.currentStep, true);
      } else {
        finishCipherSequence();
      }
    });
  }

  /* ========================================================================
     5. ENCRYPTION REVEAL & HARVESTING SEQUENCE
     ======================================================================== */
  function finishCipherSequence() {
    state.isComplete = true;
    pauseAutoPlay();
    DOM.btnStepForward.disabled = true;

    if (state.mode === 'encrypt') {
      state.isHarvesting = true;
      DOM.valCipherStatus.textContent = '[HARVESTING RAILS...]';

      // Cinematic row-by-row harvesting animation
      board.animateHarvestSequence(
        state.cipherData.harvestOrder,
        (item, index, total) => {
          window.NexusAudio.playHarvestStep(index, total);
          // Progressively display harvested ciphertext letters
          DOM.valCipherText.textContent = state.cipherData.ciphertext.slice(0, index + 1);
        },
        () => {
          state.isHarvesting = false;
          window.NexusAudio.playComplete();
          DOM.valCipherStatus.textContent = '[HARVEST: COMPLETE]';
          DOM.valCipherText.textContent = state.cipherData.ciphertext;
          DOM.transformationBanner.querySelector('.transform-caption').textContent = '“POSITION CHANGES. MESSAGE PRESERVED.”';
          const sub = DOM.transformationBanner.querySelector('div div:last-child');
          if (sub) {
            sub.textContent = 'CIPHERTEXT HARVESTED ROW-BY-ROW';
            sub.style.color = 'var(--text-dim)';
          }
          DOM.btnCopyCiphertext.textContent = 'COPY CIPHERTEXT';
          DOM.transformationBanner.classList.add('show');
        }
      );
    } else {
      // Decryption sequence complete
      window.NexusAudio.playComplete();
      DOM.valPlainText.textContent = state.cipherData.plaintext;
      DOM.transformationBanner.querySelector('.transform-caption').textContent = `“PATH RECONSTRUCTED: ${state.cipherData.plaintext}”`;
      const sub = DOM.transformationBanner.querySelector('div div:last-child');
      if (sub) {
        sub.textContent = 'IDENTITY VERIFIED [100% MATCH TO PLAINTEXT STREAM]';
        sub.style.color = 'var(--neon-emerald)';
      }
      DOM.btnCopyCiphertext.textContent = 'COPY PLAINTEXT';
      DOM.transformationBanner.classList.add('show');
    }
  }

  /* ========================================================================
     6. AUTO-PLAY & PLAYBACK CONTROLS
     ======================================================================== */
  function toggleAutoPlay() {
    if (state.isPlaying) {
      pauseAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    if (state.isComplete) {
      // Reset first if already at end
      resetPlayback();
    }
    state.isPlaying = true;
    DOM.playPauseIcon.textContent = '⏸';
    DOM.playPauseLabel.textContent = 'PAUSE';
    DOM.btnPlayPause.classList.add('active');

    scheduleNextAutoStep();
  }

  function pauseAutoPlay() {
    state.isPlaying = false;
    if (state.playTimer) {
      clearTimeout(state.playTimer);
      state.playTimer = null;
    }
    DOM.playPauseIcon.textContent = '▶';
    DOM.playPauseLabel.textContent = 'AUTO-PLAY';
    DOM.btnPlayPause.classList.remove('active');
  }

  function scheduleNextAutoStep() {
    if (!state.isPlaying || state.isComplete || state.isHarvesting) return;

    stepForward();

    const speed = SPEED_CONFIGS[state.speedMode] || SPEED_CONFIGS.normal;
    state.playTimer = setTimeout(() => {
      if (state.isPlaying && !state.isComplete) {
        scheduleNextAutoStep();
      }
    }, speed.delay);
  }

  function resetPlayback() {
    pauseAutoPlay();
    initializeCipher();
  }

  /* ========================================================================
     7. MANUAL TYPING INTERACTION
     ======================================================================== */
  function handleManualKeyInput(key) {
    if (state.isComplete || state.isHarvesting) return;
    if (state.currentStep >= state.totalSteps) return;

    const expectedChar = state.mode === 'encrypt'
      ? state.normalizedText[state.currentStep]
      : state.cipherData.plaintext[state.currentStep];

    const typedUpper = key.toUpperCase();

    if (typedUpper === expectedChar) {
      stepForward();
    } else {
      window.NexusAudio.playError();
      DOM.valInspectorChar.style.color = 'var(--neon-red)';
      setTimeout(() => {
        DOM.valInspectorChar.style.color = 'var(--neon-cyan)';
      }, 300);
    }
  }

  /* ========================================================================
     8. GLOBAL ANIMATION LOOP
     ======================================================================== */
  function mainLoop(time) {
    if (serpent) {
      serpent.update(time);
    }
    requestAnimationFrame(mainLoop);
  }

  /* ========================================================================
     9. ARCADE TRIALS CONTROLLER
     ======================================================================== */
  function initTrialsController() {
    trials = new window.NexusTrials(window.NexusCipher, window.NexusAudio);

    function updateTrialsHUD() {
      DOM.trialValScore.textContent = trials.score;
      DOM.trialValHigh.textContent = trials.highScore;
      DOM.trialValStreak.textContent = `${trials.streak}x`;
    }

    function loadNextChallenge(tier = trials.currentTier) {
      DOM.trialResultCard.style.display = 'none';
      DOM.trialUserInput.value = '';
      DOM.trialUserInput.disabled = false;

      const challenge = trials.startChallenge(
        tier,
        (timeRemaining) => {
          DOM.trialValTimer.textContent = `${timeRemaining}S`;
          if (timeRemaining <= 10) {
            DOM.trialValTimer.style.color = 'var(--neon-red)';
          } else {
            DOM.trialValTimer.style.color = 'var(--neon-cyan)';
          }
        },
        () => {
          // Time expired
          DOM.trialUserInput.disabled = true;
          DOM.trialValTimer.textContent = 'EXPIRED';
          handleSubmitTrial();
        }
      );

      DOM.trialTargetPlaintext.textContent = challenge.plaintext;
      DOM.trialTargetKey.textContent = `${challenge.rails} RAILS`;
      DOM.trialValTimer.textContent = challenge.timeLimit > 0 ? `${challenge.timeLimit}S` : 'UNLIMITED';
      DOM.trialValTimer.style.color = 'var(--neon-cyan)';
      DOM.trialUserInput.focus();
      updateTrialsHUD();
    }

    function handleSubmitTrial() {
      const submission = DOM.trialUserInput.value;
      const result = trials.evaluateSubmission(submission);

      updateTrialsHUD();
      DOM.trialResultCard.style.display = 'flex';
      DOM.trialEvalAccuracy.textContent = `${result.accuracy}% ACCURACY (+${result.pointsEarned} PTS)`;
      DOM.trialEvalAccuracy.style.color = result.isPerfect ? 'var(--neon-emerald)' : 'var(--neon-amber)';

      // Render character-by-character diff
      DOM.trialDiffContainer.innerHTML = '';
      result.characterDiff.forEach(d => {
        const tile = document.createElement('div');
        tile.className = `diff-tile ${d.correct ? 'correct' : 'incorrect'}`;
        tile.innerHTML = `
          <div>${d.playerChar || '_'}</div>
          <div class="exp-char">${d.expectedChar}</div>
        `;
        DOM.trialDiffContainer.appendChild(tile);
      });
    }

    DOM.trialSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmitTrial();
    });

    DOM.btnNextTrial.addEventListener('click', () => {
      loadNextChallenge();
    });

    DOM.btnVisualizeTrial.addEventListener('click', () => {
      if (!trials.currentChallenge) return;
      DOM.modalTrials.classList.remove('open');
      DOM.cipherInput.value = trials.currentChallenge.plaintext;
      setRailCount(trials.currentChallenge.rails);
      setMode('encrypt');
      initializeCipher();
      showToast(`LOADED CHALLENGE: "${trials.currentChallenge.plaintext}" [${trials.currentChallenge.rails} RAILS]`);
    });

    DOM.tierTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        DOM.tierTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadNextChallenge(tab.dataset.tier);
      });
    });

    // Initial load
    loadNextChallenge('initiate');
  }

  /* ========================================================================
     10. EVENT BINDINGS & HELPERS
     ======================================================================== */
  function setRailCount(rails) {
    state.numRails = parseInt(rails, 10) || 3;
    DOM.currentRailIndicator.textContent = `KEY: ${state.numRails}`;
    DOM.railSelector.querySelectorAll('.rail-step-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.rails, 10) === state.numRails);
    });
  }

  function setMode(mode) {
    state.mode = mode;
    DOM.modeEncrypt.classList.toggle('active', mode === 'encrypt');
    DOM.modeDecrypt.classList.toggle('active', mode === 'decrypt');
    DOM.inputModeLabel.textContent = mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT';

    if (mode === 'decrypt' && state.cipherData && state.cipherData.ciphertext) {
      DOM.cipherInput.value = state.cipherData.ciphertext;
    }
  }

  function setupEventListeners() {
    // Cinematic Intro
    const dismissIntro = () => {
      DOM.introScreen.classList.add('hidden');
      window.NexusAudio.playClick();
    };

    DOM.btnEnterSystem.addEventListener('click', dismissIntro);
    DOM.btnSkipIntro.addEventListener('click', dismissIntro);

    DOM.btnOpenGuideIntro.addEventListener('click', () => {
      DOM.modalGuide.classList.add('open');
    });

    // Brand Home click resets
    DOM.brandHome.addEventListener('click', () => {
      initializeCipher();
    });

    // Sound toggle
    DOM.btnToggleSound.addEventListener('click', () => {
      window.NexusAudio.toggleMute();
      updateSoundUI();
    });

    // Modals
    DOM.btnOpenGuide.addEventListener('click', () => DOM.modalGuide.classList.add('open'));
    DOM.btnCloseGuide.addEventListener('click', () => DOM.modalGuide.classList.remove('open'));

    DOM.btnOpenTrials.addEventListener('click', () => DOM.modalTrials.classList.add('open'));
    DOM.btnCloseTrials.addEventListener('click', () => DOM.modalTrials.classList.remove('open'));

    // Global reset
    DOM.btnGlobalReset.addEventListener('click', () => {
      resetPlayback();
      showToast('CIPHER REALM RESET');
    });

    // Rail Selector buttons
    DOM.railSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.rail-step-btn');
      if (btn && btn.dataset.rails) {
        setRailCount(btn.dataset.rails);
        initializeCipher();
      }
    });

    // Preset chips
    document.querySelectorAll('.preset-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.cipherInput.value = chip.dataset.text;
        initializeCipher();
      });
    });

    // Mode Toggle
    DOM.modeEncrypt.addEventListener('click', () => {
      if (state.mode !== 'encrypt') {
        setMode('encrypt');
        initializeCipher();
      }
    });

    DOM.modeDecrypt.addEventListener('click', () => {
      if (state.mode !== 'decrypt') {
        setMode('decrypt');
        initializeCipher();
      }
    });

    // Initialize button
    DOM.btnInitCipher.addEventListener('click', () => {
      initializeCipher();
    });

    DOM.btnQuickStart.addEventListener('click', () => {
      initializeCipher();
    });

    // Playback Controls
    DOM.btnPlayPause.addEventListener('click', toggleAutoPlay);
    DOM.btnStepForward.addEventListener('click', stepForward);
    DOM.btnResetPlayback.addEventListener('click', resetPlayback);

    // Speed Chips
    DOM.speedChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.speedChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.speedMode = chip.dataset.speed;
        window.NexusAudio.playClick();
      });
    });

    // Normalization checkbox
    DOM.checkNormalize.addEventListener('change', (e) => {
      state.normalize = e.target.checked;
      initializeCipher();
    });

    // Copy Ciphertext
    DOM.btnCopyCiphertext.addEventListener('click', () => {
      const textToCopy = state.mode === 'encrypt' ? state.cipherData.ciphertext : state.cipherData.plaintext;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`COPIED: "${textToCopy}"`);
          window.NexusAudio.playClick();
        }).catch(() => {
          showToast(`COPIED: "${textToCopy}"`);
        });
      } else {
        showToast(`COPIED: "${textToCopy}"`);
      }
    });

    // Global Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in text inputs
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      if (e.key === 'Escape') {
        if (!DOM.introScreen.classList.contains('hidden')) {
          DOM.introScreen.classList.add('hidden');
        }
        DOM.modalGuide.classList.remove('open');
        DOM.modalTrials.classList.remove('open');
      } else if (e.code === 'Space') {
        e.preventDefault();
        toggleAutoPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetPlayback();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        window.NexusAudio.toggleMute();
        updateSoundUI();
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        // Manual keystroke mode
        handleManualKeyInput(e.key);
      }
    });
  }

  /* ========================================================================
     BOOTSTRAP
     ======================================================================== */
  function init() {
    initParticleCanvas();

    board = new window.NexusBoard(DOM.realmSvg);
    serpent = new window.NexusSerpent();

    setupEventListeners();
    initTrialsController();
    updateSoundUI();

    // Initialize board with default HELLOWORLD on 3 rails
    initializeCipher();

    // Start requestAnimationFrame loop for serpent kinematics & particles
    requestAnimationFrame(mainLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
