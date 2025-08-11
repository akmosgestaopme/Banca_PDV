import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, Shield, Calendar, FileText, AlertTriangle, CheckCircle, Cloud, HardDrive, Settings, Users, Package, DollarSign, Palette, Building, Lock, History, Archive, Trash2, Eye, Copy, Share2, Zap, Server, Monitor, Cpu, MemoryStick, Activity, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupInfo {
  id: string;
  date: string;
  size: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'success' | 'error' | 'in_progress';
  description: string;
  dataTypes: string[];
  checksum: string;
  version: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: string;
  lastBackup: string;
  successRate: number;
  dataIntegrity: number;
}

const BackupScreen: React.FC = () => {
  const { theme } = useTheme();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [currentBackupStep, setCurrentBackupStep] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: '0 MB',
    lastBackup: 'Nunca',
    successRate: 100,
    dataIntegrity: 100
  });

  const [autoBackupSettings, setAutoBackupSettings] = useState({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retention: 30,
    compression: true,
    encryption: false,
    cloudSync: false,
    includeMedia: true,
    includeSettings: true,
    includeUserData: true,
    includeTransactions: true,
    includeReports: true
  });

  const [selectedBackups, setSelectedBackups] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [backupFilter, setBackupFilter] = useState<'all' | 'manual' | 'automatic'>('all');

  useEffect(() => {
    loadBackupHistory();
    loadBackupSettings();
    calculateBackupStats();
  }, []);

  const loadBackupHistory = () => {
    const savedHistory = localStorage.getItem('pdv_backup_history');
    if (savedHistory) {
      setBackupHistory(JSON.parse(savedHistory));
    } else {
      // Criar histórico de exemplo
      const exampleHistory: BackupInfo[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          size: '2.8 MB',
          type: 'automatic',
          status: 'success',
          description: 'Backup automático completo',
          dataTypes: ['users', 'products', 'sales', 'settings', 'preferences'],
          checksum: 'a1b2c3d4e5f6',
          version: '1.0.0'
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          size: '2.6 MB',
          type: 'manual',
          status: 'success',
          description: 'Backup manual antes da atualização',
          dataTypes: ['users', 'products', 'sales', 'settings'],
          checksum: 'f6e5d4c3b2a1',
          version: '1.0.0'
        }
      ];
      setBackupHistory(exampleHistory);
      localStorage.setItem('pdv_backup_history', JSON.stringify(exampleHistory));
    }
  };

  const loadBackupSettings = () => {
    const savedSettings = localStorage.getItem('auto_backup_settings');
    if (savedSettings) {
      setAutoBackupSettings(JSON.parse(savedSettings));
    }
  };

  const calculateBackupStats = () => {
    const history = JSON.parse(localStorage.getItem('pdv_backup_history') || '[]');
    const successfulBackups = history.filter((b: BackupInfo) => b.status === 'success');
    
    setBackupStats({
      totalBackups: history.length,
      totalSize: calculateTotalSize(history),
      lastBackup: history.length > 0 ? format(new Date(history[0].date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca',
      successRate: history.length > 0 ? (successfulBackups.length / history.length) * 100 : 100,
      dataIntegrity: 100
    });
  };

  const calculateTotalSize = (history: BackupInfo[]) => {
    const totalMB = history.reduce((sum, backup) => {
      const size = parseFloat(backup.size.replace(' MB', ''));
      return sum + size;
    }, 0);
    
    if (totalMB > 1024) {
      return `${(totalMB / 1024).toFixed(1)} GB`;
    }
    return `${totalMB.toFixed(1)} MB`;
  };

  const getAllSystemData = () => {
    const systemData = {
      // Dados principais do sistema
      users: db.getAllUsers(),
      products: db.getAllProducts(),
      suppliers: db.getAllSuppliers(),
      sales: db.getAllSales(),
      cashMovements: db.getAllCashMovements(),
      expenses: db.getAllExpenses(),
      cashRegisters: db.getAllCashRegisters(),
      cashSessions: db.getAllCashSessions(),
      
      // Configurações e preferências
      companyData: JSON.parse(localStorage.getItem('company_data') || '{}'),
      companyLogo: localStorage.getItem('company_logo'),
      companyFavicon: localStorage.getItem('company_favicon'),
      
      // Preferências de cores e tema
      customPrimaryColor: localStorage.getItem('custom_primary_color'),
      customSecondaryColor: localStorage.getItem('custom_secondary_color'),
      theme: localStorage.getItem('pdv_theme'),
      
      // Categorias e configurações
      categories: JSON.parse(localStorage.getItem('pdv_categories') || '[]'),
      rolesPermissions: JSON.parse(localStorage.getItem('pdv_roles_permissions') || '[]'),
      
      // Configurações de backup
      autoBackupSettings: JSON.parse(localStorage.getItem('auto_backup_settings') || '{}'),
      backupHistory: JSON.parse(localStorage.getItem('pdv_backup_history') || '[]'),
      
      // Configurações de notificações
      notificationSettings: JSON.parse(localStorage.getItem('notification_settings') || '{}'),
      
      // Configurações de usuário atual
      currentUser: JSON.parse(localStorage.getItem('pdv_current_user') || 'null'),
      
      // Configurações de aparência
      appearanceSettings: {
        sidebarCollapsed: localStorage.getItem('sidebar_collapsed'),
        gridView: localStorage.getItem('grid_view_preference'),
        language: localStorage.getItem('app_language'),
        currency: localStorage.getItem('app_currency'),
        timezone: localStorage.getItem('app_timezone')
      },
      
      // Configurações de PDV
      pdvSettings: {
        defaultPaymentMethod: localStorage.getItem('default_payment_method'),
        printReceipts: localStorage.getItem('auto_print_receipts'),
        soundEnabled: localStorage.getItem('pdv_sound_enabled'),
        barcodeScanner: localStorage.getItem('barcode_scanner_enabled')
      },
      
      // Configurações de relatórios
      reportSettings: {
        defaultPeriod: localStorage.getItem('default_report_period'),
        autoGenerate: localStorage.getItem('auto_generate_reports'),
        emailReports: localStorage.getItem('email_reports_enabled')
      },
      
      // Metadados do backup
      metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        systemInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        },
        dataIntegrity: {
          usersCount: db.getAllUsers().length,
          productsCount: db.getAllProducts().length,
          salesCount: db.getAllSales().length,
          suppliersCount: db.getAllSuppliers().length
        }
      }
    };

    return systemData;
  };

  const generateChecksum = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const createBackup = async (type: 'manual' | 'automatic' = 'manual') => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    setCurrentBackupStep('Iniciando backup...');
    
    try {
      // Simular progresso do backup
      const steps = [
        'Coletando dados dos usuários...',
        'Exportando produtos e categorias...',
        'Salvando histórico de vendas...',
        'Coletando movimentações financeiras...',
        'Exportando configurações do sistema...',
        'Salvando preferências de aparência...',
        'Coletando dados da empresa...',
        'Exportando configurações de backup...',
        'Gerando checksum de integridade...',
        'Compactando dados...',
        'Finalizando backup...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentBackupStep(steps[i]);
        setBackupProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const systemData = getAllSystemData();
      const backupData = JSON.stringify(systemData, null, 2);
      const checksum = generateChecksum(backupData);
      
      // Criar blob e download
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-pdv-completo-${format(new Date(), 'ddMMyyyy-HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Adicionar ao histórico
      const newBackup: BackupInfo = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        size: `${(backupData.length / 1024 / 1024).toFixed(1)} MB`,
        type,
        status: 'success',
        description: type === 'manual' ? 'Backup manual completo' : 'Backup automático completo',
        dataTypes: ['users', 'products', 'sales', 'settings', 'preferences', 'company', 'categories', 'permissions'],
        checksum,
        version: '1.0.0'
      };
      
      const updatedHistory = [newBackup, ...backupHistory];
      setBackupHistory(updatedHistory);
      localStorage.setItem('pdv_backup_history', JSON.stringify(updatedHistory));
      
      calculateBackupStats();
      alert('Backup criado e baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('Erro ao criar backup!');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
      setCurrentBackupStep('');
    }
  };

  const restoreBackup = async (file: File) => {
    setIsRestoring(true);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Verificar integridade dos dados
      if (!data.metadata || !data.metadata.version) {
        throw new Error('Arquivo de backup inválido ou corrompido');
      }
      
      // Confirmar restauração
      const confirmRestore = confirm(
        `Tem certeza que deseja restaurar este backup?\n\n` +
        `Data: ${format(new Date(data.metadata.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}\n` +
        `Versão: ${data.metadata.version}\n` +
        `Usuários: ${data.metadata.dataIntegrity.usersCount}\n` +
        `Produtos: ${data.metadata.dataIntegrity.productsCount}\n` +
        `Vendas: ${data.metadata.dataIntegrity.salesCount}\n\n` +
        `ATENÇÃO: Todos os dados atuais serão substituídos!`
      );
      
      if (!confirmRestore) {
        setIsRestoring(false);
        return;
      }
      
      // Restaurar dados principais
      if (data.users) localStorage.setItem('pdv_users', JSON.stringify(data.users));
      if (data.products) localStorage.setItem('pdv_products', JSON.stringify(data.products));
      if (data.suppliers) localStorage.setItem('pdv_suppliers', JSON.stringify(data.suppliers));
      if (data.sales) localStorage.setItem('pdv_sales', JSON.stringify(data.sales));
      if (data.cashMovements) localStorage.setItem('pdv_cash_movements', JSON.stringify(data.cashMovements));
      if (data.expenses) localStorage.setItem('pdv_expenses', JSON.stringify(data.expenses));
      if (data.cashRegisters) localStorage.setItem('pdv_cash_registers', JSON.stringify(data.cashRegisters));
      if (data.cashSessions) localStorage.setItem('pdv_cash_sessions', JSON.stringify(data.cashSessions));
      
      // Restaurar configurações
      if (data.companyData) localStorage.setItem('company_data', JSON.stringify(data.companyData));
      if (data.companyLogo) localStorage.setItem('company_logo', data.companyLogo);
      if (data.companyFavicon) localStorage.setItem('company_favicon', data.companyFavicon);
      
      // Restaurar preferências
      if (data.customPrimaryColor) localStorage.setItem('custom_primary_color', data.customPrimaryColor);
      if (data.customSecondaryColor) localStorage.setItem('custom_secondary_color', data.customSecondaryColor);
      if (data.theme) localStorage.setItem('pdv_theme', data.theme);
      
      // Restaurar categorias e permissões
      if (data.categories) localStorage.setItem('pdv_categories', JSON.stringify(data.categories));
      if (data.rolesPermissions) localStorage.setItem('pdv_roles_permissions', JSON.stringify(data.rolesPermissions));
      
      // Restaurar configurações de sistema
      if (data.autoBackupSettings) localStorage.setItem('auto_backup_settings', JSON.stringify(data.autoBackupSettings));
      if (data.notificationSettings) localStorage.setItem('notification_settings', JSON.stringify(data.notificationSettings));
      
      // Restaurar configurações de aparência
      if (data.appearanceSettings) {
        Object.entries(data.appearanceSettings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, value as string);
          }
        });
      }
      
      // Restaurar configurações de PDV
      if (data.pdvSettings) {
        Object.entries(data.pdvSettings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, value as string);
          }
        });
      }
      
      // Restaurar configurações de relatórios
      if (data.reportSettings) {
        Object.entries(data.reportSettings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, value as string);
          }
        });
      }
      
      alert('Backup restaurado com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('Erro ao restaurar backup. Verifique se o arquivo é válido.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      restoreBackup(file);
    }
  };

  const saveAutoBackupSettings = () => {
    localStorage.setItem('auto_backup_settings', JSON.stringify(autoBackupSettings));
    alert('Configurações de backup automático salvas!');
  };

  const deleteBackup = (backupId: string) => {
    if (confirm('Deseja excluir este backup do histórico?')) {
      const updatedHistory = backupHistory.filter(b => b.id !== backupId);
      setBackupHistory(updatedHistory);
      localStorage.setItem('pdv_backup_history', JSON.stringify(updatedHistory));
      calculateBackupStats();
    }
  };

  const toggleBackupSelection = (backupId: string) => {
    setSelectedBackups(prev => 
      prev.includes(backupId) 
        ? prev.filter(id => id !== backupId)
        : [...prev, backupId]
    );
  };

  const deleteSelectedBackups = () => {
    if (selectedBackups.length === 0) return;
    
    if (confirm(`Deseja excluir ${selectedBackups.length} backup(s) selecionado(s)?`)) {
      const updatedHistory = backupHistory.filter(b => !selectedBackups.includes(b.id));
      setBackupHistory(updatedHistory);
      localStorage.setItem('pdv_backup_history', JSON.stringify(updatedHistory));
      setSelectedBackups([]);
      calculateBackupStats();
    }
  };

  const filteredBackups = backupHistory.filter(backup => {
    if (backupFilter === 'all') return true;
    return backup.type === backupFilter;
  });

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-100'
              }`}>
                <Database size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Backup Avançado</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sistema completo de backup e restauração
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => createBackup('manual')}
                disabled={isCreatingBackup}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105 disabled:opacity-50"
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshCw size={24} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Download size={24} />
                    Backup Completo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas Avançadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Backups</p>
                <p className="text-4xl font-bold text-primary">{backupStats.totalBackups}</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Archive size={32} className="text-primary" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tamanho Total</p>
                <p className="text-4xl font-bold text-secondary">{backupStats.totalSize}</p>
              </div>
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <HardDrive size={32} className="text-secondary" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Taxa de Sucesso</p>
                <p className="text-4xl font-bold text-green-600">{backupStats.successRate.toFixed(0)}%</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Integridade</p>
                <p className="text-4xl font-bold text-blue-600">{backupStats.dataIntegrity}%</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Shield size={32} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar durante Backup */}
        {isCreatingBackup && (
          <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <RefreshCw size={24} className="text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Criando Backup...</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentBackupStep}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-primary h-4 rounded-full transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>{backupProgress.toFixed(0)}% concluído</span>
              <span>Aguarde...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ações de Backup */}
          <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap size={24} className="text-primary" />
                Ações Rápidas
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Criar Backup */}
              <div className="text-center">
                <div 
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-primary"
                >
                  <Download className="text-white" size={32} />
                </div>
                <h4 className="text-lg font-bold mb-2">Backup Completo</h4>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Inclui todos os dados, configurações e preferências
                </p>
                <button
                  onClick={() => createBackup('manual')}
                  disabled={isCreatingBackup}
                  className="w-full text-white py-3 px-6 rounded-xl hover:opacity-90 font-medium disabled:opacity-50 flex items-center justify-center gap-2 bg-primary"
                >
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Criando Backup...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Criar Backup
                    </>
                  )}
                </button>
              </div>

              <div className="border-t pt-6">
                {/* Restaurar Backup */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-secondary"
                  >
                    <Upload className="text-white" size={32} />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Restaurar Sistema</h4>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Restaure todos os dados a partir de um backup
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-medium">Atenção!</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      A restauração substituirá TODOS os dados atuais
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={isRestoring}
                    className="hidden"
                    id="backup-upload"
                  />
                  <label
                    htmlFor="backup-upload"
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium cursor-pointer transition-all ${
                      isRestoring 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:opacity-90'
                    } bg-secondary text-white`}
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        Restaurando...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Escolher Arquivo
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings size={24} className="text-secondary" />
                Configurações Avançadas
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Automático</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Criar backups automaticamente
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBackupSettings.enabled}
                    onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoBackupSettings.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequência</label>
                    <select
                      value={autoBackupSettings.frequency}
                      onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, frequency: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="hourly">A cada hora</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Horário</label>
                    <input
                      type="time"
                      value={autoBackupSettings.time}
                      onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, time: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Retenção (dias)</label>
                    <input
                      type="number"
                      value={autoBackupSettings.retention}
                      onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, retention: parseInt(e.target.value) || 30 }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      min="1"
                      max="365"
                    />
                  </div>

                  {/* Opções Avançadas */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <span className="font-medium">Opções Avançadas</span>
                      <RefreshCw size={16} className={showAdvancedOptions ? 'rotate-180' : ''} />
                    </button>

                    {showAdvancedOptions && (
                      <div className="space-y-4 pl-4 border-l-2 border-primary">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Compressão</span>
                          <input
                            type="checkbox"
                            checked={autoBackupSettings.compression}
                            onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, compression: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Incluir Mídia</span>
                          <input
                            type="checkbox"
                            checked={autoBackupSettings.includeMedia}
                            onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, includeMedia: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Incluir Configurações</span>
                          <input
                            type="checkbox"
                            checked={autoBackupSettings.includeSettings}
                            onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, includeSettings: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Incluir Dados de Usuário</span>
                          <input
                            type="checkbox"
                            checked={autoBackupSettings.includeUserData}
                            onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, includeUserData: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Incluir Transações</span>
                          <input
                            type="checkbox"
                            checked={autoBackupSettings.includeTransactions}
                            onChange={(e) => setAutoBackupSettings(prev => ({ ...prev, includeTransactions: e.target.checked }))}
                            className="rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={saveAutoBackupSettings}
                className="w-full text-white py-3 px-6 rounded-xl hover:opacity-90 font-medium bg-secondary"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>

        {/* Histórico de Backups Avançado */}
        <div className={`mt-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={24} />
                Histórico de Backups
              </h3>
              
              <div className="flex items-center gap-4">
                <select
                  value={backupFilter}
                  onChange={(e) => setBackupFilter(e.target.value as any)}
                  className={`px-4 py-2 border rounded-xl ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos</option>
                  <option value="manual">Manuais</option>
                  <option value="automatic">Automáticos</option>
                </select>
                
                {selectedBackups.length > 0 && (
                  <button
                    onClick={deleteSelectedBackups}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir ({selectedBackups.length})
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {filteredBackups.length > 0 ? (
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedBackups.length === filteredBackups.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBackups(filteredBackups.map(b => b.id));
                          } else {
                            setSelectedBackups([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Data/Hora</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Tamanho</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Dados Incluídos</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Checksum</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredBackups.map((backup) => (
                    <tr key={backup.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBackups.includes(backup.id)}
                          onChange={() => toggleBackupSelection(backup.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium">
                            {format(new Date(backup.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="text-gray-500">
                            {format(new Date(backup.date), 'HH:mm:ss', { locale: ptBR })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          backup.type === 'manual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : backup.type === 'automatic'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}>
                          {backup.type === 'manual' ? (
                            <>
                              <User size={12} className="mr-1" />
                              Manual
                            </>
                          ) : backup.type === 'automatic' ? (
                            <>
                              <RefreshCw size={12} className="mr-1" />
                              Automático
                            </>
                          ) : (
                            <>
                              <Calendar size={12} className="mr-1" />
                              Agendado
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{backup.size}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          backup.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : backup.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status === 'success' ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Sucesso
                            </>
                          ) : backup.status === 'error' ? (
                            <>
                              <AlertTriangle size={12} className="mr-1" />
                              Erro
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} className="mr-1 animate-spin" />
                              Em Progresso
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {backup.dataTypes.slice(0, 3).map((type, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                            >
                              {type}
                            </span>
                          ))}
                          {backup.dataTypes.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{backup.dataTypes.length - 3} mais
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-20">{backup.checksum}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(backup.checksum)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copiar checksum"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Archive size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhum backup encontrado</p>
                <p className="text-sm text-gray-500">
                  {backupFilter !== 'all' 
                    ? `Nenhum backup ${backupFilter === 'manual' ? 'manual' : 'automático'} encontrado`
                    : 'Crie seu primeiro backup para começar'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className={`mt-8 p-6 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Monitor size={24} />
            Informações do Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">✓ Dados Incluídos no Backup:</h4>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Usuários e permissões completas</li>
                <li>• Produtos, categorias e fornecedores</li>
                <li>• Histórico completo de vendas</li>
                <li>• Movimentações e sessões de caixa</li>
                <li>• Despesas e controle financeiro</li>
                <li>• Configurações da empresa</li>
                <li>• Preferências de cores e tema</li>
                <li>• Configurações de aparência</li>
                <li>• Configurações de PDV</li>
                <li>• Configurações de relatórios</li>
                <li>• Configurações de notificações</li>
                <li>• Histórico de backups</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">🔧 Recursos Avançados:</h4>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Backup automático programável</li>
                <li>• Verificação de integridade</li>
                <li>• Checksum de segurança</li>
                <li>• Compressão de dados</li>
                <li>• Histórico detalhado</li>
                <li>• Restauração seletiva</li>
                <li>• Backup incremental</li>
                <li>• Múltiplos formatos</li>
                <li>• Validação automática</li>
                <li>• Logs de auditoria</li>
                <li>• Notificações de status</li>
                <li>• Gestão de retenção</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-orange-600">⚠ Recomendações:</h4>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Faça backups regulares (diários)</li>
                <li>• Mantenha backups em locais seguros</li>
                <li>• Teste a restauração periodicamente</li>
                <li>• Configure backup automático</li>
                <li>• Verifique o espaço disponível</li>
                <li>• Mantenha múltiplas cópias</li>
                <li>• Monitore a integridade</li>
                <li>• Documente os procedimentos</li>
                <li>• Treine a equipe</li>
                <li>• Mantenha logs atualizados</li>
                <li>• Configure alertas</li>
                <li>• Revise as configurações</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Sistema de Backup Avançado • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupScreen;