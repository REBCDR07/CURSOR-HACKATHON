import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

export default function Index() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
}
