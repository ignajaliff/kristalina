import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

// Definimos los tipos para nuestro contexto
export type UserRole = 'administrador' | 'vendedor' | null;

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

// Proveedor del contexto
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        role: data.role as UserRole,
      };
    }

    return null;
  };

  // Configurar listener de autenticación
  useEffect(() => {
    // Primero configuramos el listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          // Usar setTimeout para evitar problemas de concurrencia con Supabase
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Luego verificamos si hay una sesión existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message === 'Invalid login credentials' 
          ? "Correo o contraseña incorrectos" 
          : error.message,
      });
      throw error;
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      
      if (!profile) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se encontró el perfil del usuario. Contacte al administrador.",
        });
        await supabase.auth.signOut();
        throw new Error('User profile not found');
      }

      setUserProfile(profile);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${profile.nombre}`,
      });

      // Redirigir según el rol
      if (profile.role === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/seller');
      }
    }
    
    setIsLoading(false);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cerrar sesión",
      });
      return;
    }

    setUser(null);
    setUserProfile(null);
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAuthenticated: !!user && !!userProfile, 
      isLoading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
