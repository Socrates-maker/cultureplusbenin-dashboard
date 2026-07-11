import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/auth-context';
import type { Role } from '@/lib/types';
import { EmptyState } from './EmptyState';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // The dashboard is for staff only — regular users have no back-office access.
  if (user && user.role === 'user') {
    return (
      <div className="p-10">
        <EmptyState message="Votre compte n'a pas accès à l'administration." />
      </div>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="p-10">
        <EmptyState message="Vous n'avez pas les droits pour accéder à cette page." />
      </div>
    );
  }

  return <>{children}</>;
}
