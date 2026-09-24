/**
 * ProtectedRoute Component
 * 
 * Route guard that ensures user is authenticated before rendering children
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058BC] mx-auto"></div>
          <p className="mt-4 text-[#717786] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Preserve the original location so we can redirect back after login
    navigate('/login', { state: { from: location } });
    return null;
  }

  // User is authenticated, render the protected route
  return <>{children}</>;
}
