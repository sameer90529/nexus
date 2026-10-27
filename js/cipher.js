/**
 * NEXUS - The Rail Fence Cipher Engine
 * Pure mathematical implementation of the classical Rail Fence (Zigzag) transposition cipher.
 * Deterministic, invariant-preserving, and edge-case resilient.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexusCipher = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Normalizes input text based on configuration.
   * @param {string} text 
   * @param {object} options { uppercase: boolean, stripSpaces: boolean, lettersOnly: boolean }
   * @returns {string}
   */
  function normalizeText(text, options = {}) {
    if (typeof text !== 'string') return '';
    let result = text;
    if (options.uppercase !== false) {
      result = result.toUpperCase();
    }
    if (options.lettersOnly) {
      result = result.replace(/[^A-Z]/g, '');
    } else if (options.stripSpaces) {
      result = result.replace(/\s+/g, '');
    }
    return result;
  }

  /**
   * Computes the deterministic Rail Fence zigzag trajectory.
   * @param {number} length 
   * @param {number} numRails 
   * @returns {Array<{step: number, col: number, rail: number, dir: number}>}
   */
  function getRailTrajectory(length, numRails) {
    if (length <= 0 || numRails <= 0) return [];
    const trajectory = [];
    
    if (numRails === 1) {
      for (let i = 0; i < length; i++) {
        trajectory.push({ step: i, col: i, rail: 0, dir: 0 });
      }
      return trajectory;
    }

    let currentRail = 0;
    let direction = 1; // +1 = downwards, -1 = upwards

    for (let i = 0; i < length; i++) {
      trajectory.push({
        step: i,
        col: i,
        rail: currentRail,
        dir: direction
      });

      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === numRails - 1) {
        direction = -1;
      }
      currentRail += direction;
    }

    return trajectory;
  }

  /**
   * Encrypts plaintext using Rail Fence transposition.
   * @param {string} plaintext 
   * @param {number} numRails 
   * @returns {object} { ciphertext, trajectory, railBuckets, matrix }
   */
  function encrypt(plaintext, numRails) {
    const text = String(plaintext || '');
    const railsCount = Math.max(1, parseInt(numRails, 10) || 1);
    const len = text.length;

    if (len === 0) {
      return {
        plaintext: '',
        ciphertext: '',
        numRails: railsCount,
        trajectory: [],
        railBuckets: Array.from({ length: railsCount }, () => []),
        harvestOrder: []
      };
    }

    const trajectory = getRailTrajectory(len, railsCount);
    const railBuckets = Array.from({ length: railsCount }, () => []);

    trajectory.forEach((node) => {
      const char = text[node.step];
      const item = {
        char,
        step: node.step,
        col: node.col,
        rail: node.rail,
        dir: node.dir
      };
      railBuckets[node.rail].push(item);
    });

    let ciphertext = '';
    const harvestOrder = [];

    for (let r = 0; r < railsCount; r++) {
      for (let k = 0; k < railBuckets[r].length; k++) {
        const item = railBuckets[r][k];
        ciphertext += item.char;
        harvestOrder.push(item);
      }
    }

    return {
      plaintext: text,
      ciphertext,
      numRails: railsCount,
      trajectory,
      railBuckets,
      harvestOrder
    };
  }

  /**
   * Decrypts ciphertext using Rail Fence transposition.
   * Deterministically calculates rail occupancy and reconstructs plaintext.
   * @param {string} ciphertext 
   * @param {number} numRails 
   * @returns {object} { plaintext, ciphertext, trajectory, railBuckets, reconstructOrder }
   */
  function decrypt(ciphertext, numRails) {
    const cipher = String(ciphertext || '');
    const railsCount = Math.max(1, parseInt(numRails, 10) || 1);
    const len = cipher.length;

    if (len === 0) {
      return {
        plaintext: '',
        ciphertext: '',
        numRails: railsCount,
        trajectory: [],
        railBuckets: Array.from({ length: railsCount }, () => []),
        reconstructOrder: []
      };
    }

    if (railsCount === 1) {
      return {
        plaintext: cipher,
        ciphertext: cipher,
        numRails: 1,
        trajectory: getRailTrajectory(len, 1),
        railBuckets: [cipher.split('').map((char, i) => ({ char, step: i, col: i, rail: 0, dir: 0 }))],
        reconstructOrder: []
      };
    }

    // Step 1: Compute empty trajectory positions
    const trajectory = getRailTrajectory(len, railsCount);

    // Count how many characters belong to each rail
    const railCounts = new Array(railsCount).fill(0);
    trajectory.forEach(node => {
      railCounts[node.rail]++;
    });

    // Step 2: Slice ciphertext into buckets corresponding to each rail
    const railBuckets = [];
    let cipherIndex = 0;
    for (let r = 0; r < railsCount; r++) {
      const count = railCounts[r];
      const chars = cipher.slice(cipherIndex, cipherIndex + count).split('');
      railBuckets.push(chars);
      cipherIndex += count;
    }

    // Step 3: Walk the trajectory again and pick characters from the heads of the rail buckets
    const bucketPointers = new Array(railsCount).fill(0);
    const reconstructedChars = new Array(len);
    const reconstructOrder = [];
    const populatedBuckets = Array.from({ length: railsCount }, () => []);

    trajectory.forEach((node) => {
      const r = node.rail;
      const char = railBuckets[r][bucketPointers[r]];
      bucketPointers[r]++;
      
      reconstructedChars[node.step] = char;
      const item = {
        char,
        step: node.step,
        col: node.col,
        rail: node.rail,
        dir: node.dir
      };
      populatedBuckets[r].push(item);
      reconstructOrder.push(item);
    });

    const plaintext = reconstructedChars.join('');

    return {
      plaintext,
      ciphertext: cipher,
      numRails: railsCount,
      trajectory,
      railBuckets: populatedBuckets,
      reconstructOrder
    };
  }

  /**
   * Verifies identity invariant: DECRYPT(ENCRYPT(message, key), key) === message
   */
  function verifyCipherInvariant(message, key) {
    const encrypted = encrypt(message, key);
    const decrypted = decrypt(encrypted.ciphertext, key);
    return {
      valid: decrypted.plaintext === message,
      original: message,
      ciphertext: encrypted.ciphertext,
      recovered: decrypted.plaintext,
      key
    };
  }

  return {
    normalizeText,
    getRailTrajectory,
    encrypt,
    decrypt,
    verifyCipherInvariant
  };
});
