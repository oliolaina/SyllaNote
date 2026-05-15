import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const { initialize, isLoading, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading || (token && !isAuthenticated)) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
