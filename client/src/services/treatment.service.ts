import api from './api';

export const treatmentService = {
  addTreatment: async (data: any) => {
    const response = await api.post('/treatments', data);
    return response.data;
  },

  getTreatments: async (patientId?: string) => {
    const url = patientId ? `/treatments?patientId=${patientId}` : '/treatments';
    const response = await api.get(url);
    return response.data;
  },

  markAsTaken: async (id: string, heurePriseId: string) => {
    const response = await api.patch(`/treatments/${id}/taken`, { heurePriseId });
    return response.data;
  }
};
