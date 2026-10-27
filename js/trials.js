/**
 * NEXUS - THE CRYPTANALYST TRIALS
 * Arcade challenge mode with progressive difficulty tiers, time attack,
 * streak multipliers, character-by-character accuracy breakdown, and scoring.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexusTrials = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHALLENGE_POOLS = {
    initiate: [
      { text: 'CIPHER', rails: 2 },
      { text: 'SECRET', rails: 3 },
      { text: 'ENERGY', rails: 2 },
      { text: 'MATRIX', rails: 3 },
      { text: 'SHADOW', rails: 2 },
      { text: 'NEXUS', rails: 3 },
      { text: 'VECTOR', rails: 2 },
      { text: 'SIGNAL', rails: 3 }
    ],
    operative: [
      { text: 'CYBERPULSE', rails: 3 },
      { text: 'QUANTUMPATH', rails: 4 },
      { text: 'DEFENDTHEGRID', rails: 3 },
      { text: 'NEURALNETWORK', rails: 4 },
      { text: 'BIOLUMINESCE', rails: 3 },
      { text: 'CRYPTANALYST', rails: 4 },
      { text: 'SILENTSTORM', rails: 3 }
    ],
    master: [
      { text: 'TRANSPOSITIONCIPHER', rails: 4 },
      { text: 'THEPATHHIDESASECRET', rails: 5 },
      { text: 'KEYKEEPEROFTHENEXUS', rails: 4 },
      { text: 'EVERYLETTERHASAPATH', rails: 5 },
      { text: 'BIOLUMINESCENTCIPHER', rails: 6 }
    ]
  };

  class CryptanalystTrials {
    constructor(cipherEngine, audioEngine) {
      this.cipher = cipherEngine || (typeof window !== 'undefined' ? window.NexusCipher : null);
      this.audio = audioEngine || (typeof window !== 'undefined' ? window.NexusAudio : null);

      this.currentTier = 'initiate';
      this.currentChallenge = null;
      this.score = 0;
      this.highScore = 0;
      this.streak = 0;
      this.timeRemaining = 0;
      this.timerInterval = null;
      this.attemptsLeft = 3;

      this.loadHighScore();
    }

    loadHighScore() {
      try {
        const saved = localStorage.getItem('nexus_high_score');
        if (saved) this.highScore = parseInt(saved, 10) || 0;
      } catch (e) {}
    }

    saveHighScore() {
      try {
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('nexus_high_score', String(this.highScore));
        }
      } catch (e) {}
    }

    /**
     * Generates a new challenge for the specified tier.
     */
    startChallenge(tier = 'initiate', onTimerTick, onTimeExpired) {
      this.currentTier = tier;
      this.clearInterval();

      const pool = CHALLENGE_POOLS[tier] || CHALLENGE_POOLS.initiate;
      const pick = pool[Math.floor(Math.random() * pool.length)];

      const expected = this.cipher.encrypt(pick.text, pick.rails).ciphertext;

      let timeLimit = 0;
      if (tier === 'operative') timeLimit = 45;
      if (tier === 'master') timeLimit = 30;

      this.timeRemaining = timeLimit;
      this.attemptsLeft = tier === 'master' ? 2 : 3;

      this.currentChallenge = {
        plaintext: pick.text,
        rails: pick.rails,
        expectedCiphertext: expected,
        tier,
        timeLimit,
        startTime: Date.now()
      };

      if (timeLimit > 0) {
        this.timerInterval = setInterval(() => {
          this.timeRemaining--;
          if (typeof onTimerTick === 'function') {
            onTimerTick(this.timeRemaining);
          }
          if (this.timeRemaining <= 0) {
            this.clearInterval();
            if (typeof onTimeExpired === 'function') {
              onTimeExpired();
            }
          }
        }, 1000);
      }

      return this.currentChallenge;
    }

    clearInterval() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    /**
     * Evaluates the player submission against the expected ciphertext.
     */
    evaluateSubmission(rawSubmission) {
      this.clearInterval();
      const submission = String(rawSubmission || '').trim().toUpperCase();
      const expected = this.currentChallenge.expectedCiphertext;
      const maxLen = Math.max(submission.length, expected.length);

      let correctChars = 0;
      const characterDiff = [];

      for (let i = 0; i < maxLen; i++) {
        const subChar = submission[i] || '';
        const expChar = expected[i] || '';
        const isMatch = subChar === expChar;

        if (isMatch) correctChars++;

        characterDiff.push({
          index: i,
          playerChar: subChar,
          expectedChar: expChar,
          correct: isMatch
        });
      }

      const accuracy = expected.length > 0 ? (correctChars / expected.length) : 0;
      const isPerfect = submission === expected;

      let pointsEarned = 0;
      if (isPerfect) {
        this.streak++;
        const basePoints = this.currentTier === 'master' ? 2500 : (this.currentTier === 'operative' ? 1000 : 500);
        const timeBonus = this.timeRemaining * 20;
        const streakBonus = (this.streak - 1) * 150;
        pointsEarned = basePoints + timeBonus + streakBonus;
        this.score += pointsEarned;
        this.saveHighScore();
        if (this.audio) this.audio.playComplete();
      } else {
        this.streak = 0;
        pointsEarned = Math.round(accuracy * 200);
        this.score += pointsEarned;
        if (this.audio) this.audio.playError();
      }

      return {
        isPerfect,
        accuracy: Math.round(accuracy * 100),
        correctCount: correctChars,
        totalExpected: expected.length,
        characterDiff,
        submission,
        expected,
        pointsEarned,
        totalScore: this.score,
        highScore: this.highScore,
        streak: this.streak,
        tier: this.currentTier
      };
    }

    resetSession() {
      this.clearInterval();
      this.score = 0;
      this.streak = 0;
      this.currentChallenge = null;
    }
  }

  return CryptanalystTrials;
});
