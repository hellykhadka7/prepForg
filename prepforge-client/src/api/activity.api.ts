import api from './axios';
import type { ApiResponse, Activity, HeatmapEntry } from '../types';

export const activityApi = {
  getHeatmap: async (): Promise<{ heatmap: HeatmapEntry[]; totalDays: number }> => {
    const { data } = await api.get<ApiResponse<{ heatmap: HeatmapEntry[]; totalDays: number }>>('/activities/heatmap');
    return data.data;
  },

  getRecent: async (): Promise<Activity[]> => {
    const { data } = await api.get<ApiResponse<{ activities: Activity[] }>>('/activities/recent');
    return data.data.activities;
  },

  getStreak: async (): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: string | null }> => {
    const { data } = await api.get<ApiResponse<{ currentStreak: number; longestStreak: number; lastActivityDate: string | null }>>('/activities/streak');
    return data.data;
  },
};
