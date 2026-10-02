import api from './axios';
import type { ApiResponse, Goal, GoalProgress, UpsertGoalPayload } from '../types';

export const goalApi = {
  get: async (): Promise<Goal> => {
    const { data } = await api.get<ApiResponse<{ goals: Goal }>>('/goals');
    return data.data.goals;
  },

  upsert: async (payload: UpsertGoalPayload): Promise<Goal> => {
    const { data } = await api.put<ApiResponse<{ goals: Goal }>>('/goals', payload);
    return data.data.goals;
  },

  getProgress: async (): Promise<GoalProgress> => {
    const { data } = await api.get<ApiResponse<GoalProgress>>('/goals/progress');
    return data.data;
  },
};
