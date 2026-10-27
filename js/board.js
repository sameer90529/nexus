/**
 * NEXUS - The Cipher Realm Board Engine
 * Renders the 3D-feeling luminous rail network, glowing node matrices,
 * dynamic trajectory circuit tracks, character tiles, and harvest sequences.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexusBoard = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class CipherBoard {
    constructor(svgElement) {
      this.svg = svgElement;
      this.width = 1100;
      this.height = 520;
      this.padding = { top: 60, bottom: 60, left: 120, right: 90 };

      this.numRails = 3;
      this.numCols = 10;
      this.trajectory = [];
      this.nodes = []; // step -> { x, y, rail, col, char, element, tileG, circle }
      this.rails = []; // railIndex -> { y, lineElement, labelElement }
      
      this.layers = {
        background: null,
        rails: null,
        circuit: null,
        ripples: null,
        nodes: null,
        harvest: null,
        serpent: null
      };

      this.colorPalette = [
        { primary: '#00f0ff', secondary: '#006699', label: 'APEX / R0' },
        { primary: '#00ff9d', secondary: '#007a4d', label: 'MID-1 / R1' },
        { primary: '#bd00ff', secondary: '#660099', label: 'MID-2 / R2' },
        { primary: '#ffb703', secondary: '#996e00', label: 'NADIR / R3' },
        { primary: '#ff0077', secondary: '#990047', label: 'DEEP / R4' },
        { primary: '#3b82f6', secondary: '#1e3a8a', label: 'SUB / R5' },
        { primary: '#10b981', secondary: '#064e3b', label: 'SUB / R6' }
      ];

      this.initDefs();
      this.initLayers();
    }

    /**
     * Initializes SVG filter defs for cinematic glow, glass gradients, and drop shadows.
     */
    initDefs() {
      let defs = this.svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(defs);
      }

      defs.innerHTML = `
        <!-- Strong bloom filter -->
        <filter id="nexus-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Subtle ambient bloom filter -->
        <filter id="nexus-glow-subtle" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Amber gold glow for ciphertext -->
        <filter id="nexus-glow-amber" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix type="matrix" values="1 0 0 0 1   0.7 0 0 0 0.7   0 0 0 0 0   0 0 0 1 0" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Serpent carapace metallic gradient -->
        <linearGradient id="nexus-serpent-carapace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09272f" />
          <stop offset="60%" stop-color="#02141a" />
          <stop offset="100%" stop-color="#00ff9d" />
        </linearGradient>

        <!-- Tile glass background gradient -->
        <linearGradient id="nexus-tile-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(14, 28, 48, 0.92)" />
          <stop offset="100%" stop-color="rgba(4, 12, 24, 0.96)" />
        </linearGradient>

        <!-- Active tile highlight -->
        <linearGradient id="nexus-tile-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(0, 240, 255, 0.28)" />
          <stop offset="100%" stop-color="rgba(2, 22, 38, 0.95)" />
        </linearGradient>
      `;
    }

    /**
     * Creates dedicated SVG layers for strict z-index visual layering.
     */
    initLayers() {
      // Clear existing content except defs
      const children = Array.from(this.svg.children);
      children.forEach(c => {
        if (c.tagName.toLowerCase() !== 'defs') c.remove();
      });

      this.layers.background = this.createLayer('layer-bg');
      this.layers.rails = this.createLayer('layer-rails');
      this.layers.circuit = this.createLayer('layer-circuit');
      this.layers.ripples = this.createLayer('layer-ripples');
      this.layers.nodes = this.createLayer('layer-nodes');
      this.layers.harvest = this.createLayer('layer-harvest');
      this.layers.serpent = this.createLayer('layer-serpent');
    }

    createLayer(className) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', className);
      this.svg.appendChild(g);
      return g;
    }

    /**
     * Reconfigures and draws the complete rail realm board for given dimensions.
     */
    setupBoard(numRails, textLength, trajectory) {
      this.numRails = Math.max(1, numRails);
      this.numCols = Math.max(1, textLength);
      this.trajectory = trajectory || [];
      this.nodes = [];
      this.rails = [];

      // Dynamic SVG coordinate space
      // Keep comfortable horizontal spacing per character
      const minColSpacing = 58;
      const desiredWidth = Math.max(1000, this.padding.left + this.padding.right + this.numCols * minColSpacing);
      const desiredHeight = Math.max(460, this.padding.top + this.padding.bottom + Math.max(3, this.numRails) * 85);

      this.width = desiredWidth;
      this.height = desiredHeight;
      this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

      // Clear layers
      Object.values(this.layers).forEach(layer => {
        if (layer && layer.id !== 'nexus-serpent-layer') {
          layer.innerHTML = '';
        }
      });

      this.renderBackgroundGrid();
      this.renderRails();
      this.renderCircuitTrack();
      this.renderNodePlaceholders();
    }

    /**
     * Subtle cybernetic background void markings.
     */
    renderBackgroundGrid() {
      const g = this.layers.background;

      // Coordinate boundary brackets
      const bracketTL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bracketTL.setAttribute('d', `M 30,50 L 30,30 L 50,30`);
      bracketTL.setAttribute('stroke', '#00f0ff');
      bracketTL.setAttribute('stroke-width', '1.5');
      bracketTL.setAttribute('fill', 'none');
      bracketTL.setAttribute('opacity', '0.4');

      const bracketBR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bracketBR.setAttribute('d', `M ${this.width - 30},${this.height - 50} L ${this.width - 30},${this.height - 30} L ${this.width - 50},${this.height - 30}`);
      bracketBR.setAttribute('stroke', '#00f0ff');
      bracketBR.setAttribute('stroke-width', '1.5');
      bracketBR.setAttribute('fill', 'none');
      bracketBR.setAttribute('opacity', '0.4');

      g.appendChild(bracketTL);
      g.appendChild(bracketBR);

      // Top system status banner text in SVG
      const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      statusText.setAttribute('x', this.padding.left);
      statusText.setAttribute('y', 28);
      statusText.setAttribute('fill', 'rgba(0, 240, 255, 0.5)');
      statusText.setAttribute('font-family', 'var(--font-mono, monospace)');
      statusText.setAttribute('font-size', '11');
      statusText.setAttribute('letter-spacing', '2px');
      statusText.textContent = `NEXUS // REALM MATRIX: RAILS=${this.numRails} | CAPACITY=${this.numCols} | TRANSPOSITION_ACTIVE`;
      g.appendChild(statusText);
    }

    /**
     * Calculates coordinates for a given (col, rail).
     */
    getNodeCoordinates(col, rail) {
      const availableW = this.width - this.padding.left - this.padding.right;
      const colStep = this.numCols > 1 ? availableW / (this.numCols - 1) : availableW / 2;
      const x = this.padding.left + col * colStep;

      const availableH = this.height - this.padding.top - this.padding.bottom;
      const railStep = this.numRails > 1 ? availableH / (this.numRails - 1) : availableH / 2;
      const y = this.padding.top + rail * railStep;

      return { x, y };
    }

    /**
     * Draws luminous rails with gradient energy lines and coordinate tags.
     */
    renderRails() {
      const g = this.layers.rails;
      this.rails = [];

      for (let r = 0; r < this.numRails; r++) {
        const { y } = this.getNodeCoordinates(0, r);
        const palette = this.colorPalette[r % this.colorPalette.length];
        const railStartX = this.padding.left - 50;
        const railEndX = this.width - this.padding.right + 45;

        // Subtle perspective depth shadow
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        shadow.setAttribute('x1', railStartX);
        shadow.setAttribute('y1', y + 3);
        shadow.setAttribute('x2', railEndX);
        shadow.setAttribute('y2', y + 3);
        shadow.setAttribute('stroke', 'rgba(0, 0, 0, 0.6)');
        shadow.setAttribute('stroke-width', '4');

        // Main luminous rail energy conduit
        const railLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        railLine.setAttribute('x1', railStartX);
        railLine.setAttribute('y1', y);
        railLine.setAttribute('x2', railEndX);
        railLine.setAttribute('y2', y);
        railLine.setAttribute('stroke', palette.primary);
        railLine.setAttribute('stroke-width', '2');
        railLine.setAttribute('opacity', '0.65');
        railLine.setAttribute('filter', 'url(#nexus-glow-subtle)');
        railLine.setAttribute('class', `rail-conduit rail-conduit-${r}`);

        // Rail guide secondary dashed line
        const dashLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dashLine.setAttribute('x1', railStartX);
        dashLine.setAttribute('y1', y);
        dashLine.setAttribute('x2', railEndX);
        dashLine.setAttribute('y2', y);
        dashLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        dashLine.setAttribute('stroke-width', '1');
        dashLine.setAttribute('stroke-dasharray', '3 12');

        // Left Tag: e.g. "RAIL 00 // APEX"
        const leftTag = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        leftTag.setAttribute('transform', `translate(${this.padding.left - 105}, ${y + 4})`);

        const tagRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tagRect.setAttribute('x', '0');
        tagRect.setAttribute('y', '-14');
        tagRect.setAttribute('width', '92');
        tagRect.setAttribute('height', '20');
        tagRect.setAttribute('rx', '3');
        tagRect.setAttribute('fill', 'rgba(6, 15, 28, 0.85)');
        tagRect.setAttribute('stroke', palette.primary);
        tagRect.setAttribute('stroke-width', '1');

        const tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tagText.setAttribute('x', '46');
        tagText.setAttribute('y', '0');
        tagText.setAttribute('text-anchor', 'middle');
        tagText.setAttribute('fill', palette.primary);
        tagText.setAttribute('font-family', 'var(--font-mono, monospace)');
        tagText.setAttribute('font-size', '9.5');
        tagText.setAttribute('letter-spacing', '1px');
        tagText.setAttribute('font-weight', 'bold');
        tagText.textContent = `R-${r} ${r === 0 ? 'APEX' : (r === this.numRails - 1 ? 'NADIR' : 'PATH')}`;

        leftTag.appendChild(tagRect);
        leftTag.appendChild(tagText);

        g.appendChild(shadow);
        g.appendChild(railLine);
        g.appendChild(dashLine);
        g.appendChild(leftTag);

        this.rails.push({
          railIndex: r,
          y,
          railLine,
          palette
        });
      }

      // Column vertical guide lines and labels
      for (let c = 0; c < this.numCols; c++) {
        const { x } = this.getNodeCoordinates(c, 0);
        const colLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        colLine.setAttribute('x1', x);
        colLine.setAttribute('y1', this.padding.top - 18);
        colLine.setAttribute('x2', x);
        colLine.setAttribute('y2', this.height - this.padding.bottom + 18);
        colLine.setAttribute('stroke', 'rgba(0, 240, 255, 0.08)');
        colLine.setAttribute('stroke-width', '1');
        colLine.setAttribute('stroke-dasharray', '2 6');
        g.appendChild(colLine);

        // Column bottom label
        const colLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        colLabel.setAttribute('x', x);
        colLabel.setAttribute('y', this.height - this.padding.bottom + 34);
        colLabel.setAttribute('text-anchor', 'middle');
        colLabel.setAttribute('fill', 'rgba(0, 240, 255, 0.4)');
        colLabel.setAttribute('font-family', 'var(--font-mono, monospace)');
        colLabel.setAttribute('font-size', '9');
        colLabel.textContent = `C:${String(c).padStart(2, '0')}`;
        g.appendChild(colLabel);
      }
    }

    /**
     * Renders the zigzag trajectory circuit path connecting nodes in mathematical sequence.
     */
    renderCircuitTrack() {
      const g = this.layers.circuit;
      if (!this.trajectory || this.trajectory.length === 0) return;

      const points = this.trajectory.map(t => {
        const { x, y } = this.getNodeCoordinates(t.col, t.rail);
        return `${x},${y}`;
      }).join(' ');

      // Background glowing polyline
      const glowPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      glowPolyline.setAttribute('points', points);
      glowPolyline.setAttribute('fill', 'none');
      glowPolyline.setAttribute('stroke', 'rgba(0, 240, 255, 0.22)');
      glowPolyline.setAttribute('stroke-width', '4');
      glowPolyline.setAttribute('filter', 'url(#nexus-glow-strong)');

      // Foreground sharp dashed animated polyline
      const dashPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      dashPolyline.setAttribute('points', points);
      dashPolyline.setAttribute('fill', 'none');
      dashPolyline.setAttribute('stroke', '#00f0ff');
      dashPolyline.setAttribute('stroke-width', '1.6');
      dashPolyline.setAttribute('stroke-dasharray', '6 8');
      dashPolyline.setAttribute('class', 'nexus-circuit-track');
      dashPolyline.setAttribute('opacity', '0.7');

      g.appendChild(glowPolyline);
      g.appendChild(dashPolyline);
    }

    /**
     * Renders placeholder rings at all trajectory step nodes.
     */
    renderNodePlaceholders() {
      const g = this.layers.nodes;
      this.nodes = [];

      this.trajectory.forEach((t) => {
        const { x, y } = this.getNodeCoordinates(t.col, t.rail);
        const nodeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeG.setAttribute('class', `cipher-node-group node-step-${t.step}`);
        nodeG.setAttribute('transform', `translate(${x}, ${y})`);

        // Outer placeholder ring
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('r', '17');
        ring.setAttribute('fill', 'rgba(4, 15, 30, 0.7)');
        ring.setAttribute('stroke', 'rgba(0, 240, 255, 0.25)');
        ring.setAttribute('stroke-width', '1.2');
        ring.setAttribute('class', 'node-target-ring');

        // Center crosshair / dot
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '2.5');
        dot.setAttribute('fill', 'rgba(0, 240, 255, 0.35)');

        // Step index mini text
        const stepText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stepText.setAttribute('y', '3');
        stepText.setAttribute('text-anchor', 'middle');
        stepText.setAttribute('fill', 'rgba(0, 240, 255, 0.3)');
        stepText.setAttribute('font-family', 'var(--font-mono, monospace)');
        stepText.setAttribute('font-size', '8');
        stepText.textContent = t.step;

        nodeG.appendChild(ring);
        nodeG.appendChild(dot);
        nodeG.appendChild(stepText);
        g.appendChild(nodeG);

        this.nodes.push({
          step: t.step,
          col: t.col,
          rail: t.rail,
          dir: t.dir,
          x,
          y,
          element: nodeG,
          ring,
          tile: null,
          isLocked: false
        });
      });
    }

    /**
     * Triggered when a character is locked into place at step index.
     * Generates:
     * 1. Energy shockwave ripple
     * 2. Active rail beam pulse
     * 3. Locked character tile with glowing letter and coordinate badge
     */
    lockCharacterAt(stepIndex, char, options = {}) {
      const node = this.nodes[stepIndex];
      if (!node) return;

      node.isLocked = true;
      node.char = char;

      // 1. Energy ripple on the ripple layer
      this.triggerEnergyRipple(node.x, node.y, options.color || '#00f0ff');

      // 2. Pulse active rail
      this.pulseRail(node.rail);

      // 3. Create or reveal character tile
      if (node.tile) {
        node.tile.remove();
      }

      const tileG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tileG.setAttribute('class', 'locked-char-tile animate-pop-in');

      // Diamond / Hexagon shape or rounded rectangle badge
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-18');
      rect.setAttribute('y', '-18');
      rect.setAttribute('width', '36');
      rect.setAttribute('height', '36');
      rect.setAttribute('rx', '7');
      rect.setAttribute('fill', 'url(#nexus-tile-grad)');
      rect.setAttribute('stroke', options.color || '#00ff9d');
      rect.setAttribute('stroke-width', '1.8');
      rect.setAttribute('filter', 'url(#nexus-glow-strong)');

      // Corner technical accent line
      const corner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      corner.setAttribute('d', 'M -18,-10 L -18,-18 L -10,-18');
      corner.setAttribute('stroke', '#ffffff');
      corner.setAttribute('stroke-width', '1.5');
      corner.setAttribute('fill', 'none');

      // Letter text
      const letter = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      letter.setAttribute('x', '0');
      letter.setAttribute('y', '6');
      letter.setAttribute('text-anchor', 'middle');
      letter.setAttribute('fill', options.letterColor || '#ffffff');
      letter.setAttribute('font-family', 'var(--font-display, "Orbitron", sans-serif)');
      letter.setAttribute('font-size', '17');
      letter.setAttribute('font-weight', 'bold');
      letter.setAttribute('letter-spacing', '0px');
      letter.textContent = char;

      // Micro coordinate subtext
      const coord = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      coord.setAttribute('x', '0');
      coord.setAttribute('y', '15');
      coord.setAttribute('text-anchor', 'middle');
      coord.setAttribute('fill', 'rgba(0, 240, 255, 0.6)');
      coord.setAttribute('font-family', 'var(--font-mono, monospace)');
      coord.setAttribute('font-size', '6.5');
      coord.textContent = `R${node.rail}`;

      tileG.appendChild(rect);
      tileG.appendChild(corner);
      tileG.appendChild(letter);
      tileG.appendChild(coord);

      node.element.appendChild(tileG);
      node.tile = tileG;
      node.rect = rect;
      node.letter = letter;

      // Hide placeholder dot and ring
      if (node.ring) node.ring.style.opacity = '0';
    }

    /**
     * Circular expanding energy shockwave.
     */
    triggerEnergyRipple(x, y, color = '#00f0ff') {
      const g = this.layers.ripples;
      const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ripple.setAttribute('cx', x);
      ripple.setAttribute('cy', y);
      ripple.setAttribute('r', '15');
      ripple.setAttribute('fill', 'none');
      ripple.setAttribute('stroke', color);
      ripple.setAttribute('stroke-width', '2.5');
      ripple.setAttribute('filter', 'url(#nexus-glow-strong)');
      ripple.style.transition = 'r 0.45s ease-out, opacity 0.45s ease-out, stroke-width 0.45s ease-out';
      ripple.style.opacity = '1';

      g.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.setAttribute('r', '46');
        ripple.setAttribute('stroke-width', '0.5');
        ripple.style.opacity = '0';
      });

      setTimeout(() => {
        if (ripple.parentNode) ripple.remove();
      }, 500);
    }

    /**
     * Energy surge pulse along a specific rail.
     */
    pulseRail(railIndex) {
      const rail = this.rails[railIndex];
      if (!rail || !rail.railLine) return;

      rail.railLine.style.stroke = '#ffffff';
      rail.railLine.style.strokeWidth = '3.5';
      rail.railLine.style.opacity = '1';

      setTimeout(() => {
        if (rail.railLine) {
          rail.railLine.style.transition = 'stroke 0.4s ease, stroke-width 0.4s ease, opacity 0.4s ease';
          rail.railLine.style.stroke = rail.palette.primary;
          rail.railLine.style.strokeWidth = '2';
          rail.railLine.style.opacity = '0.65';
        }
      }, 80);
    }

    /**
     * Highlights an individual node temporarily (e.g. current target or active).
     */
    highlightNode(stepIndex, active = true) {
      const node = this.nodes[stepIndex];
      if (!node) return;

      if (node.ring && !node.isLocked) {
        node.ring.setAttribute('stroke', active ? '#00ff9d' : 'rgba(0, 240, 255, 0.25)');
        node.ring.setAttribute('stroke-width', active ? '2.5' : '1.2');
        node.ring.setAttribute('filter', active ? 'url(#nexus-glow-strong)' : 'none');
      }
    }

    /**
     * Cinematic Row-by-Row Harvesting Animation:
     * Sweeps each rail row from top to bottom, highlights characters, and triggers callback.
     */
    animateHarvestSequence(harvestOrder, onStep, onComplete) {
      if (!harvestOrder || harvestOrder.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      let currentIndex = 0;
      const total = harvestOrder.length;

      // Highlight active rail
      const stepHarvest = () => {
        if (currentIndex >= total) {
          if (onComplete) onComplete();
          return;
        }

        const item = harvestOrder[currentIndex];
        const node = this.nodes[item.step];

        if (node && node.rect && node.letter) {
          // Glow gold / amber
          node.rect.setAttribute('stroke', '#ffb703');
          node.rect.setAttribute('filter', 'url(#nexus-glow-amber)');
          node.letter.setAttribute('fill', '#ffb703');

          // Trigger ripple
          this.triggerEnergyRipple(node.x, node.y, '#ffb703');
          this.pulseRail(node.rail);
        }

        if (onStep) {
          onStep(item, currentIndex, total);
        }

        currentIndex++;
        setTimeout(stepHarvest, 180);
      };

      stepHarvest();
    }

    /**
     * Pre-populates all character positions on rails for Decryption mode.
     * Visually demonstrates how the ciphertext is partitioned across rails.
     */
    populateDecryptionMatrix(railBuckets) {
      this.reset();
      if (!railBuckets) return;

      railBuckets.forEach(bucket => {
        bucket.forEach(item => {
          this.lockCharacterAt(item.step, item.char, {
            color: '#ffb703', // Amber gold for ciphertext on rails
            letterColor: '#ffb703'
          });
        });
      });
    }

    /**
     * Activates a pre-loaded decryption node as the serpent reads it.
     * Transforms amber ciphertext tile into vibrant emerald plaintext.
     */
    activateDecryptionStep(stepIndex) {
      const node = this.nodes[stepIndex];
      if (!node) return;

      this.triggerEnergyRipple(node.x, node.y, '#00ff9d');
      this.pulseRail(node.rail);

      if (node.rect) {
        node.rect.setAttribute('stroke', '#00ff9d');
        node.rect.setAttribute('filter', 'url(#nexus-glow-strong)');
      }
      if (node.letter) {
        node.letter.setAttribute('fill', '#ffffff');
      }
    }

    /**
     * Resets the board visual state.
     */
    reset() {
      this.nodes.forEach(node => {
        node.isLocked = false;
        node.char = null;
        if (node.tile) {
          node.tile.remove();
          node.tile = null;
        }
        if (node.ring) {
          node.ring.style.opacity = '1';
          node.ring.setAttribute('stroke', 'rgba(0, 240, 255, 0.25)');
          node.ring.setAttribute('stroke-width', '1.2');
          node.ring.setAttribute('filter', 'none');
        }
      });
    }
  }

  return CipherBoard;
});
