import api from './axios';
import type {
  ApiResponse,
  ProblemListResponse,
  ProblemWithStatus,
  ProblemFilters,
  ProblemStatus,
  SetStatusResponse,
  CreateCustomProblemPayload,
  UpdateCustomProblemPayload,
} from '../types';

export const problemApi = {
  // ──────────────────────────────────────────────────────────
  //  Existing endpoints — preserved unchanged
  // ──────────────────────────────────────────────────────────

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

  getStatus: async (id: string): Promise<{ solved: boolean; bookmarked: boolean; revisionDue: boolean; status: ProblemStatus }> => {
    const { data } = await api.get<ApiResponse<{ solved: boolean; bookmarked: boolean; revisionDue: boolean; status: ProblemStatus }>>(`/problems/${id}/status`);
    return data.data;
  },

  toggleBookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const { data } = await api.patch<ApiResponse<{ bookmarked: boolean }>>(`/problems/${id}/bookmark`);
    return data.data;
  },

  // ──────────────────────────────────────────────────────────
  //  New endpoints added in redesign
  // ──────────────────────────────────────────────────────────

  /**
   * Set the current user's tracking status for a problem.
   * Does NOT affect Solution, Revision, XP, or Activity records.
   */
  setMyStatus: async (id: string, status: ProblemStatus): Promise<SetStatusResponse> => {
    const { data } = await api.patch<ApiResponse<SetStatusResponse>>(`/problems/${id}/mystatus`, { status });
    return data.data;
  },

  /**
   * Create a custom (user-owned) problem.
   */
  createCustom: async (payload: CreateCustomProblemPayload): Promise<ProblemWithStatus> => {
    const { data } = await api.post<ApiResponse<{ problem: ProblemWithStatus }>>('/problems', payload);
    return data.data.problem;
  },

  /**
   * Update a custom problem (ownership enforced by backend).
   */
  updateCustom: async (id: string, payload: UpdateCustomProblemPayload): Promise<ProblemWithStatus> => {
    const { data } = await api.patch<ApiResponse<{ problem: ProblemWithStatus }>>(`/problems/${id}`, payload);
    return data.data.problem;
  },

  /**
   * Soft-delete a custom problem (sets isActive=false on the backend).
   * All associated Solution, Note, Revision, and Bookmark records are preserved.
   * Ownership is enforced by the backend.
   */
  deleteCustom: async (id: string): Promise<{ deleted: boolean; problemId: string }> => {
    const { data } = await api.delete<ApiResponse<{ deleted: boolean; problemId: string }>>(`/problems/${id}`);
    return data.data;
  },
};
