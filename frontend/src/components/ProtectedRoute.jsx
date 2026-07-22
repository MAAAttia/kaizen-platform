import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Checking your session…" />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.status === 'PENDING') return <Navigate to="/pending" replace />;
  if (user.status === 'REJECTED' || user.status === 'SUSPENDED') return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
}
