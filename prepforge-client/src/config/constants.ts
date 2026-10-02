import type { Difficulty, ThemeName } from '../types';

// ── XP System ─────────────────────────────────────────────

export const XP_VALUES: Record<Difficulty, { firstSolve: number; revision: number }> = {
  Easy: { firstSolve: 10, revision: 2 },
  Medium: { firstSolve: 25, revision: 5 },
  Hard: { firstSolve: 50, revision: 10 },
};

// ── Difficulty Colors ─────────────────────────────────────

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: '#00b8a3',
  Medium: '#ffc01e',
  Hard: '#ff375f',
};

export const DIFFICULTY_BG: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

// ── Patterns ──────────────────────────────────────────────

export const PATTERNS = [
  'Arrays', 'HashMap', 'Sliding Window', 'Two Pointer', 'Binary Search',
  'Linked List', 'Stack', 'Queue', 'Tree', 'Trie', 'Heap',
  'DFS', 'BFS', 'Graph', 'DP', 'Backtracking', 'Greedy',
  'Bit Manipulation', 'Sorting', 'Searching',
] as const;

// ── Mistake Types ─────────────────────────────────────────

export const MISTAKE_TYPES = [
  'Logic Error', 'Edge Case Missed', 'TLE', 'Wrong Data Structure',
  'Syntax Error', 'Optimization Needed', 'Other',
] as const;

// ── Languages ─────────────────────────────────────────────

export const LANGUAGES = [
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
] as const;

// ── Themes ────────────────────────────────────────────────

export const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'vscode-dark', label: 'VS Code Dark' },
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'github-light', label: 'GitHub Light' },
  { value: 'dracula', label: 'Dracula' },
];

// ── Level Thresholds ──────────────────────────────────────

export const LEVEL_THRESHOLDS = [0, 100, 350, 850, 1600, 2600, 4100, 6150, 9225, 13838];

// ── Sidebar Navigation ───────────────────────────────────

export const NAV_ITEMS = [
  { path: '/app/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/app/problems', label: 'Problems', icon: 'Code2' },
  { path: '/app/revisions', label: 'Revisions', icon: 'RefreshCw' },
  { path: '/app/analytics', label: 'Analytics', icon: 'BarChart3' },
  { path: '/app/goals', label: 'Goals', icon: 'Target' },
  { path: '/app/roadmaps', label: 'Roadmaps', icon: 'Map' },
  { path: '/app/achievements', label: 'Achievements', icon: 'Trophy' },
  { path: '/app/import', label: 'Import / Export', icon: 'ArrowUpDown' },
  { path: '/app/settings', label: 'Settings', icon: 'Settings' },
] as const;
