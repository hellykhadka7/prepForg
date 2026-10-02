import api from './axios';
import type { ApiResponse, Note, UpsertNotePayload } from '../types';

export const noteApi = {
  getForProblem: async (problemId: string): Promise<Note> => {
    const { data } = await api.get<ApiResponse<{ note: Note }>>(`/notes/problem/${problemId}`);
    return data.data.note;
  },

  upsert: async (problemId: string, payload: UpsertNotePayload): Promise<Note> => {
    const { data } = await api.put<ApiResponse<{ note: Note }>>(`/notes/problem/${problemId}`, payload);
    return data.data.note;
  },
};
