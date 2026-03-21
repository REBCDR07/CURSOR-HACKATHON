import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  searchPatient: async (pseudo: string) => {
    const response = await api.get(`/users/search?pseudo=${pseudo}`);
    return response.data;
  },

  getDossier: async (patientId?: string) => {
    const url = patientId ? `/users/dossier?patientId=${patientId}` : '/users/dossier';
    const response = await api.get(url);
    return response.data;
  }
};
