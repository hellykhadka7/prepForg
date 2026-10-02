// ──────────────────────────────────────────────────────────
//  XP System
// ──────────────────────────────────────────────────────────

const XP_VALUES = {
  Easy: { firstSolve: 10, revision: 2 },
  Medium: { firstSolve: 25, revision: 5 },
  Hard: { firstSolve: 50, revision: 10 },
};

// ──────────────────────────────────────────────────────────
//  Level Progression
//  Level N requires LEVEL_THRESHOLDS[N] cumulative XP.
//  Beyond the table, each level requires prev * 1.5.
// ──────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  350,    // Level 3
  850,    // Level 4
  1600,   // Level 5
  2600,   // Level 6
  4100,   // Level 7
  6150,   // Level 8
  9225,   // Level 9
  13838,  // Level 10
];

// ──────────────────────────────────────────────────────────
//  Spaced Repetition Intervals (days after first solve)
// ──────────────────────────────────────────────────────────

const REVISION_INTERVALS = {
  revision1: 1,
  revision2: 7,
  revision3: 30,
};

// ──────────────────────────────────────────────────────────
//  Priority Score Weights
// ──────────────────────────────────────────────────────────

const PRIORITY_WEIGHTS = {
  confidenceWeight: 2,     // (6 - confidence) * weight
  mistakeWeight: 1.5,      // mistakes.length * weight
  dayElapsedWeight: 0.3,   // daysSinceLastRevision * weight
};

// ──────────────────────────────────────────────────────────
//  DSA Patterns
// ──────────────────────────────────────────────────────────

const PATTERNS = [
  'Arrays',
  'HashMap',
  'Sliding Window',
  'Two Pointer',
  'Binary Search',
  'Linked List',
  'Stack',
  'Queue',
  'Tree',
  'Trie',
  'Heap',
  'DFS',
  'BFS',
  'Graph',
  'DP',
  'Backtracking',
  'Greedy',
  'Bit Manipulation',
  'Sorting',
  'Searching',
];

// ──────────────────────────────────────────────────────────
//  Mistake Types
// ──────────────────────────────────────────────────────────

const MISTAKE_TYPES = [
  'Logic Error',
  'Edge Case Missed',
  'TLE',
  'Wrong Data Structure',
  'Syntax Error',
  'Optimization Needed',
  'Other',
];

// ──────────────────────────────────────────────────────────
//  Supported Languages
// ──────────────────────────────────────────────────────────

const LANGUAGES = ['java', 'cpp', 'python', 'javascript', 'typescript'];

// ──────────────────────────────────────────────────────────
//  Difficulties
// ──────────────────────────────────────────────────────────

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ──────────────────────────────────────────────────────────
//  Themes
// ──────────────────────────────────────────────────────────

const THEMES = ['vscode-dark', 'github-dark', 'github-light', 'dracula'];

// ──────────────────────────────────────────────────────────
//  Achievement Definitions
// ──────────────────────────────────────────────────────────

const ACHIEVEMENT_DEFINITIONS = [
  { name: 'First Problem Solved', description: 'Solve your first problem', icon: '🎯' },
  { name: '7 Day Streak', description: 'Maintain a 7-day streak', icon: '🔥' },
  { name: '30 Day Streak', description: 'Maintain a 30-day streak', icon: '💎' },
  { name: '50 Problems Solved', description: 'Solve 50 problems', icon: '⭐' },
  { name: '100 Problems Solved', description: 'Solve 100 problems', icon: '🏆' },
  { name: 'First Hard Problem', description: 'Solve your first Hard problem', icon: '💪' },
  { name: 'Graph Master', description: 'Solve all Graph problems', icon: '🕸️' },
  { name: 'DP Master', description: 'Solve all DP problems', icon: '🧠' },
  { name: 'Revision Warrior', description: 'Complete 25 revisions', icon: '🗡️' },
  { name: 'Perfectionist', description: 'Rate 10 problems with confidence 5', icon: '💯' },
  { name: 'Speed Demon', description: 'Solve a problem in under 5 minutes', icon: '⚡' },
  { name: 'No Mistakes', description: 'Submit 10 solutions with zero mistakes', icon: '✨' },
];

// ──────────────────────────────────────────────────────────
//  Dashboard Widget IDs (default layout)
// ──────────────────────────────────────────────────────────

const DEFAULT_DASHBOARD_LAYOUT = [
  { widgetId: 'streak', visible: true, order: 0 },
  { widgetId: 'xp', visible: true, order: 1 },
  { widgetId: 'level', visible: true, order: 2 },
  { widgetId: 'solved-summary', visible: true, order: 3 },
  { widgetId: 'daily-goal', visible: true, order: 4 },
  { widgetId: 'revisions-due', visible: true, order: 5 },
  { widgetId: 'heatmap', visible: true, order: 6 },
  { widgetId: 'difficulty-breakdown', visible: true, order: 7 },
  { widgetId: 'topic-breakdown', visible: true, order: 8 },
  { widgetId: 'recent-activity', visible: true, order: 9 },
  { widgetId: 'achievements', visible: true, order: 10 },
  { widgetId: 'weakest-topics', visible: true, order: 11 },
  { widgetId: 'strongest-topics', visible: true, order: 12 },
  { widgetId: 'daily-challenge', visible: true, order: 13 },
];

module.exports = {
  XP_VALUES,
  LEVEL_THRESHOLDS,
  REVISION_INTERVALS,
  PRIORITY_WEIGHTS,
  PATTERNS,
  MISTAKE_TYPES,
  LANGUAGES,
  DIFFICULTIES,
  THEMES,
  ACHIEVEMENT_DEFINITIONS,
  DEFAULT_DASHBOARD_LAYOUT,
};
