import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Loading screen shown during initial session verification.
 * Matches SpeechEngine aesthetic in both dark and light modes.
 */
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg flex items-center justify-center text-white font-black text-xl animate-pulse">
            SE
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-brand-500/20 blur-md animate-pulse" />
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable ProtectedRoute guard.
 * Redirects unauthenticated users to /login and preserves intended destination.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
}

/**
 * Guard for public authentication pages (/login, /register).
 * If the user is already authenticated, redirects them to /create (or intended destination).
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/create';
    return <Navigate to={destination} replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
