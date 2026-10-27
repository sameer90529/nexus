/**
 * NEXUS - Sound and Sensory Feedback Engine
 * Procedural Web Audio API sound generator.
 * Zero external audio assets; runs 100% offline and low-latency.
 * Muted by default per specifications.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexusAudio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let audioCtx = null;
  let isMuted = true; // Off by default as required

  function getAudioContext() {
    if (!audioCtx && (typeof window !== 'undefined')) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function setMuted(muted) {
    isMuted = !!muted;
    if (!isMuted) {
      getAudioContext();
    }
    return isMuted;
  }

  function toggleMute() {
    return setMuted(!isMuted);
  }

  function checkMuted() {
    return isMuted;
  }

  /**
   * Soft electronic sub-pulse when the serpent moves
   */
  function playSerpentMove(railIndex = 0, totalRails = 3) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Pitch modulates slightly based on rail (higher rail = higher frequency)
      const baseFreq = 160 + (railIndex / Math.max(1, totalRails - 1)) * 140;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Audio silently fails if permission denied
    }
  }

  /**
   * Delicate crystal chime when a character locks into place
   */
  function playCharLock(stepIndex = 0) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Pentatonic scale cycle
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const freq = scale[stepIndex % scale.length];

      // Primary sine tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Shimmering overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.02, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  /**
   * Subtle rising tone during ciphertext generation / rail harvesting
   */
  function playHarvestStep(index = 0, total = 10) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const progress = total > 1 ? index / (total - 1) : 0.5;
      const freq = 400 + progress * 500; // 400Hz to 900Hz ascending

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  /**
   * Satisfying completion chord when full transformation is achieved
   */
  function playComplete() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Majestic cyber major triad with 9th: C4, G4, C5, E5, D6
      const freqs = [261.63, 392.00, 523.25, 659.25, 1174.66];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.04;

        osc.type = idx === 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.9);
      });
    } catch (e) {}
  }

  /**
   * Gentle warning for invalid input in manual mode
   */
  function playError() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * Subtle UI click feedback
   */
  function playClick() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  return {
    setMuted,
    toggleMute,
    isMuted: checkMuted,
    playSerpentMove,
    playCharLock,
    playHarvestStep,
    playComplete,
    playError,
    playClick
  };
});
