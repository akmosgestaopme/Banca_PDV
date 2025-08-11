import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Package, DollarSign, FileText, BarChart3, Eye, Edit, Truck, Tag, Calendar, Database, Bell, BookOpen, Building, Palette, Search, Filter, Download, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { db } from '../../services/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: React.ComponentType<any>;
}

const RolesPermissionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  const permissions: Permission[] = [
    // PDV
    { id: 'pdv_access', name: 'Acessar PDV', description: 'Acesso ao sistema de vendas', module: 'PDV' },
    { id: 'pdv_sell', name: 'Realizar Vendas', description: 'Efetuar vendas no PDV', module: 'PDV' },
    { id: 'pdv_cancel', name: 'Cancelar Vendas', description: 'Cancelar vendas realizadas', module: 'PDV' },
    { id: 'pdv_discount', name: 'Aplicar Descontos', description: 'Aplicar descontos nas vendas', module: 'PDV' },
    { id: 'pdv_price_override', name: 'Alterar Preços', description: 'Alterar preços durante a venda', module: 'PDV' },
    
    // Produtos
    { id: 'products_view', name: 'Visualizar Produtos', description: 'Ver lista de produtos', module: 'Produtos' },
    { id: 'products_create', name: 'Criar Produtos', description: 'Adicionar novos produtos', module: 'Produtos' },
    { id: 'products_edit', name: 'Editar Produtos', description: 'Modificar produtos existentes', module: 'Produtos' },
    { id: 'products_delete', name: 'Excluir Produtos', description: 'Remover produtos do sistema', module: 'Produtos' },
    { id: 'products_import', name: 'Importar Produtos', description: 'Importar produtos em massa', module: 'Produtos' },
    { id: 'products_export', name: 'Exportar Produtos', description: 'Exportar lista de produtos', module: 'Produtos' },
    
    // Categorias
    { id: 'categories_view', name: 'Visualizar Categorias', description: 'Ver lista de categorias', module: 'Categorias' },
    { id: 'categories_create', name: 'Criar Categorias', description: 'Adicionar novas categorias', module: 'Categorias' },
    { id: 'categories_edit', name: 'Editar Categorias', description: 'Modificar categorias existentes', module: 'Categorias' },
    { id: 'categories_delete', name: 'Excluir Categorias', description: 'Remover categorias do sistema', module: 'Categorias' },
    
    // Fornecedores
    { id: 'suppliers_view', name: 'Visualizar Fornecedores', description: 'Ver lista de fornecedores', module: 'Fornecedores' },
    { id: 'suppliers_create', name: 'Criar Fornecedores', description: 'Adicionar novos fornecedores', module: 'Fornecedores' },
    { id: 'suppliers_edit', name: 'Editar Fornecedores', description: 'Modificar fornecedores existentes', module: 'Fornecedores' },
    { id: 'suppliers_delete', name: 'Excluir Fornecedores', description: 'Remover fornecedores do sistema', module: 'Fornecedores' },
    
    // Estoque
    { id: 'stock_view', name: 'Visualizar Estoque', description: 'Ver níveis de estoque', module: 'Estoque' },
    { id: 'stock_adjust', name: 'Ajustar Estoque', description: 'Fazer ajustes no estoque', module: 'Estoque' },
    { id: 'stock_transfer', name: 'Transferir Estoque', description: 'Transferir produtos entre locais', module: 'Estoque' },
    { id: 'stock_inventory', name: 'Inventário', description: 'Realizar contagem de inventário', module: 'Estoque' },
    
    // Financeiro
    { id: 'financial_view', name: 'Visualizar Financeiro', description: 'Ver dados financeiros', module: 'Financeiro' },
    { id: 'financial_expenses', name: 'Gerenciar Despesas', description: 'Cadastrar e editar despesas', module: 'Financeiro' },
    { id: 'financial_revenue', name: 'Gerenciar Receitas', description: 'Cadastrar e editar receitas', module: 'Financeiro' },
    { id: 'cash_open', name: 'Abrir Caixa', description: 'Abrir sessões de caixa', module: 'Financeiro' },
    { id: 'cash_close', name: 'Fechar Caixa', description: 'Fechar sessões de caixa', module: 'Financeiro' },
    { id: 'cash_movements', name: 'Movimentações', description: 'Registrar entradas e saídas', module: 'Financeiro' },
    
    // Relatórios
    { id: 'reports_sales', name: 'Relatórios de Vendas', description: 'Gerar relatórios de vendas', module: 'Relatórios' },
    { id: 'reports_financial', name: 'Relatórios Financeiros', description: 'Gerar relatórios financeiros', module: 'Relatórios' },
    { id: 'reports_products', name: 'Relatórios de Produtos', description: 'Gerar relatórios de produtos', module: 'Relatórios' },
    { id: 'reports_cash', name: 'Relatórios de Caixa', description: 'Gerar relatórios de caixa', module: 'Relatórios' },
    { id: 'reports_export', name: 'Exportar Relatórios', description: 'Exportar relatórios em PDF/Excel', module: 'Relatórios' },
    
    // Dashboard
    { id: 'dashboard_view', name: 'Visualizar Dashboard', description: 'Acesso ao dashboard gerencial', module: 'Dashboard' },
    { id: 'dashboard_sales', name: 'Métricas de Vendas', description: 'Visualizar métricas de vendas', module: 'Dashboard' },
    { id: 'dashboard_financial', name: 'Métricas Financeiras', description: 'Visualizar métricas financeiras', module: 'Dashboard' },
    { id: 'dashboard_stock', name: 'Métricas de Estoque', description: 'Visualizar métricas de estoque', module: 'Dashboard' },
    
    // Configurações
    { id: 'settings_company', name: 'Dados da Empresa', description: 'Editar dados da empresa', module: 'Configurações' },
    { id: 'settings_users', name: 'Gerenciar Usuários', description: 'Criar e editar usuários', module: 'Configurações' },
    { id: 'settings_permissions', name: 'Gerenciar Permissões', description: 'Configurar permissões', module: 'Configurações' },
    { id: 'settings_appearance', name: 'Aparência', description: 'Personalizar aparência', module: 'Configurações' },
    { id: 'settings_backup', name: 'Backup', description: 'Fazer backup dos dados', module: 'Configurações' },
    { id: 'settings_notifications', name: 'Notificações', description: 'Configurar notificações', module: 'Configurações' },
    { id: 'settings_tutorial', name: 'Tutorial', description: 'Acessar tutoriais do sistema', module: 'Configurações' },
  ];

  // Default roles with their original structure including React components
  const getDefaultRoles = (): Role[] => [
    {
      id: 'vendedor',
      name: 'Vendedor',
      description: 'Acesso básico para vendas',
      color: '#10B981',
      icon: Users,
      permissions: [
        'pdv_access',
        'pdv_sell',
        'products_view',
        'stock_view',
        'categories_view',
        'settings_tutorial'
      ]
    },
    {
      id: 'gerente',
      name: 'Gerente',
      description: 'Acesso a vendas e relatórios',
      color: '#3B82F6',
      icon: BarChart3,
      permissions: [
        'pdv_access',
        'pdv_sell',
        'pdv_cancel',
        'pdv_discount',
        'pdv_price_override',
        'products_view',
        'products_create',
        'products_edit',
        'products_import',
        'products_export',
        'categories_view',
        'categories_create',
        'categories_edit',
        'suppliers_view',
        'suppliers_create',
        'suppliers_edit',
        'stock_view',
        'stock_adjust',
        'stock_inventory',
        'financial_view',
        'financial_expenses',
        'financial_revenue',
        'cash_open',
        'cash_close',
        'cash_movements',
        'reports_sales',
        'reports_financial',
        'reports_products',
        'reports_cash',
        'reports_export',
        'dashboard_view',
        'dashboard_sales',
        'dashboard_financial',
        'dashboard_stock',
        'settings_tutorial'
      ]
    },
    {
      id: 'administrador',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      color: '#EF4444',
      icon: Shield,
      permissions: permissions.map(p => p.id)
    }
  ];

  const [roles, setRoles] = useState<Role[]>(getDefaultRoles());
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load only permissions from localStorage, preserving the original role structure
    const savedPermissions = localStorage.getItem('pdv_roles_permissions');
    if (savedPermissions) {
      try {
        const permissionsData = JSON.parse(savedPermissions);
        const defaultRoles = getDefaultRoles();
        
        // Update only the permissions for each role, keeping everything else intact
        const updatedRoles = defaultRoles.map(defaultRole => {
          const savedRole = permissionsData.find((r: any) => r.id === defaultRole.id);
          return savedRole ? { ...defaultRole, permissions: savedRole.permissions } : defaultRole;
        });
        
        setRoles(updatedRoles);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        // If there's an error, keep the default roles
        setRoles(getDefaultRoles());
      }
    }
  }, []);

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as { [key: string]: Permission[] });

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'PDV': return <Package size={20} />;
      case 'Produtos': return <Package size={20} />;
      case 'Categorias': return <Tag size={20} />;
      case 'Fornecedores': return <Truck size={20} />;
      case 'Estoque': return <Package size={20} />;
      case 'Financeiro': return <DollarSign size={20} />;
      case 'Relatórios': return <FileText size={20} />;
      case 'Dashboard': return <BarChart3 size={20} />;
      case 'Configurações': return <Settings size={20} />;
      default: return <Shield size={20} />;
    }
  };

  const handleRolePermissionToggle = (roleId: string, permissionId: string) => {
    if (!isEditing) return;
    
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId]
        };
      }
      return role;
    }));
  };

  const saveChanges = () => {
    // Save only the id and permissions to localStorage, not the entire role object
    const permissionsData = roles.map(role => ({
      id: role.id,
      permissions: role.permissions
    }));
    
    localStorage.setItem('pdv_roles_permissions', JSON.stringify(permissionsData));
    setIsEditing(false);
    alert('Permissões salvas com sucesso!');
  };

  const generatePermissionsPDF = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Carregar dados da empresa
      const companyDataStr = localStorage.getItem('company_data');
      const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Cabeçalho com dados da empresa (apenas se informados)
      if (companyData && (companyData.nomeFantasia || companyData.razaoSocial)) {
        doc.setFontSize(14);
        doc.text(companyData.nomeFantasia || companyData.razaoSocial, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
        
        if (companyData.cnpj) {
          doc.setFontSize(10);
          doc.text(`CNPJ: ${companyData.cnpj}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 6;
        }
        yPosition += 5;
      }

      // Título do relatório
      doc.setFontSize(16);
      doc.text('MATRIZ DE PERMISSÕES DO SISTEMA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Descrição dos cargos
      doc.setFontSize(12);
      doc.text('CARGOS DO SISTEMA', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      roles.forEach((role, index) => {
        doc.text(`${index + 1}. ${role.name}: ${role.description}`, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;

      // Matriz de permissões por módulo
      Object.entries(groupedPermissions).forEach(([module, modulePermissions]) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`MÓDULO: ${module}`, 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(9);
        modulePermissions.forEach(permission => {
          doc.text(`• ${permission.name}: ${permission.description}`, 25, yPosition);
          yPosition += 5;
          
          doc.text('Cargos com esta permissão:', 30, yPosition);
          yPosition += 5;
          
          const rolesWithPermission = roles.filter(role => role.permissions.includes(permission.id));
          if (rolesWithPermission.length > 0) {
            doc.text(rolesWithPermission.map(r => r.name).join(', '), 35, yPosition);
          } else {
            doc.text('Nenhum cargo possui esta permissão', 35, yPosition);
          }
          yPosition += 8;
        });
        
        yPosition += 10;
      });

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`permissoes-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredPermissions = Object.entries(groupedPermissions).reduce((acc, [module, perms]) => {
    if (filterModule !== 'all' && module !== filterModule) {
      return acc;
    }
    
    const filteredPerms = perms.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredPerms.length > 0) {
      acc[module] = filteredPerms;
    }
    
    return acc;
  }, {} as { [key: string]: Permission[] });

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-100'
              }`}>
                <Shield size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Cargos e Permissões</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gerencie os níveis de acesso ao sistema
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={generatePermissionsPDF}
                disabled={isGeneratingPdf}
                className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } shadow-lg`}
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Exportar PDF
                  </>
                )}
              </button>
              
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 border-2 border-gray-300 text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveChanges}
                      className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
                    >
                      <CheckCircle size={24} />
                      Salvar Alterações
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-secondary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
                  >
                    <Edit size={24} />
                    Editar Permissões
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar permissões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos os Módulos</option>
                  {Object.keys(groupedPermissions).map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>
              
              {isEditing && (
                <div className={`px-4 py-3 rounded-xl ${
                  theme === 'dark' ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-50 text-yellow-800'
                } flex items-center gap-2`}>
                  <AlertTriangle size={20} />
                  <span className="font-medium">Modo de Edição Ativo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Cargos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const permissionCount = role.permissions.length;
            const permissionPercentage = Math.round((permissionCount / permissions.length) * 100);
            
            return (
              <div
                key={role.id}
                className={`p-6 rounded-3xl shadow-xl border-l-4 cursor-pointer transition-all hover:shadow-2xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } ${selectedRole?.id === role.id ? 'ring-2 ring-blue-500 transform scale-105' : ''}`}
                style={{ borderLeftColor: role.color }}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: role.color }}
                  >
                    <Icon size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{role.name}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Nível de Acesso:</span>
                    <span className="text-sm font-bold" style={{ color: role.color }}>
                      {permissionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${permissionPercentage}%`,
                        backgroundColor: role.color
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {Object.keys(groupedPermissions).map(module => {
                      const modulePermissions = groupedPermissions[module];
                      const hasPermissions = modulePermissions.some(p => role.permissions.includes(p.id));
                      
                      return hasPermissions ? (
                        <span 
                          key={module}
                          className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                        >
                          {module}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Matriz de Permissões */}
        <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield size={24} className="text-primary" />
                Matriz de Permissões
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {isEditing ? 'Clique nas células para alterar as permissões' : 'Visualização das permissões por cargo'}
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Permissão</th>
                  {roles.map(role => (
                    <th key={role.id} className="px-4 py-4 text-center text-sm font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: role.color }}
                        >
                          <role.icon size={20} className="text-white" />
                        </div>
                        <span>{role.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {Object.entries(filteredPermissions).map(([module, modulePermissions]) => (
                  <React.Fragment key={module}>
                    <tr className={theme === 'dark' ? 'bg-gray-750' : 'bg-gray-25'}>
                      <td colSpan={roles.length + 1} className="px-6 py-3">
                        <div className="flex items-center gap-2 font-semibold">
                          {getModuleIcon(module)}
                          <span>{module}</span>
                        </div>
                      </td>
                    </tr>
                    {modulePermissions.map(permission => (
                      <tr key={permission.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {permission.description}
                            </div>
                          </div>
                        </td>
                        {roles.map(role => (
                          <td key={`${role.id}-${permission.id}`} className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleRolePermissionToggle(role.id, permission.id)}
                              disabled={!isEditing}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                role.permissions.includes(permission.id)
                                  ? 'text-white'
                                  : theme === 'dark' 
                                    ? 'bg-gray-600 text-gray-400' 
                                    : 'bg-gray-200 text-gray-500'
                              } ${isEditing ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                              style={role.permissions.includes(permission.id) ? { backgroundColor: role.color } : {}}
                            >
                              {role.permissions.includes(permission.id) ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {Object.keys(filteredPermissions).length === 0 && (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-6 py-12 text-center">
                      <Search size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Nenhuma permissão encontrada</p>
                      <p className="text-sm text-gray-500">Tente ajustar os filtros ou termos de busca</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações sobre Permissões */}
        <div className={`mt-8 p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Info size={24} className="text-primary" />
            Informações sobre Permissões
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Descrição dos Cargos
              </h4>
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.id} className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: role.color }}
                      >
                        <role.icon size={16} className="text-white" />
                      </div>
                      <span className="font-bold">{role.name}</span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {role.description}
                    </p>
                    <div className="mt-2 text-xs">
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {role.permissions.length} permissões ({Math.round((role.permissions.length / permissions.length) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Módulos do Sistema
              </h4>
              <div className="space-y-3">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getModuleIcon(module)}
                      <span className="font-bold">{module}</span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {perms.length} permissões disponíveis
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {roles.map(role => {
                        const hasPermissions = perms.some(p => role.permissions.includes(p.id));
                        return hasPermissions ? (
                          <span 
                            key={role.id}
                            className="text-xs px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: role.color }}
                          >
                            {role.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-600" />
                Recomendações de Segurança
              </h4>
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <ul className={`space-y-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Siga o princípio do menor privilégio: conceda apenas as permissões necessárias para cada função.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Revise periodicamente as permissões de cada cargo para garantir que estejam atualizadas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Mantenha o número de usuários com permissões administrativas o menor possível.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Documente todas as alterações nas permissões para fins de auditoria.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Treine os usuários sobre a importância da segurança e o uso responsável de suas permissões.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>Realize auditorias periódicas para verificar se as permissões estão sendo usadas corretamente.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Cargos e Permissões • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissionsScreen;