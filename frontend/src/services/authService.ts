import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  phone: z.string().optional().nullable(),
  token: z.string().optional(),
  type: z.string().optional()
});

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    if (response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  sendOtp: async (data: RegisterRequest) => {
    const response = await api.post<ApiResponse<string>>('/auth/send-otp', data);
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await api.post<ApiResponse<string>>('/auth/resend-otp', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { email, otp });
    if (response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },


  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const parsed = JSON.parse(userStr);
      const result = userSchema.safeParse(parsed);
      if (!result.success) {
        console.error('User data validation failed', result.error);
        localStorage.removeItem('user');
        return null;
      }
      return result.data;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },
};
