import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (requiredRole: User['tipo'][]) => boolean;
  checkPermission: (permissionId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('pdv_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    try {
      const foundUser = await db.getUserByCredentials(usuario, senha);
    
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('pdv_current_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pdv_current_user');
  };

  const hasPermission = (requiredRoles: User['tipo'][]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.tipo);
  };

  const checkPermission = (permissionId: string): boolean => {
    if (!user) return false;
    
    // Carregar as definições de permissões
    const rolesPermissions = JSON.parse(localStorage.getItem('pdv_roles_permissions') || '[]');
    
    // Encontrar o cargo do usuário atual
    const userRole = rolesPermissions.find((role: any) => role.id === user.tipo);
    
    // Verificar se o usuário tem a permissão específica
    if (userRole && userRole.permissions) {
      return userRole.permissions.includes(permissionId);
    }
    
    // Administradores têm acesso a tudo por padrão
    if (user.tipo === 'administrador') return true;
    
    return false;
  };

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    checkPermission
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};