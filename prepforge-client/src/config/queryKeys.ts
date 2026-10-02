/**
 * React Query key factory.
 * Prevents key collisions and enables type-safe invalidation.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    profile: ['users', 'profile'] as const,
    dashboard: ['users', 'dashboard'] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (filters: Record<string, string | number | undefined>) =>
      ['problems', 'list', filters] as const,
    detail: (id: string) => ['problems', 'detail', id] as const,
    status: (id: string) => ['problems', 'status', id] as const,
  },
  solutions: {
    forProblem: (problemId: string) => ['solutions', 'problem', problemId] as const,
    detail: (id: string) => ['solutions', 'detail', id] as const,
  },
  notes: {
    forProblem: (problemId: string) => ['notes', 'problem', problemId] as const,
  },
  revisions: {
    due: ['revisions', 'due'] as const,
    upcoming: ['revisions', 'upcoming'] as const,
    queue: ['revisions', 'queue'] as const,
    forProblem: (problemId: string) => ['revisions', 'problem', problemId] as const,
  },
  goals: {
    config: ['goals', 'config'] as const,
    progress: ['goals', 'progress'] as const,
  },
  activities: {
    heatmap: ['activities', 'heatmap'] as const,
    recent: ['activities', 'recent'] as const,
    streak: ['activities', 'streak'] as const,
  },
  achievements: {
    unlocked: ['achievements', 'unlocked'] as const,
    all: ['achievements', 'all'] as const,
  },
  analytics: {
    summary: ['analytics', 'summary'] as const,
    weekly: ['analytics', 'weekly'] as const,
    difficulty: ['analytics', 'difficulty'] as const,
    topics: ['analytics', 'topics'] as const,
    patterns: ['analytics', 'patterns'] as const,
    revisions: ['analytics', 'revisions'] as const,
    mistakes: ['analytics', 'mistakes'] as const,
    xpGrowth: ['analytics', 'xpGrowth'] as const,
    confidence: ['analytics', 'confidence'] as const,
    solveTime: ['analytics', 'solveTime'] as const,
    dailyChallenge: ['analytics', 'dailyChallenge'] as const,
  },
  search: {
    query: (q: string, type?: string) => ['search', q, type] as const,
  },
  roadmaps: {
    all: ['roadmaps'] as const,
    system: ['roadmaps', 'system'] as const,
    mine: ['roadmaps', 'mine'] as const,
    detail: (id: string) => ['roadmaps', 'detail', id] as const,
  },
} as const;
