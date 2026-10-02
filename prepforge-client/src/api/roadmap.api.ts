import api from './axios';
import type { ApiResponse, RoadmapWithProgress, CreateRoadmapPayload, Roadmap } from '../types';

export const roadmapApi = {
  getAll: async (): Promise<{ system: RoadmapWithProgress[]; personal: RoadmapWithProgress[] }> => {
    const { data } = await api.get<ApiResponse<{ system: RoadmapWithProgress[]; personal: RoadmapWithProgress[] }>>('/roadmaps');
    return data.data;
  },

  getById: async (id: string): Promise<RoadmapWithProgress> => {
    const { data } = await api.get<ApiResponse<RoadmapWithProgress>>(`/roadmaps/${id}`);
    return data.data;
  },

  createPersonal: async (payload: CreateRoadmapPayload): Promise<Roadmap> => {
    const { data } = await api.post<ApiResponse<{ roadmap: Roadmap }>>('/roadmaps', payload);
    return data.data.roadmap;
  },

  updatePersonal: async (id: string, payload: Partial<CreateRoadmapPayload>): Promise<Roadmap> => {
    const { data } = await api.patch<ApiResponse<{ roadmap: Roadmap }>>(`/roadmaps/${id}`, payload);
    return data.data.roadmap;
  },

  deletePersonal: async (id: string): Promise<void> => {
    await api.delete(`/roadmaps/${id}`);
  },
};
