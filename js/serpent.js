/**
 * NEXUS - THE KEYKEEPER (The Cipher Serpent)
 * Sleek, segmented cybernetic creature with articulated body segments,
 * luminous ocular core, dynamic orientation, and energy trail emission.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexusSerpent = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class KeykeeperSerpent {
    constructor() {
      this.svg = null;
      this.group = null;
      this.headGroup = null;
      this.segmentsGroup = null;
      this.trailGroup = null;

      this.numSegments = 7;
      this.segments = []; // array of { x, y, r, element }
      this.history = []; // trail of recent head positions for smooth organic trailing
      this.maxHistory = 60;

      this.x = 0;
      this.y = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.angle = 0; // degrees
      this.targetAngle = 0;

      this.isMoving = false;
      this.moveStartTime = 0;
      this.moveDuration = 400; // ms
      this.startX = 0;
      this.startY = 0;
      this.onArrivalCallback = null;

      this.particles = [];
      this.maxParticles = 25;
      this.lastParticleTime = 0;
      this.visible = false;
    }

    /**
     * Initializes SVG elements for the serpent.
     */
    init(svgContainer) {
      this.svg = svgContainer;

      // Clean existing if re-initializing
      const existing = svgContainer.querySelector('#nexus-serpent-layer');
      if (existing) existing.remove();

      this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.group.setAttribute('id', 'nexus-serpent-layer');
      this.group.setAttribute('class', 'nexus-serpent');
      this.group.style.opacity = '0';
      this.group.style.transition = 'opacity 0.4s ease';

      // Layer 1: Trail particles
      this.trailGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.trailGroup.setAttribute('class', 'serpent-trail-layer');
      this.group.appendChild(this.trailGroup);

      // Layer 2: Body segments
      this.segmentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.segmentsGroup.setAttribute('class', 'serpent-body-layer');
      this.group.appendChild(this.segmentsGroup);

      // Layer 3: Head group
      this.headGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.headGroup.setAttribute('class', 'serpent-head-layer');
      this.renderHead();
      this.group.appendChild(this.headGroup);

      // Create body segments
      this.segments = [];
      const radii = [9, 8, 7, 6, 5, 4, 3];
      for (let i = 0; i < this.numSegments; i++) {
        const segG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        segG.setAttribute('class', `serpent-segment segment-${i}`);

        // Outer glass ring
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerCircle.setAttribute('r', radii[i] || 4);
        outerCircle.setAttribute('fill', 'rgba(0, 240, 255, 0.12)');
        outerCircle.setAttribute('stroke', i % 2 === 0 ? '#00ff9d' : '#00f0ff');
        outerCircle.setAttribute('stroke-width', '1.5');
        outerCircle.setAttribute('filter', 'url(#nexus-glow-subtle)');

        // Inner glowing core
        const coreCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        coreCircle.setAttribute('r', (radii[i] || 4) * 0.4);
        coreCircle.setAttribute('fill', '#00ff9d');
        coreCircle.setAttribute('opacity', '0.85');

        segG.appendChild(outerCircle);
        segG.appendChild(coreCircle);
        this.segmentsGroup.appendChild(segG);

        this.segments.push({
          x: 0,
          y: 0,
          r: radii[i] || 4,
          element: segG
        });
      }

      this.svg.appendChild(this.group);
      this.visible = false;
    }

    renderHead() {
      // Sleek Cybernetic Carapace
      const carapace = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      // Forward pointing arrowhead: x+ is forward
      carapace.setAttribute('points', '18,0 4,-11 -12,-7 -16,0 -12,7 4,11');
      carapace.setAttribute('fill', 'url(#nexus-serpent-carapace)');
      carapace.setAttribute('stroke', '#00ff9d');
      carapace.setAttribute('stroke-width', '2');
      carapace.setAttribute('filter', 'url(#nexus-glow-strong)');

      // Visor / Ocular Core
      const visor = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      visor.setAttribute('points', '14,0 5,-5 2,0 5,5');
      visor.setAttribute('fill', '#00f0ff');
      visor.setAttribute('filter', 'url(#nexus-glow-strong)');

      // Micro Antennae / Energy Prongs
      const prongTop = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      prongTop.setAttribute('x1', '6');
      prongTop.setAttribute('y1', '-9');
      prongTop.setAttribute('x2', '14');
      prongTop.setAttribute('y2', '-14');
      prongTop.setAttribute('stroke', '#00f0ff');
      prongTop.setAttribute('stroke-width', '1.5');
      prongTop.setAttribute('stroke-linecap', 'round');

      const prongBtm = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      prongBtm.setAttribute('x1', '6');
      prongBtm.setAttribute('y1', '9');
      prongBtm.setAttribute('x2', '14');
      prongBtm.setAttribute('y2', '14');
      prongBtm.setAttribute('stroke', '#00f0ff');
      prongBtm.setAttribute('stroke-width', '1.5');
      prongBtm.setAttribute('stroke-linecap', 'round');

      // Central Quantum Heart pulse dot
      const heart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      heart.setAttribute('cx', '-3');
      heart.setAttribute('cy', '0');
      heart.setAttribute('r', '3.5');
      heart.setAttribute('fill', '#ffffff');
      heart.setAttribute('filter', 'url(#nexus-glow-strong)');

      this.headGroup.appendChild(carapace);
      this.headGroup.appendChild(prongTop);
      this.headGroup.appendChild(prongBtm);
      this.headGroup.appendChild(visor);
      this.headGroup.appendChild(heart);
    }

    /**
     * Teleports the serpent immediately to a coordinate without trailing latency.
     */
    spawnAt(x, y, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = x;
      this.targetY = y;
      this.startX = x;
      this.startY = y;
      this.isMoving = false;

      // Calculate initial facing angle
      const dx = (targetX !== undefined ? targetX : x + 10) - x;
      const dy = (targetY !== undefined ? targetY : y) - y;
      this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.targetAngle = this.angle;

      // Fill history array with starting position
      this.history = [];
      for (let i = 0; i < this.maxHistory; i++) {
        this.history.push({ x, y, angle: this.angle });
      }

      // Position segments
      this.segments.forEach(seg => {
        seg.x = x;
        seg.y = y;
        seg.element.setAttribute('transform', `translate(${x}, ${y})`);
      });

      this.updateHeadTransform();
      this.show();
    }

    show() {
      if (this.group) {
        this.group.style.opacity = '1';
        this.visible = true;
      }
    }

    hide() {
      if (this.group) {
        this.group.style.opacity = '0';
        this.visible = false;
      }
    }

    /**
     * Begins fluid deterministic interpolation to target coordinate.
     */
    moveTo(targetX, targetY, durationMs, onArrival) {
      this.startX = this.x;
      this.startY = this.y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.moveStartTime = performance.now();
      this.moveDuration = Math.max(80, durationMs || 350);
      this.isMoving = true;
      this.onArrivalCallback = onArrival || null;

      // Compute heading angle
      const dx = targetX - this.startX;
      const dy = targetY - this.startY;
      if (Math.hypot(dx, dy) > 1) {
        this.targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }

    /**
     * Cubic bezier / smoothstep easing for premium fluid motion.
     */
    ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Angle interpolation handling 360-degree wrapping.
     */
    lerpAngle(a, b, t) {
      let diff = (b - a) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return a + diff * t;
    }

    /**
     * Spawns a luminous energy spark particle behind the serpent.
     */
    emitSpark(x, y) {
      if (!this.trailGroup) return;

      const p = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const r = 1 + Math.random() * 2;
      const life = 500; // ms
      const color = Math.random() > 0.4 ? '#00f0ff' : '#00ff9d';

      p.setAttribute('cx', x + (Math.random() - 0.5) * 8);
      p.setAttribute('cy', y + (Math.random() - 0.5) * 8);
      p.setAttribute('r', r);
      p.setAttribute('fill', color);
      p.setAttribute('filter', 'url(#nexus-glow-subtle)');
      p.style.opacity = '0.9';
      p.style.transition = `opacity ${life}ms ease-out, transform ${life}ms ease-out`;

      this.trailGroup.appendChild(p);

      const particleObj = {
        element: p,
        birth: performance.now(),
        life,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15
      };
      this.particles.push(particleObj);

      // Trigger fade out
      requestAnimationFrame(() => {
        p.style.opacity = '0';
        p.setAttribute('transform', `translate(${particleObj.vx}, ${particleObj.vy}) scale(0.2)`);
      });

      // Cleanup
      setTimeout(() => {
        if (p.parentNode) p.remove();
        const idx = this.particles.indexOf(particleObj);
        if (idx !== -1) this.particles.splice(idx, 1);
      }, life);
    }

    /**
     * Frame update call. Called in requestAnimationFrame loop.
     */
    update(currentTime) {
      if (!this.visible) return;

      if (this.isMoving) {
        const elapsed = currentTime - this.moveStartTime;
        const progress = Math.min(1, elapsed / this.moveDuration);
        const eased = this.ease(progress);

        this.x = this.startX + (this.targetX - this.startX) * eased;
        this.y = this.startY + (this.targetY - this.startY) * eased;
        this.angle = this.lerpAngle(this.angle, this.targetAngle, 0.22);

        // Emit particles while moving
        if (currentTime - this.lastParticleTime > 45) {
          this.emitSpark(this.x, this.y);
          this.lastParticleTime = currentTime;
        }

        if (progress >= 1) {
          this.x = this.targetX;
          this.y = this.targetY;
          this.isMoving = false;
          if (typeof this.onArrivalCallback === 'function') {
            const cb = this.onArrivalCallback;
            this.onArrivalCallback = null;
            cb();
          }
        }
      } else {
        // Idle gentle float / hover
        const hoverOffset = Math.sin(currentTime * 0.003) * 1.5;
        this.headGroup.setAttribute('transform', `translate(${this.x}, ${this.y + hoverOffset}) rotate(${this.angle})`);
      }

      // Record head position into history buffer
      this.history.unshift({ x: this.x, y: this.y, angle: this.angle });
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }

      // Update head transform if moving
      if (this.isMoving) {
        this.updateHeadTransform();
      }

      // Update trailing body segments using history spacing
      const spacing = 4; // history frames between segments
      for (let i = 0; i < this.segments.length; i++) {
        const historyIndex = Math.min((i + 1) * spacing, this.history.length - 1);
        const snapshot = this.history[historyIndex] || { x: this.x, y: this.y, angle: this.angle };
        const seg = this.segments[i];
        seg.x = snapshot.x;
        seg.y = snapshot.y;
        seg.element.setAttribute('transform', `translate(${snapshot.x}, ${snapshot.y})`);
      }
    }

    updateHeadTransform() {
      this.headGroup.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.angle})`);
    }
  }

  return KeykeeperSerpent;
});
