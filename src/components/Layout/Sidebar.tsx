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
  Upload,
  Home,
  BookOpen,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout, hasPermission, checkPermission } = useAuth();
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['sistema', 'configuracoes']);
  const [showLogoUpload, setShowLogoUpload] = useState(false);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        localStorage.setItem('company_logo', result);
        setShowLogoUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const companyLogo = localStorage.getItem('company_logo');

  const menuItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      permissions: ['administrador', 'gerente', 'vendedor'],
      permissionId: null
    },
    { 
      id: 'pdv', 
      label: 'PDV', 
      icon: ShoppingCart, 
      permissions: ['administrador', 'gerente', 'vendedor'],
      permissionId: 'pdv_access'
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      permissions: ['administrador', 'gerente'],
      permissionId: 'dashboard_view'
    },
    { 
      id: 'caixa', 
      label: 'Controle de Caixa', 
      icon: Calculator, 
      permissions: ['administrador', 'gerente'],
      permissionId: 'financial_view'
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: Settings,
      permissions: ['administrador', 'gerente'],
      permissionId: null,
      isExpandable: true,
      subItems: [
        { id: 'produtos', label: 'Produtos', icon: Package, permissions: ['administrador', 'gerente'], permissionId: 'products_view' },
        { id: 'categorias', label: 'Categorias', icon: Tag, permissions: ['administrador', 'gerente'], permissionId: 'categories_view' },
        { id: 'fornecedores', label: 'Fornecedores', icon: Truck, permissions: ['administrador', 'gerente'], permissionId: 'suppliers_view' },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign, permissions: ['administrador', 'gerente'], permissionId: 'financial_view' },
        { id: 'relatorios', label: 'Relatórios', icon: FileText, permissions: ['administrador', 'gerente'], permissionId: 'reports_sales' }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      permissions: ['administrador'],
      permissionId: null,
      isExpandable: true,
      subItems: [
        { id: 'dados-empresa', label: 'Dados da Empresa', icon: Building, permissions: ['administrador'], permissionId: 'settings_company' },
        { id: 'usuarios', label: 'Usuários', icon: Users, permissions: ['administrador'], permissionId: 'settings_users' },
        { id: 'cargos-permissoes', label: 'Cargos e Permissões', icon: Shield, permissions: ['administrador'], permissionId: 'settings_permissions' },
        { id: 'aparencia', label: 'Aparência', icon: Palette, permissions: ['administrador'], permissionId: 'settings_appearance' },
        { id: 'tutorial', label: 'Tutorial', icon: BookOpen, permissions: ['administrador', 'gerente', 'vendedor'], permissionId: 'settings_tutorial' },
        { id: 'notificacoes', label: 'Notificações', icon: Bell, permissions: ['administrador'], permissionId: 'settings_notifications' },
        { id: 'backup', label: 'Backup', icon: Database, permissions: ['administrador'], permissionId: 'settings_backup' }
      ]
    }
  ];

  const visibleItems = menuItems.filter(item => {
    // Verificar permissões baseadas em cargo
    const hasRolePermission = hasPermission(item.permissions as any);
    
    // Verificar permissões específicas se definidas
    const hasSpecificPermission = item.permissionId ? checkPermission(item.permissionId) : true;
    
    return hasRolePermission && hasSpecificPermission;
  });

  const renderMenuItem = (item: any, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    const isExpanded = expandedMenus.includes(item.id);
    
    // Verificar permissões específicas para este item
    const hasSpecificPermission = item.permissionId ? checkPermission(item.permissionId) : true;
    
    // Se não tiver permissão específica, não renderizar
    if (!hasSpecificPermission) return null;

    if (item.isExpandable) {
      // Verificar se pelo menos um subitem tem permissão
      const hasAnySubItemPermission = item.subItems.some((subItem: any) => {
        const hasRolePermission = hasPermission(subItem.permissions as any);
        const hasSubItemSpecificPermission = subItem.permissionId ? checkPermission(subItem.permissionId) : true;
        return hasRolePermission && hasSubItemSpecificPermission;
      });
      
      // Se nenhum subitem tiver permissão, não mostrar o menu expansível
      if (!hasAnySubItemPermission) return null;
      
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? `text-white shadow-lg`
                : `text-blue-100 hover:text-white hover:bg-blue-700`
            }`}
            style={isActive ? { backgroundColor: secondaryColor } : {}}
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
                .filter((subItem: any) => {
                  const hasRolePermission = hasPermission(subItem.permissions as any);
                  const hasSubItemSpecificPermission = subItem.permissionId ? checkPermission(subItem.permissionId) : true;
                  return hasRolePermission && hasSubItemSpecificPermission;
                })
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
            ? `text-white shadow-lg`
            : `text-blue-100 hover:text-white hover:bg-blue-700`
        }`}
        style={isActive ? { backgroundColor: secondaryColor } : {}}
      >
        <Icon size={isSubItem ? 18 : 20} />
        <span className={isSubItem ? 'font-normal' : 'font-medium'}>{item.label}</span>
      </button>
    );
  };

  return (
    <div 
      className="w-64 min-h-screen flex flex-col shadow-2xl text-white sidebar-gradient"
    >
      {/* Header */}
      <div className="p-6 border-b border-blue-600/30">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer relative"
            style={{ backgroundColor: secondaryColor }}
            onClick={() => setShowLogoUpload(true)}
          >
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />
            ) : (
              <ShoppingCart size={20} className="text-white" />
            )}
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Upload size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">PDV BANCA</h1>
            <p className="text-sm text-blue-200">SISTEMAS ERP</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: secondaryColor }}
            >
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

      {/* Logo Upload Modal */}
      {showLogoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Upload da Logo</h3>
              <button
                onClick={() => setShowLogoUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a logo da empresa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Formatos aceitos: JPG, PNG, GIF. Tamanho recomendado: 200x200px
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;