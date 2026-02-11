import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('userToken');

  if (loading) {
    // Or a spinner component
    return <div>Loading...</div>; 
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = user.role;
    // Check if user has one of the allowed roles (case-insensitive)
    const hasPermission = allowedRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasPermission) {
      const role = userRole.toLowerCase();
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (['teacher', 'hod', 'pm'].includes(role)) return <Navigate to="/teacher" replace />;
      if (role === 'student') return <Navigate to="/student" replace />;
      
      // Fallback for unknown roles or if no specific route matches
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
