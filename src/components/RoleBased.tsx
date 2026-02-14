import type { ReactNode } from 'react';
import { useAuth, type UserRole } from '@/hooks/useAuth';

// Props for role-based components
interface RoleBasedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Component that only renders for specific role(s)
export function RequireRole({ 
  role, 
  children, 
  fallback = null 
}: RoleBasedProps & { role: UserRole | UserRole[] }) {
  const { hasRole } = useAuth();
  
  if (!hasRole(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component that only renders for admin
export function RequireAdmin({ children, fallback = null }: RoleBasedProps) {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component that only renders for teachers
export function RequireTeacher({ children, fallback = null }: RoleBasedProps) {
  const { isTeacher } = useAuth();
  
  if (!isTeacher) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component that only renders for students
export function RequireStudent({ children, fallback = null }: RoleBasedProps) {
  const { isStudent } = useAuth();
  
  if (!isStudent) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component that only renders for parents
export function RequireParent({ children, fallback = null }: RoleBasedProps) {
  const { isParent } = useAuth();
  
  if (!isParent) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component that renders different content based on role
interface RoleSwitchProps {
  admin?: ReactNode;
  teacher?: ReactNode;
  student?: ReactNode;
  parent?: ReactNode;
  default?: ReactNode;
}

export function RoleSwitch({ 
  admin, 
  teacher, 
  student, 
  parent, 
  default: defaultContent 
}: RoleSwitchProps) {
  const { role } = useAuth();
  
  switch (role) {
    case 'ADMIN':
      return <>{admin || defaultContent}</>;
    case 'TEACHER':
      return <>{teacher || defaultContent}</>;
    case 'STUDENT':
      return <>{student || defaultContent}</>;
    case 'PARENT':
      return <>{parent || defaultContent}</>;
    default:
      return <>{defaultContent}</>;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoleBasedRender() {
  const { role, hasRole } = useAuth();
  
  return {
    role,
    isRole: (checkRole: UserRole) => role === checkRole,
    hasRole,
    renderForRole: <T,>(
      roleContent: Record<UserRole, T>,
      defaultContent?: T
    ): T | undefined => {
      if (role && roleContent[role]) {
        return roleContent[role];
      }
      return defaultContent;
    },
  };
}
