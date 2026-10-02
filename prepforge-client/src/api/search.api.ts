import api from './axios';
import type { ApiResponse, SearchResults, SearchType } from '../types';

export const searchApi = {
  search: async (q: string, type?: SearchType): Promise<SearchResults> => {
    const params = new URLSearchParams({ q });
    if (type) params.append('type', type);
    const { data } = await api.get<ApiResponse<SearchResults>>(`/search?${params.toString()}`);
    return data.data;
  },
};
