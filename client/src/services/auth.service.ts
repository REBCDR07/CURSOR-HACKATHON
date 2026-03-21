import api from './api';

export interface AuthResponse {
  status: string;
  _id: string;
  email: string;
  role: "patient" | "doctor";
  token: string;
  pseudo?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
