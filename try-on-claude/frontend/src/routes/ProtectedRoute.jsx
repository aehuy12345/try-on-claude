import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/useAuth.js';

/** Pages for signed-in users only. Real authorization is enforced by the backend. */
export default function ProtectedRoute() {
  const { isAuthenticated, sessionExpired } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    const state = sessionExpired ? { from, reason: 'session_expired' } : { from };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
