import { Navigate, Outlet, useLocation } from 'react-router';
import useSession from '../hooks/useSession.js';
import { LoadingState, ErrorState } from './ui/Feedback';

export default function ProtectedRoute() {
  const status = useSession();
  const location = useLocation();
  if (status === 'loading') return <LoadingState message="Verificando sessão..." />;
  if (status === 'error')
    return (
      <ErrorState>
        Não foi possível verificar sua sessão.{' '}
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </ErrorState>
    );
  return status === 'authenticated' ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search + location.hash }}
      replace
    />
  );
}
