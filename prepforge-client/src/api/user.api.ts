import api from './axios';
import type {
  ApiResponse,
  User,
  DashboardData,
  DashboardWidget,
  ThemeName,
} from '../types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/users/profile');
    return data.data.user;
  },

  updateProfile: async (payload: { name?: string; email?: string }): Promise<User> => {
    const { data } = await api.patch<ApiResponse<{ user: User }>>('/users/profile', payload);
    return data.data.user;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await api.get<ApiResponse<DashboardData>>('/users/dashboard');
    return data.data;
  },

  updateLayout: async (layout: DashboardWidget[]): Promise<DashboardWidget[]> => {
    const { data } = await api.patch<ApiResponse<{ dashboardLayout: DashboardWidget[] }>>('/users/layout', { layout });
    return data.data.dashboardLayout;
  },

  updateTheme: async (theme: ThemeName): Promise<ThemeName> => {
    const { data } = await api.patch<ApiResponse<{ theme: ThemeName }>>('/users/theme', { theme });
    return data.data.theme;
  },
};
