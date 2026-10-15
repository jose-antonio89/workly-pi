import { Navigate, Outlet } from 'react-router';
import useSession from '../hooks/useSession.js';
import { LoadingState } from './ui/Feedback';

export default function GuestRoute() {
  const status = useSession();
  if (status === 'loading') return <LoadingState message="Verificando sessão..." />;
  return status === 'authenticated' ? <Navigate to="/" replace /> : <Outlet />;
}
