import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from './useAuth';

/** Solo para no autenticados (login/register); con sesión redirige a Home. */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
