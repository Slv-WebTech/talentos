import { Navigate } from 'react-router-dom';
import { getSession } from '../services/authService';

export default function ProtectedRoute({ children, role }) {
  const session = getSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (role && session.user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
