import api from './axios';
import type {
  ApiResponse,
  ProblemListResponse,
  ProblemWithStatus,
  ProblemFilters,
} from '../types';

export const problemApi = {
  getAll: async (filters?: ProblemFilters): Promise<ProblemListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const { data } = await api.get<ApiResponse<ProblemListResponse>>(`/problems?${params.toString()}`);
    return data.data;
  },

  getById: async (id: string): Promise<ProblemWithStatus> => {
    const { data } = await api.get<ApiResponse<ProblemWithStatus>>(`/problems/${id}`);
    return data.data;
  },

  getStatus: async (id: string): Promise<{ solved: boolean; bookmarked: boolean; revisionDue: boolean }> => {
    const { data } = await api.get<ApiResponse<{ solved: boolean; bookmarked: boolean; revisionDue: boolean }>>(`/problems/${id}/status`);
    return data.data;
  },

  toggleBookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const { data } = await api.patch<ApiResponse<{ bookmarked: boolean }>>(`/problems/${id}/bookmark`);
    return data.data;
  },
};
