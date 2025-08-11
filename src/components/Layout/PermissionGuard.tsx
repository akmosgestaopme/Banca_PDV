import React, { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Lock, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface PermissionGuardProps {
  permissionId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permissionId, 
  fallback, 
  children 
}) => {
  const { checkPermission } = useAuth();
  const { theme } = useTheme();
  
  const hasPermission = checkPermission(permissionId);
  
  if (hasPermission) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Componente padrão de acesso negado
  return (
    <div className={`p-8 rounded-xl text-center ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
    }`}>
      <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
        <Lock size={32} className="text-red-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">Acesso Restrito</h3>
      <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Você não tem permissão para acessar este recurso.
      </p>
      <div className={`p-4 rounded-lg flex items-start gap-3 ${
        theme === 'dark' ? 'bg-yellow-900/20 text-yellow-200' : 'bg-yellow-50 text-yellow-800'
      }`}>
        <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
        <p className="text-sm">
          Se você acredita que deveria ter acesso a este recurso, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default PermissionGuard;