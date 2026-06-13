import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect , useState} from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/landingPage';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import { useIsAuthenticated, useActiveRole } from '@/stores/authStore';
import  apiClient  from '@/lib/api';

// Home component that redirects based on auth status and activeRole
function HomeRedirect() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const activeRole = useActiveRole();
  const [restoringSession, setRestoringSession] =useState(
    () => !!localStorage.getItem('pending_refresh_token') 
  );


  useEffect(() => {
    const pendingToken = localStorage.getItem('pending_refresh_token');
    if (pendingToken) {
      setRestoringSession(true);
      apiClient.post('/users/token/refresh/', { refresh_token: pendingToken })
        .then(() => {
          localStorage.removeItem('pending_refresh_token');
        })
        .catch(() => {
          localStorage.removeItem('pending_refresh_token');
          navigate('/login');
        });
    }
  }, [navigate]);

  if (restoringSession) {
    return <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <p className="text-neutral-400">Loading...</p>
    </div>;
  }
  
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
