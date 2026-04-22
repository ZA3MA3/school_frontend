import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, activeRole, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  // We check if the user HAS the role in their roles array
  // And also if the current active role is allowed for this route
  // If the user HAS the role but it's not active, we might want to automatically switch it or redirect
  if (allowedRoles && user) {
    const hasRequiredRole = allowedRoles.some(role => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      // User doesn't have any of the required roles at all
      return <Navigate to="/" replace />;
    }

    // User has the role, but is it the active one?
    // For specific dashboards, we usually want the active role to match
    if (activeRole && !allowedRoles.includes(activeRole)) {
      // Redirect to the correct dashboard for the active role
      switch (activeRole) {
        case 'ADMIN':
          return <Navigate to="/admin" replace />;
        case 'TEACHER':
          return <Navigate to="/teacher" replace />;
        case 'STUDENT':
          return <Navigate to="/student" replace />;
        case 'PARENT':
          return <Navigate to="/parent" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  return <>{children}</>;
}
