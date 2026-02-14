import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Critical: This ensures cookies are sent with requests
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No need to manually set Authorization header 
    // The browser automatically sends HttpOnly cookies
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token expired or invalid
      // Clear auth state
      useAuthStore.getState().logout();
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  // Login - backend sets HttpOnly cookie
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/users/login/', {
      username,
      password,
    });
    return response.data;
  },
  
  // Logout - backend clears HttpOnly cookie
  logout: async () => {
    try {
      await apiClient.post('/users/logout/');
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    }
  },
  
  // Get current user info (useful for checking auth status on app load)
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },
  
  // Refresh token if needed (optional, depends on your backend implementation)
  refreshToken: async () => {
    const response = await apiClient.post('/users/token/refresh/');
    return response.data;
  },
};

// Generic API export
export default apiClient;
