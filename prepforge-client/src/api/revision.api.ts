import api from './axios';
import type { ApiResponse, DueRevisionItem, Revision, RevisionWithProblem } from '../types';

export const revisionApi = {
  getDue: async (): Promise<{ due: DueRevisionItem[]; overdue: DueRevisionItem[] }> => {
    const { data } = await api.get<ApiResponse<{ due: DueRevisionItem[]; overdue: DueRevisionItem[] }>>('/revisions/due');
    return data.data;
  },

  getUpcoming: async (): Promise<{ upcoming: RevisionWithProblem[] }> => {
    const { data } = await api.get<ApiResponse<{ upcoming: RevisionWithProblem[] }>>('/revisions/upcoming');
    return data.data;
  },

  getQueue: async (): Promise<{ due: DueRevisionItem[]; overdue: DueRevisionItem[]; upcoming: RevisionWithProblem[] }> => {
    const { data } = await api.get<ApiResponse<{ due: DueRevisionItem[]; overdue: DueRevisionItem[]; upcoming: RevisionWithProblem[] }>>('/revisions/queue');
    return data.data;
  },

  getForProblem: async (problemId: string): Promise<Revision | null> => {
    const { data } = await api.get<ApiResponse<{ revision: Revision | null }>>(`/revisions/problem/${problemId}`);
    return data.data.revision;
  },

  completeSlot: async (revisionId: string, slotNumber: 1 | 2 | 3): Promise<Revision> => {
    const { data } = await api.patch<ApiResponse<{ revision: Revision }>>(`/revisions/${revisionId}/complete`, { slotNumber });
    return data.data.revision;
  },

  reset: async (problemId: string): Promise<Revision> => {
    const { data } = await api.post<ApiResponse<{ revision: Revision }>>(`/revisions/problem/${problemId}/reset`);
    return data.data.revision;
  },
};
