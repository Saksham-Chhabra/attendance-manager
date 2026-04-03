import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

// Encapsulates routes requiring authentication and specific roles
const RoleProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Not logged in, kick out to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Logged in but does not have the required role privileges
    // Redirect them to their designated home
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'teacher') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  // They are authenticated and authorized
  return <Outlet />;
};

export default RoleProtectedRoute;
