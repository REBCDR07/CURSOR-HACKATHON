import { Navigate } from 'react-router-dom';
import { isAuthenticated, getSession, type UserRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  role?: UserRole;
}

export default function AuthGuard({ children, role }: AuthGuardProps) {
  if (!isAuthenticated()) return <Navigate to="/connexion" replace />;
  const session = getSession();
  if (role && session?.role !== role) {
    return <Navigate to={session?.role === 'medecin' ? '/medecin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}
