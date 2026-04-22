import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Role types
export type UserRole = 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';

// Priority order for picking default active role on login
const ROLE_PRIORITY: UserRole[] = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];

// User type
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: UserRole[];
}

// Auth state interface
export interface AuthState {
  // State
  user: User | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setActiveRole: (role: UserRole) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

function pickDefaultRole(roles: UserRole[]): UserRole | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? null;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        activeRole: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user }),

        setActiveRole: (role) => set({ activeRole: role }),

        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),

        login: (user) => set({
          user,
          activeRole: pickDefaultRole(user.roles),
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),

        logout: () => set({
          user: null,
          activeRole: null,
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
          activeRole: state.activeRole,
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
export const useActiveRole = () => useAuthStore((state) => state.activeRole);
/** @deprecated use useActiveRole instead */
export const useUserRole = () => useAuthStore((state) => state.activeRole);

// Auth actions hook
export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    setUser: store.setUser,
    setActiveRole: store.setActiveRole,
    setAuthenticated: store.setAuthenticated,
    setLoading: store.setLoading,
    setError: store.setError,
    login: store.login,
    logout: store.logout,
    clearError: store.clearError,
  };
};
