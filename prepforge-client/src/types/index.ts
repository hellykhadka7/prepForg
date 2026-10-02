// ──────────────────────────────────────────────────────────
//  PrepForge Centralized Types
//  Every API response and data model is typed here.
//  No `any` anywhere in the codebase.
// ──────────────────────────────────────────────────────────

// ── API Response Envelope ──────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error: string | null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  error: string | ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ── User ───────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  lastActivityDate: string | null;
  dashboardLayout: DashboardWidget[];
  theme: ThemeName;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  widgetId: string;
  visible: boolean;
  order: number;
}

export type ThemeName = 'vscode-dark' | 'github-dark' | 'github-light' | 'dracula';

// ── Auth ───────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Problem ────────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Pattern =
  | 'Arrays'
  | 'HashMap'
  | 'Sliding Window'
  | 'Two Pointer'
  | 'Binary Search'
  | 'Linked List'
  | 'Stack'
  | 'Queue'
  | 'Tree'
  | 'Trie'
  | 'Heap'
  | 'DFS'
  | 'BFS'
  | 'Graph'
  | 'DP'
  | 'Backtracking'
  | 'Greedy'
  | 'Bit Manipulation'
  | 'Sorting'
  | 'Searching';

export interface Problem {
  _id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  week: number;
  orderIndex: number;
  leetcodeUrl: string;
  patterns: Pattern[];
  isActive: boolean;
  createdAt: string;
}

export interface ProblemWithStatus extends Problem {
  xpReward: number;
  solved: boolean;
  bookmarked: boolean;
  revisionDue: boolean;
  latestConfidence: number | null;
}

export interface ProblemListResponse {
  problems: ProblemWithStatus[];
  total: number;
  filtered: number;
}

export interface ProblemFilters {
  week?: number;
  topic?: string;
  pattern?: string;
  difficulty?: Difficulty;
  status?: 'solved' | 'unsolved';
  bookmarked?: string;
  revisionDue?: string;
  q?: string;
}

// ── Solution ───────────────────────────────────────────────

export type Language = 'java' | 'cpp' | 'python' | 'javascript' | 'typescript';

export type MistakeType =
  | 'Logic Error'
  | 'Edge Case Missed'
  | 'TLE'
  | 'Wrong Data Structure'
  | 'Syntax Error'
  | 'Optimization Needed'
  | 'Other';

export interface Solution {
  _id: string;
  userId: string;
  problemId: string;
  language: Language;
  code: string;
  notes: string;
  confidence: number;
  mistakes: MistakeType[];
  solveDuration: number;
  isAccepted: boolean;
  isFirstSolve: boolean;
  xpAwarded: number;
  submittedAt: string;
}

export interface SubmitSolutionPayload {
  problemId: string;
  language: Language;
  code: string;
  notes?: string;
  confidence: number;
  mistakes?: MistakeType[];
  solveDuration?: number;
  isAccepted?: boolean;
}

export interface SubmitSolutionResponse {
  solution: { _id: string; submittedAt: string };
  xpAwarded: number;
  isFirstSolve: boolean;
  totalXP: number;
  leveledUp: boolean;
  currentLevel: number;
  newAchievements: string[];
  streak: { current: number; extended: boolean };
  revisionSchedule: RevisionSchedule | null;
}

export interface RevisionSchedule {
  revision1Date: string;
  revision2Date: string;
  revision3Date: string;
}

// ── Note ───────────────────────────────────────────────────

export interface Note {
  _id?: string;
  userId?: string;
  problemId: string;
  learning: string;
  mistakes: string;
  optimization: string;
  revisionNotes: string;
  interviewNotes: string;
  updatedAt?: string;
}

export interface UpsertNotePayload {
  learning?: string;
  mistakes?: string;
  optimization?: string;
  revisionNotes?: string;
  interviewNotes?: string;
}

// ── Revision ───────────────────────────────────────────────

