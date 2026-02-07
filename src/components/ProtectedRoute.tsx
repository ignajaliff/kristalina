import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { userProfile, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Verificar roles si están especificados
    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
      // Si el usuario no tiene el rol adecuado, redirigimos según su rol
      if (userProfile.role === 'administrador') {
        navigate('/admin');
      } else if (userProfile.role === 'vendedor') {
        navigate('/seller');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, userProfile, navigate, allowedRoles]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No renderizar si no está autenticado
  if (!isAuthenticated) {
    return null;
  }

  // No renderizar si no tiene el rol adecuado
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
