
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

// Definimos los tipos para nuestro contexto
export type UserRole = 'admin' | 'seller' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Datos de usuario simulados para demostración
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' as UserRole
  },
  {
    id: '2',
    name: 'Seller User',
    email: 'seller@example.com',
    password: 'seller123',
    role: 'seller' as UserRole
  }
];

// Proveedor del contexto
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificamos si hay una sesión guardada al cargar
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Temporarily removed auto-redirect to login
    /*
    else {
      // Si no hay usuario autenticado, redirigimos al login
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
    }
    */
  }, [navigate]);

  const login = async (email: string, password: string) => {
    // Simulación de autenticación
    const foundUser = mockUsers.find(
      (user) => user.email === email && user.password === password
    );

    if (foundUser) {
      // Omitimos la contraseña por seguridad
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userWithoutPassword.name}`,
      });

      // Redirigir según el rol
      if (userWithoutPassword.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/seller');
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Correo o contraseña incorrectos",
      });
      throw new Error('Credenciales inválidas');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
