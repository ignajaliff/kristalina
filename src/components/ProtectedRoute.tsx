
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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

  // Si el usuario está autenticado y tiene el rol adecuado, mostramos el contenido
  if (isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)))) {
    return <>{children}</>;
  }

  // Mientras verificamos, podríamos mostrar un loader
  return <div className="flex items-center justify-center h-screen">Cargando...</div>;
};

export default ProtectedRoute;
