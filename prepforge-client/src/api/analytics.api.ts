import api from './axios';
import type {
  ApiResponse,
  WeeklyStat,
  PatternStat,
  ConfidenceStat,
  SolveTimeStat,
  RevisionStats,
  MistakeStat,
  XPGrowthEntry,
} from '../types';

interface TopicStat {
  _id: string;
  solved: number;
  avgConfidence: number;
}

interface DifficultyDistribution {
  Easy: number;
  Medium: number;
  Hard: number;
}

interface AnalyticsSummary {
  difficulty: DifficultyDistribution;
  topics: TopicStat[];
  patterns: PatternStat[];
  revisions: RevisionStats;
  mistakes: MistakeStat[];
}

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const { data } = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary');
    return data.data;
  },

  getWeekly: async (): Promise<WeeklyStat[]> => {
    const { data } = await api.get<ApiResponse<{ weeks: WeeklyStat[] }>>('/analytics/weekly');
    return data.data.weeks;
  },

  getDifficulty: async (): Promise<DifficultyDistribution> => {
    const { data } = await api.get<ApiResponse<{ distribution: DifficultyDistribution }>>('/analytics/difficulty');
    return data.data.distribution;
  },

  getTopics: async (): Promise<TopicStat[]> => {
    const { data } = await api.get<ApiResponse<{ topics: TopicStat[] }>>('/analytics/topics');
    return data.data.topics;
  },

  getPatterns: async (): Promise<PatternStat[]> => {
    const { data } = await api.get<ApiResponse<{ patterns: PatternStat[] }>>('/analytics/patterns');
    return data.data.patterns;
  },

  getRevisions: async (): Promise<RevisionStats> => {
    const { data } = await api.get<ApiResponse<{ stats: RevisionStats }>>('/analytics/revisions');
    return data.data.stats;
  },

  getMistakes: async (): Promise<MistakeStat[]> => {
    const { data } = await api.get<ApiResponse<{ mistakes: MistakeStat[] }>>('/analytics/mistakes');
    return data.data.mistakes;
  },

  getXPGrowth: async (): Promise<XPGrowthEntry[]> => {
    const { data } = await api.get<ApiResponse<{ growth: XPGrowthEntry[] }>>('/analytics/xp-growth');
    return data.data.growth;
  },

  getConfidence: async (): Promise<ConfidenceStat[]> => {
    const { data } = await api.get<ApiResponse<{ confidence: ConfidenceStat[] }>>('/analytics/confidence');
    return data.data.confidence;
  },

  getSolveTime: async (): Promise<SolveTimeStat[]> => {
    const { data } = await api.get<ApiResponse<{ solveTime: SolveTimeStat[] }>>('/analytics/solve-time');
    return data.data.solveTime;
  },
};
