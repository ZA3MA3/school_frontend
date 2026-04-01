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
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/users/login/', {
      email,
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

// Teacher API functions
export const teacherApi = {
  // Get all classes taught by teacher
  getClasses: async () => {
    const response = await apiClient.get('/users/teacher/classes/');
    return response.data;
  },
  
  // Get all exercises created by teacher
  getExercises: async () => {
    const response = await apiClient.get('/users/teacher/exercises/');
    return response.data;
  },
  
  // Get all submissions for teacher's exercises
  getSubmissions: async () => {
    const response = await apiClient.get('/users/teacher/submissions/');
    return response.data;
  },
  
  // Create new exercise
  createExercise: async (data: FormData) => {
    const response = await apiClient.post('/users/teacher/exercises/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Download submission file
  downloadSubmission: (submissionId: number) => {
    return `${API_BASE_URL}/users/submissions/${submissionId}/download/`;
  },
  
  // Grade a submission
  gradeSubmission: async (submissionId: number, grade: number, feedback: string) => {
    const response = await apiClient.patch(`/users/submissions/${submissionId}/grade/`, {
      grade,
      feedback,
    });
    return response.data;
  },
  
  // Get teacher's announcements
  getAnnouncements: async () => {
    const response = await apiClient.get('/users/teacher/announcements/');
    return response.data;
  },
  
  // Create a new announcement
  createAnnouncement: async (title: string, content: string, classId?: number) => {
    const data: { title: string; content: string; related_class?: number } = { title, content };
    if (classId) {
      data.related_class = classId;
    }
    const response = await apiClient.post('/users/teacher/announcements/', data);
    return response.data;
  },
  
  // Get attendance for a class on a date
  getAttendance: async (classId: number, date: string) => {
    const response = await apiClient.get('/users/teacher/attendance/', {
      params: { class_id: classId, date },
    });
    return response.data;
  },
  
  // Mark attendance for students
  markAttendance: async (records: Array<{ student_id: number; class_id: number; date: string; status: string }>) => {
    const response = await apiClient.post('/users/teacher/attendance/', { records });
    return response.data;
  },
};

// Student API functions
export const studentApi = {
  // Get all available classes
  getAllClasses: async () => {
    const response = await apiClient.get('/users/classes/');
    return response.data;
  },
  
  // Enroll in a class
  enrollInClass: async (classId: number) => {
    const response = await apiClient.post('/users/student/enroll/', {
      class_id: classId,
    });
    return response.data;
  },
  
  // Get all exercises available to student
  getExercises: async () => {
    const response = await apiClient.get('/users/student/exercises/');
    return response.data;
  },
  
  // Get student's submissions
  getSubmissions: async () => {
    const response = await apiClient.get('/users/student/submissions/');
    return response.data;
  },
  
  // Submit an exercise
  submitExercise: async (data: FormData) => {
    const response = await apiClient.post('/users/student/submissions/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Download exercise file
  downloadExercise: (exerciseId: number) => {
    return `${API_BASE_URL}/users/exercises/${exerciseId}/download/`;
  },
  
  // Download submission file
  downloadSubmission: (submissionId: number) => {
    return `${API_BASE_URL}/users/submissions/${submissionId}/download/`;
  },
  
  // Get student's announcements
  getAnnouncements: async () => {
    const response = await apiClient.get('/users/student/announcements/');
    return response.data;
  },
  
  // Get student's attendance
  getAttendance: async () => {
    const response = await apiClient.get('/users/student/attendance/');
    return response.data;
  },
};

// Parent API functions
export const parentApi = {
  // Get all children linked to parent
  getChildren: async () => {
    const response = await apiClient.get('/users/parent/children/');
    return response.data;
  },
  
  // Get announcements for parent's children
  getAnnouncements: async () => {
    const response = await apiClient.get('/users/parent/announcements/');
    return response.data;
  },
  
  // Get attendance for parent's children
  getAttendance: async () => {
    const response = await apiClient.get('/users/parent/attendance/');
    return response.data;
  },
};

// Chat API functions
export const chatApi = {
  // Get contacts (teachers for parents, parents for teachers)
  getContacts: async () => {
    const response = await apiClient.get('/users/chat/contacts/');
    return response.data;
  },
  
  // Get messages with a specific contact
  getMessages: async (contactId: number) => {
    const response = await apiClient.get(`/users/chat/messages/${contactId}/`);
    return response.data;
  },
  
  // Send a message
  sendMessage: async (contactId: number, content: string) => {
    const response = await apiClient.post(`/users/chat/messages/${contactId}/`, {
      content,
    });
    return response.data;
  },
  
  // Get a WebSocket ticket for authentication
  getWsTicket: async () => {
    const response = await apiClient.post('/users/ws-ticket/');
    return response.data.ticket;
  },
  
  // Get unread message counts
  getUnreadCounts: async () => {
    const response = await apiClient.get('/users/chat/unread-count/');
    return response.data;
  },
};

// Notification API functions
export const notificationApi = {
  // Get all notifications
  getNotifications: async () => {
    const response = await apiClient.get('/users/notifications/');
    return response.data;
  },
  
  // Get unread notification count
  getUnreadCount: async () => {
    const response = await apiClient.get('/users/notifications/unread-count/');
    return response.data.count;
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: number) => {
    const response = await apiClient.post(`/users/notifications/${notificationId}/read/`);
    return response.data;
  },
};

// WebSocket URL
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat/';

// Generic API export
export default apiClient;
