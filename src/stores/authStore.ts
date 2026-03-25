import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Role types
export type UserRole = 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';

// User type
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: UserRole;
}

// Auth state interface
export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // Actions
        setUser: (user) => set({ user }),
        
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        login: (user) => set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),
        
        logout: () => set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),
        
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        // Only persist non-sensitive data (never persist tokens when using HttpOnly cookies)
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserRole = () => useAuthStore((state) => state.user?.role);

// Auth actions hook
export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    setUser: store.setUser,
    setAuthenticated: store.setAuthenticated,
    setLoading: store.setLoading,
    setError: store.setError,
    login: store.login,
    logout: store.logout,
    clearError: store.clearError,
  };
};
