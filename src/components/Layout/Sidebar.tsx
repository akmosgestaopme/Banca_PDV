import React, { useState } from 'react';
import { 
  ShoppingCart, 
  BarChart3,
  Calculator,
  Settings,
  Package, 
  Truck, 
  DollarSign, 
  FileText, 
  Users,
  Building,
  Shield,
  Palette,
  Bell,
  Database,
  ChevronDown,
  ChevronRight,
  LogOut,
  Tag,
  Home,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout, hasPermission } = useAuth();
  const { theme } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['sistema', 'configuracoes']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      permissions: ['administrador', 'gerente', 'vendedor']
    },
    { 
      id: 'pdv', 
      label: 'PDV', 
      icon: ShoppingCart, 
      permissions: ['administrador', 'gerente', 'vendedor']
    },
    { 
      id: 'caixa', 
      label: 'Controle de Caixa', 
      icon: Calculator, 
      permissions: ['administrador', 'gerente']
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: Settings,
      permissions: ['administrador', 'gerente'],
      isExpandable: true,
      subItems: [
        { id: 'produtos', label: 'Produtos', icon: Package, permissions: ['administrador', 'gerente'] },
        { id: 'categorias', label: 'Categorias', icon: Tag, permissions: ['administrador', 'gerente'] },
        { id: 'fornecedores', label: 'Fornecedores', icon: Truck, permissions: ['administrador', 'gerente'] },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign, permissions: ['administrador', 'gerente'] }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      permissions: ['administrador'],
      isExpandable: true,
      subItems: [
        { id: 'dados-empresa', label: 'Dados da Empresa', icon: Building, permissions: ['administrador'] },
        { id: 'usuarios', label: 'Usuários', icon: Users, permissions: ['administrador'] },
        { id: 'cargos-permissoes', label: 'Cargos e Permissões', icon: Shield, permissions: ['administrador'] },
        { id: 'aparencia', label: 'Aparência', icon: Palette, permissions: ['administrador'] },
        { id: 'tutorial', label: 'Tutorial', icon: BookOpen, permissions: ['administrador', 'gerente', 'vendedor'] },
        { id: 'notificacoes', label: 'Notificações', icon: Bell, permissions: ['administrador'] },
        { id: 'backup', label: 'Backup', icon: Database, permissions: ['administrador'] }
      ]
    }
  ];

  const visibleItems = menuItems.filter(item => 
    hasPermission(item.permissions as any)
  );

  const renderMenuItem = (item: any, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    const isExpanded = expandedMenus.includes(item.id);

    if (item.isExpandable) {
      const hasAnySubItemPermission = item.subItems.some((subItem: any) => 
        hasPermission(subItem.permissions as any)
      );
      
      if (!hasAnySubItemPermission) return null;
      
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-secondary text-white shadow-lg'
                : 'text-blue-100 hover:text-white hover:bg-blue-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isExpanded && item.subItems && (
            <div className="ml-4 mt-2 space-y-1">
              {item.subItems
                .filter((subItem: any) => hasPermission(subItem.permissions as any))
                .map((subItem: any) => renderMenuItem(subItem, true))
              }
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => onPageChange(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
          isSubItem ? 'text-sm' : ''
        } ${
          isActive
            ? 'bg-secondary text-white shadow-lg'
            : 'text-blue-100 hover:text-white hover:bg-blue-700'
        }`}
      >
        <Icon size={isSubItem ? 18 : 20} />
        <span className={isSubItem ? 'font-normal' : 'font-medium'}>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 min-h-screen flex flex-col shadow-2xl text-white bg-gradient-to-b from-primary via-blue-800 to-blue-900">
      {/* Header */}
      <div className="p-6 border-b border-blue-600/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PDV BANCA</h1>
            <p className="text-sm text-blue-200">SISTEMAS ERP</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-sm text-white">{user?.nome}</p>
              <p className="text-xs capitalize text-blue-200">{user?.tipo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {visibleItems.map((item) => renderMenuItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-600/30">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:text-white hover:bg-red-600"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair do Sistema</span>
        </button>
        
        <div className="mt-4 text-center">
          <div className="text-xs text-blue-300">
            <p>PDV Banca de Jornal</p>
            <p>v1.0.0 - Sistema ERP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;