import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // No token? Send them to the login page
    return <Navigate to="/admin/login" replace />;
  }

  // Token exists? Render the dashboard
  return children;
};

export default ProtectedRoute;