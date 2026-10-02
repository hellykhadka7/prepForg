import api from './axios';
import type { ApiResponse, Achievement, AchievementDefinition } from '../types';

export const achievementApi = {
  getUnlocked: async (): Promise<Achievement[]> => {
    const { data } = await api.get<ApiResponse<{ achievements: Achievement[] }>>('/achievements');
    return data.data.achievements;
  },

  getAll: async (): Promise<AchievementDefinition[]> => {
    const { data } = await api.get<ApiResponse<{ achievements: AchievementDefinition[] }>>('/achievements/all');
    return data.data.achievements;
  },
};
