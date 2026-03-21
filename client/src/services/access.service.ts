import api from './api';

export const accessService = {
  requestAccess: async (patientPseudo: string) => {
    const response = await api.post('/access/request', { patientPseudo });
    return response.data;
  },

  approveAccess: async (requestId: string) => {
    const response = await api.patch(`/access/approve/${requestId}`);
    return response.data;
  },

  getPatientRequests: async () => {
    const response = await api.get('/access/patient');
    return response.data;
  }
};
