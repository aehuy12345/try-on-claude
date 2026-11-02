import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/useAuth.js';

/** Pages for visitors only. The single place that redirects after login/register succeeds. */
export default function GuestRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to={location.state?.from ?? '/profile'} replace />;
  return <Outlet />;
}
