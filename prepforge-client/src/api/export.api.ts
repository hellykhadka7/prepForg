import api from './axios';

export const exportApi = {
  exportJSON: (): string => `${api.defaults.baseURL}/export/json`,
  exportZIP: (): string => `${api.defaults.baseURL}/export/zip`,
  exportPDF: (): string => `${api.defaults.baseURL}/export/pdf`,
};
