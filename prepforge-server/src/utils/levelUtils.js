const { LEVEL_THRESHOLDS } = require('../config/constants');

/**
 * Compute level from total XP using the level threshold table.
 * Beyond the table, each level requires prev_gap * 1.5.
 */
const xpToLevel = (totalXP) => {
  // Check within the predefined table
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      // Check if there's a next level in the table
      if (i === LEVEL_THRESHOLDS.length - 1) {
        // Beyond the table — use scalable formula
        let level = i + 1;
        let currentThreshold = LEVEL_THRESHOLDS[i];
        let gap = LEVEL_THRESHOLDS[i] - LEVEL_THRESHOLDS[i - 1];
        while (totalXP >= currentThreshold + Math.floor(gap * 1.5)) {
          currentThreshold += Math.floor(gap * 1.5);
          gap = Math.floor(gap * 1.5);
          level++;
        }
        return level;
      }
      return i + 1;
    }
  }
  return 1;
};

/**
 * Get XP required for the next level.
 */
const getNextLevelXP = (currentLevel) => {
  if (currentLevel < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[currentLevel]; // Next level threshold
  }
  // Beyond the table — compute dynamically
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  let gap = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2];
  for (let i = LEVEL_THRESHOLDS.length; i <= currentLevel; i++) {
    threshold += Math.floor(gap * 1.5);
    gap = Math.floor(gap * 1.5);
  }
  return threshold;
};

/**
 * Calculate level progress as a fraction (0.0 to 1.0).
 */
const getLevelProgress = (totalXP, currentLevel) => {
  const currentThreshold = currentLevel <= LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[currentLevel - 1]
    : getNextLevelXP(currentLevel - 1);
  const nextThreshold = getNextLevelXP(currentLevel);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 1;
  return Math.min((totalXP - currentThreshold) / range, 1);
};

module.exports = { xpToLevel, getNextLevelXP, getLevelProgress };
