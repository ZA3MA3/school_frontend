import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  useAuthStore, 
  useUser, 
  useIsAuthenticated, 
  useAuthLoading, 
  useAuthError,
  useUserRole,
  type UserRole 
} from '@/stores/authStore';
import { authApi } from '@/lib/api';

// Main auth hook
export function useAuth() {
  const navigate = useNavigate();
  
  // Get state from Zustand store
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const role = useUserRole();
  
  // Get actions from store
  const store = useAuthStore();
  
  // Login function
  const login = useCallback(async (username: string, password: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      // Call login API - backend sets HttpOnly cookie
      const data = await authApi.login(username, password);
      
      // Store user data in Zustand (JWT is in HttpOnly cookie, not accessible to JS)
      store.login({
        id: data.user?.id || 0,
        username: data.user?.username || username,
        role: data.role,
        email: data.user?.email,
        firstName: data.user?.first_name,
        lastName: data.user?.last_name,
      });
      
      // Redirect based on role
      switch (data.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'TEACHER':
          navigate('/teacher');
          break;
        case 'STUDENT':
          navigate('/student');
          break;
        case 'PARENT':
          navigate('/parent');
          break;
        default:
          navigate('/');
      }
      
      return { success: true };
    } catch (err) {
      let errorMessage = 'Login failed';
      
      if (axios.isAxiosError(err)) {
        // Extract error message from backend response
        errorMessage = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      err.response?.data?.error ||
                      err.message ||
                      'Invalid credentials';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  }, [navigate, store]);
  
  // Logout function
  const logout = useCallback(async () => {
    store.setLoading(true);
    
    try {
      // Call logout API - backend clears HttpOnly cookie
      await authApi.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      // Always clear local state
      store.logout();
      navigate('/login');
      store.setLoading(false);
    }
  }, [navigate, store]);
  
  // Check if user has specific role
  const hasRole = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  }, [role]);
  
  // Check if user is admin
  const isAdmin = role === 'ADMIN';
  
  // Check if user is teacher
  const isTeacher = role === 'TEACHER';
  
  // Check if user is student
  const isStudent = role === 'STUDENT';
  
  // Check if user is parent
  const isParent = role === 'PARENT';
  
  return {
    // State
    user,
    role,
    isAuthenticated,
    isLoading,
    error,
    
    // Role checks
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    hasRole,
    
    // Actions
    login,
    logout,
    clearError: store.clearError,
  };
}

// Hook for checking auth status on app initialization
export function useAuthCheck() {
  const store = useAuthStore();
  
  const checkAuth = useCallback(async () => {
    // If already authenticated in store, we're good
    if (store.isAuthenticated && store.user) {
      return true;
    }
    
    store.setLoading(true);
    
    try {
      // Try to get current user - this will fail if cookie is missing/invalid
      const user = await authApi.getCurrentUser();
      store.login(user);
      return true;
    } catch {
      // Not authenticated
      store.logout();
      return false;
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  return { checkAuth };
}

export type { UserRole };
