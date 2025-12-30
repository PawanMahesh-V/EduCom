import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = sessionStorage.getItem('userToken');

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'Admin':
        return <Navigate to="/admin" replace />;
      case 'Teacher':
        return <Navigate to="/teacher" replace />;
      case 'Student':
        return <Navigate to="/student" replace />;
      case 'HOD':
        return <Navigate to="/hod" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;