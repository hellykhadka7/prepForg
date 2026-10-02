import api from './axios';
import type {
  ApiResponse,
  Solution,
  SubmitSolutionPayload,
  SubmitSolutionResponse,
} from '../types';

export const solutionApi = {
  submit: async (payload: SubmitSolutionPayload): Promise<SubmitSolutionResponse> => {
    const { data } = await api.post<ApiResponse<SubmitSolutionResponse>>('/solutions', payload);
    return data.data;
  },

  getForProblem: async (problemId: string): Promise<Solution[]> => {
    const { data } = await api.get<ApiResponse<{ solutions: Solution[] }>>(`/solutions/problem/${problemId}`);
    return data.data.solutions;
  },

  getById: async (id: string): Promise<Solution> => {
    const { data } = await api.get<ApiResponse<{ solution: Solution }>>(`/solutions/${id}`);
    return data.data.solution;
  },

  delete: async (id: string): Promise<{ deleted: boolean; problemStillSolved: boolean; xpReversed: boolean; xpDeducted: number }> => {
    const { data } = await api.delete<ApiResponse<{ deleted: boolean; problemStillSolved: boolean; xpReversed: boolean; xpDeducted: number }>>(`/solutions/${id}`);
    return data.data;
  },

  restore: async (id: string): Promise<SubmitSolutionResponse> => {
    const { data } = await api.post<ApiResponse<SubmitSolutionResponse>>(`/solutions/${id}/restore`);
    return data.data;
  },

  compare: async (idA: string, idB: string): Promise<{ solutionA: Solution; solutionB: Solution }> => {
    const { data } = await api.get<ApiResponse<{ solutionA: Solution; solutionB: Solution }>>(`/solutions/compare?a=${idA}&b=${idB}`);
    return data.data;
  },

  toggleAccepted: async (id: string): Promise<{ solutionId: string; isAccepted: boolean }> => {
    const { data } = await api.patch<ApiResponse<{ solutionId: string; isAccepted: boolean }>>(`/solutions/${id}/accept`);
    return data.data;
  },
};
