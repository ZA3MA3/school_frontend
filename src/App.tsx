import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/landingPage';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import { useIsAuthenticated, useActiveRole } from '@/stores/authStore';

// Home component that redirects based on auth status and activeRole
function HomeRedirect() {
  const isAuthenticated = useIsAuthenticated();
  const activeRole = useActiveRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to active-role dashboard
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Root - Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Entry Point - redirects based on auth status */}
        <Route path="/dashboard" element={<HomeRedirect />} />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/payment/failed" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Payment Failed</h1>
            <p className="text-neutral-400">Something went wrong. Please try again.</p>
          </div>
        } />

        {/* Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App
