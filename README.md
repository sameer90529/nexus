# NEXUS // THE RAIL FENCE CIPHER EXPERIENCE
### THE ART OF SECRET MESSAGES

> *“Every letter has a path. Every path hides a secret.”*

---

## Overview

**NEXUS** is an extraordinary, visually breathtaking, fully functional interactive cryptography application. Designed with the signature aesthetic **“Bioluminescent Cryptography”**, it combines the visual sophistication of a futuristic sci-fi interface, the atmosphere of a cybernetic terminal, and the fluid mechanical elegance of classic arcade games.

The game teaches the classical **Rail Fence (Zigzag) Transposition Cipher** through real-time deterministic animation, interactive letter placement, row harvesting, and authentic bidirectional encryption and decryption.

---

## Key Features

1. **The Grand Opening — Cinematic Intro**
   - Luminous geometric symbol in a deep obsidian digital void.
   - Drifting cyber-constellation particle field.
   - Animated zigzag path with the Keykeeper serpent awakening.
   - Direct access to **Enter the System** or explore **How It Works** (skippable at any time with `ESC`).

2. **The Cipher Realm — Central Visual Centerpiece**
   - Suspended 3D-feeling luminous energy rails with gradient conduits, technical coordinates (`APEX / R0`, `INTERMEDIATE / R1`, `NADIR / R2`), and column indicators (`C00`, `C01`...).
   - High-fidelity SVG rendering with hardware-accelerated filters, drop-shadows, and dynamic viewBox scaling.
   - Glowing placeholder nodes and active rail energy shockwaves.

3. **The Keykeeper — Signature Cybernetic Serpent**
   - Distinctive segmented cybernetic creature with an illuminated ocular core, forward carapace, and 7 articulated trailing energy segments.
   - Strict adherence to the mathematical Rail Fence algorithm: starts at Rail 0, descends downward, bounces at the nadir rail, ascends upward, and bounces at the apex.
   - Smooth cubic-bezier acceleration/deceleration, rotation orientation matching trajectory vectors, and trailing energy spark emissions.

4. **Interactive Command Console**
   - **Plaintext & Ciphertext Input**: Large input field with preset chip quick-selectors (`HELLOWORLD`, `NEXUSCIPHER`, `DEFENDTHEGRID`, `SECRETPROTOCOL`, `BIOLUMINESCENCE`).
   - **Stepped Rail Key Selector**: 2, 3, 4, 5, or 6 rails with instant dynamic matrix recalculation.
   - **Mode Switch**: Instant toggle between **ENCRYPT** and **DECRYPT**.
   - **Speed Control**: `Slow (1x)`, `Normal (2x)`, and `Hyper (5x)`.
   - **Normalization Policy**: Classical cryptographic mode (`A-Z uppercase, spaces stripped`) or Raw Character preservation.

5. **Letter-by-Letter Gameplay & Manual Typing Mode**
   - **Cinematic Auto-Play**: Automatically animates the Keykeeper placing each character with audio chimes and rail ripples.
   - **Manual Mode**: Press **Next Step** or type the exact expected character on your keyboard!
   - Index-based character placement strictly preserves repeated characters (e.g., both `L`s in `HELLOWORLD`).

6. **The Moment of Transformation — Row-by-Row Harvesting**
   - When the final character is positioned, the completed zigzag illuminates.
   - Characters are collected rail-by-rail (Rail 0, then Rail 1, then Rail 2) with an ascending cyber-arpeggio.
   - Produces canonical ciphertext: `HELLOWORLD` (Key 3) → `HOLELWRDLO`.
   - Displays: *“POSITION CHANGES. MESSAGE PRESERVED.”* with one-click copy to clipboard.

7. **Genuine Decryption — Reconstructing the Hidden Path**
   - Reconstructs the exact rail partition matrix for the given key and ciphertext length.
   - Pre-populates rails with ciphertext characters in amber/gold.
   - The Keykeeper traces the zigzag path step-by-step, transforming each character into radiant emerald and progressively reconstructing the plaintext.
   - Verified with the fundamental cryptographic invariant:
     $$\text{DECRYPT}(\text{ENCRYPT}(M, K), K) = M$$

8. **Mission Control Telemetry HUD**
   - **The Original Message**: Plaintext monitor with emerald highlights.
   - **The Cipher Monitor**: Real-time harvested ciphertext monitor with amber accents.
   - **The Live Character Inspector**: Character glyph, index, rail coordinates, and vector direction (`↓` / `↑`).
   - **The Signal Meter**: Cybernetic progress bar and completion percentage.
   - **The Key Observatory**: Rail count and period cycle frequency: $2(K - 1)$.

9. **Arcade Challenge Mode — “The Cryptanalyst Trials”**
   - Three escalating difficulty tiers:
     - **INITIATE**: Short phrases, 2–3 rails, relaxed pacing.
     - **OPERATIVE**: Medium transmissions, 3–4 rails, 45-second timer.
     - **MASTER CRYPTANALYST**: Complex ciphers, 4–6 rails, 30-second time challenge.
   - Character-by-character visual diff highlighting matches and mistakes.
   - Scoring system with time bonuses and streak multipliers.
   - **“Visualize in Cipher Realm”** button to immediately watch the Keykeeper solve any challenge!

10. **Procedural Web Audio API Engine**
    - 100% synthesized in the browser without external audio files.
    - Serpent movement sub-pulses, crystal resonance placement chimes, ascending harvest arpeggios, and harmonic completion chords.
    - Muted by default per specifications; toggleable anytime via top HUD or keyboard shortcut `M`.

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Toggle Play / Pause (Auto-play) |
| `→` (Right Arrow) | Step Forward (Manual mode) |
| `A-Z / 0-9` | Type Next Character in Manual Mode |
| `R` | Reset Cipher Realm |
| `M` | Toggle Audio (Mute / Unmute) |
| `Esc` | Dismiss Intro Screen / Close Active Modal |

---

## Mathematical Verification

The engine is covered by an automated test suite verifying edge cases:
- Canonical test: `HELLOWORLD` on 3 rails produces `HOLELWRDLO`.
- Identity verification: `DECRYPT(ENCRYPT(message, key), key) === message`.
- Edge cases: Single rail ($K=1$), key larger than message length ($K \ge N$), repeated characters, empty strings, and long multi-word phrases.

To run the test suite:
```bash
node test/cipher.test.js
node test/validate_dom.js
```

---

## Technology Stack

- **HTML5 & Modern CSS**: CSS Variables, Backdrop Filters, Flexbox & Grid, CSS Keyframe Animations.
- **Vanilla JavaScript (ES6+)**: Zero framework bloat, modular architecture, 60fps performance on modest hardware (4GB RAM).
- **Scalable Vector Graphics (SVG)**: Vector rails, blooming filters, and dynamic node matrices.
- **Web Audio API**: Procedural frequency synthesis.
- **Zero External Runtime Dependencies**: Works offline and directly via `file:///` or any static HTTP server.

---

*Engineered with precision for the ultimate interactive cryptography experience.*
