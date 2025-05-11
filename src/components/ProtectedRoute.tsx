
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Temporarily commented out to allow free navigation without login
    /*
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    */

    // Only check roles if user is authenticated and roles are specified
    if (isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Si el usuario no tiene el rol adecuado, redirigimos según su rol
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate, allowedRoles]);

  // Return children regardless of authentication status
  return <>{children}</>;
};

export default ProtectedRoute;