export interface Revision {
  _id: string;
  userId: string;
  problemId: string;
  revision1Date: string;
  revision2Date: string;
  revision3Date: string;
  revision1Done: boolean;
  revision2Done: boolean;
  revision3Done: boolean;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionWithProblem extends Revision {
  problem: Pick<Problem, '_id' | 'title' | 'difficulty' | 'topic' | 'week'>;
}

export interface DueRevisionItem {
  _id: string;
  problem: Pick<Problem, '_id' | 'title' | 'difficulty' | 'topic'>;
  revisionSlot: 1 | 2 | 3;
  dueDate: string;
  priorityScore: number;
  overdue: boolean;
}

// ── Goal ───────────────────────────────────────────────────

export interface Goal {
  _id: string;
  userId: string;
  easyTarget: number;
  mediumTarget: number;
  hardTarget: number;
  weekendBonus: number;
  weekendBonusEnabled: boolean;
  updatedAt: string;
}

export interface GoalProgress {
  easyTarget: number;
  mediumTarget: number;
  hardTarget: number;
  easyDone: number;
  mediumDone: number;
  hardDone: number;
}

export interface UpsertGoalPayload {
  easyTarget?: number;
  mediumTarget?: number;
  hardTarget?: number;
  weekendBonus?: number;
  weekendBonusEnabled?: boolean;
}

// ── Activity ───────────────────────────────────────────────

export interface Activity {
  _id: string;
  userId: string;
  date: string;
  solvedCount: number;
  xpEarned: number;
  problemIds: string[];
}

export interface HeatmapEntry {
  date: string;
  solvedCount: number;
  xpEarned: number;
}

// ── Achievement ────────────────────────────────────────────

export interface Achievement {
  _id: string;
  userId: string;
  achievementName: string;
  unlockedAt: string;
}

export interface AchievementDefinition {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ── Roadmap ────────────────────────────────────────────────

export interface Roadmap {
  _id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdBy: string;
  problemIds: string[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapWithProgress extends Roadmap {
  problemCount: number;
  userProgress: {
    solved: number;
    percentage: number;
  };
}

export interface CreateRoadmapPayload {
  name: string;
  description?: string;
  problemIds?: string[];
  tags?: string[];
}

// ── Bookmark ───────────────────────────────────────────────

export interface Bookmark {
  _id: string;
  userId: string;
  problemId: string;
  createdAt: string;
}

// ── Dashboard ──────────────────────────────────────────────

export interface DashboardData {
  streak: { current: number; longest: number };
  xp: { total: number; level: number; nextLevelXP: number; progress: number };
  solved: { total: number; easy: number; medium: number; hard: number; remaining: number };
  dailyGoal: GoalProgress;
  revisions: { dueToday: number; overdue: number; upcoming: number };
  recentActivity: Activity[];
  achievements: Achievement[];
  weakestTopics: TopicStat[];
  strongestTopics: TopicStat[];
  dailyChallenge: DailyChallengeItem[];
}

export interface TopicStat {
  topic: string;
  avgConfidence: number;
  solved: number;
}

export interface DailyChallengeItem extends Problem {
  reason: string;
}

// ── Analytics ──────────────────────────────────────────────

export interface WeeklyStat {
  week: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  xp: number;
}

export interface PatternStat {
  _id: string;
  count: number;
}

export interface ConfidenceStat {
  _id: Difficulty;
  avgConfidence: number;
  count: number;
}

export interface SolveTimeStat {
  _id: Difficulty;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

export interface RevisionStats {
  total: number;
  revision1Rate: number;
  revision2Rate: number;
  revision3Rate: number;
}

export interface MistakeStat {
  _id: MistakeType;
  count: number;
}

export interface XPGrowthEntry {
  date: string;
  xp: number;
  cumulativeXP: number;
}

// ── Search ─────────────────────────────────────────────────

export interface SearchResults {
  problems: Problem[];
  notes: (Note & { problemId: Pick<Problem, '_id' | 'title' | 'difficulty' | 'topic'> })[];
  bookmarks: (Bookmark & { problemId: Pick<Problem, '_id' | 'title' | 'difficulty' | 'topic'> })[];
  revisions: Revision[];
}

export type SearchType = 'problems' | 'notes' | 'bookmarks' | 'revisions';

// ── Sync (Offline) ─────────────────────────────────────────

export type SyncAction =
  | 'SUBMIT_SOLUTION'
  | 'UPSERT_NOTE'
  | 'TOGGLE_BOOKMARK'
  | 'COMPLETE_REVISION'
  | 'UPSERT_GOAL';

export interface SyncQueueItem {
  action: SyncAction;
  payload: Record<string, unknown>;
}

export interface SyncBatchResponse {
  processed: number;
  failed: number;
  results: { action: string; success: boolean; error?: string; xpAwarded?: number }[];
}
