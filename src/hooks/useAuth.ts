import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  useAuthStore, 
  useUser, 
  useIsAuthenticated, 
  useAuthLoading, 
  useAuthError,
  useActiveRole,
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
  const activeRole = useActiveRole();
  
  // Get actions from store
  const store = useAuthStore();
  
// Login function
  const login = useCallback(async (email: string, password: string) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      // Call login API - backend sets HttpOnly cookie
      const data = await authApi.login(email, password);
      
      // Store user data in Zustand (JWT is in HttpOnly cookie, not accessible to JS)
      store.login({
        id: data.user?.id || 0,
        email: data.user?.email || email,
        firstName: data.user?.first_name,
        lastName: data.user?.last_name,
        fullName: data.user?.full_name,
        roles: data.roles || [], // Backend now returns 'roles' array
      });
      
      // Return success without redirecting - let caller decide where to go
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
  
  // Check if user has specific role in their roles array (for authorization)
  const hasRole = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!user || !user.roles) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(r => user.roles.includes(r));
    }
    return user.roles.includes(requiredRole);
  }, [user]);

  // Check if current active role matches (for UI filtering)
  const isActiveRole = useCallback((role: UserRole): boolean => {
    return activeRole === role;
  }, [activeRole]);

  // Switch active role
  const switchRole = useCallback((role: UserRole) => {
    if (user?.roles.includes(role)) {
      store.setActiveRole(role);
      // Navigate to corresponding dashboard
      switch (role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'TEACHER': navigate('/teacher'); break;
        case 'STUDENT': navigate('/student'); break;
        case 'PARENT': navigate('/parent'); break;
      }
    }
  }, [user, store, navigate]);
  
  // Active role checks (for UI context)
  const isAdmin = activeRole === 'ADMIN';
  const isTeacher = activeRole === 'TEACHER';
  const isStudent = activeRole === 'STUDENT';
  const isParent = activeRole === 'PARENT';

// Permission checks (checks if user has the role at all)
  const canBeAdmin = user?.roles?.includes('ADMIN') ?? false;
  const canBeTeacher = user?.roles?.includes('TEACHER') ?? false;
  const canBeStudent = user?.roles?.includes('STUDENT') ?? false;
  const canBeParent = user?.roles?.includes('PARENT') ?? false;
  
  return {
    // State
    user,
    role: activeRole, // Keeping 'role' name for compatibility
    activeRole,
    isAuthenticated,
    isLoading,
    error,
    
    // Active role checks
    isAdmin,
    isTeacher,
    isStudent,
    isParent,

    // Permission checks
    canBeAdmin,
    canBeTeacher,
    canBeStudent,
    canBeParent,
    hasRole,
    isActiveRole,
    
    // Actions
    login,
    logout,
    switchRole,
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
      const userData = await authApi.getCurrentUser();
      
      // Update store with data from backend
      store.login({
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: userData.full_name,
        roles: userData.roles || [],
      });
      
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
