import React, { useState, useEffect } from 'react';
import { Bell, Settings, CheckCircle, XCircle, AlertTriangle, Clock, Calendar, Package, DollarSign, ShoppingCart, Users, Truck, Tag, FileText, Eye, Trash2, RefreshCw, Download, Mail, Smartphone, Zap, Megaphone, BellRing, BellOff, Filter, Search } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  category: 'system' | 'sales' | 'stock' | 'financial' | 'users';
  link?: string;
  icon?: string;
}

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'system' | 'sales' | 'stock' | 'financial' | 'users'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    stockAlerts: true,
    salesAlerts: true,
    financialAlerts: true,
    systemAlerts: true,
    emailAddress: user?.email || '',
    emailFrequency: 'daily',
    pushFrequency: 'realtime'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = () => {
    setIsLoading(true);
    
    try {
      // Carregar notificações do localStorage
      const savedNotifications = localStorage.getItem('pdv_notifications');
      
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        // Criar notificações de exemplo
        const exampleNotifications: Notification[] = [
          {
            id: '1',
            title: 'Bem-vindo ao Sistema',
            message: 'Bem-vindo ao PDV Banca de Jornal! Explore todas as funcionalidades disponíveis.',
            type: 'info',
            read: false,
            date: new Date().toISOString(),
            category: 'system'
          },
          {
            id: '2',
            title: 'Alerta de Estoque',
            message: 'O produto "Revista Veja" está com estoque abaixo do mínimo (3 unidades).',
            type: 'warning',
            read: false,
            date: new Date(Date.now() - 3600000).toISOString(),
            category: 'stock',
            link: '/produtos'
          },
          {
            id: '3',
            title: 'Venda Realizada',
            message: 'Venda #12345 foi finalizada com sucesso no valor de R$ 125,90.',
            type: 'success',
            read: true,
            date: new Date(Date.now() - 86400000).toISOString(),
            category: 'sales',
            link: '/vendas'
          },
          {
            id: '4',
            title: 'Despesa Vencendo',
            message: 'A despesa "Aluguel" vence amanhã no valor de R$ 1.500,00.',
            type: 'warning',
            read: false,
            date: new Date(Date.now() - 172800000).toISOString(),
            category: 'financial',
            link: '/financeiro'
          },
          {
            id: '5',
            title: 'Novo Usuário',
            message: 'O usuário "Maria Silva" foi cadastrado no sistema.',
            type: 'info',
            read: true,
            date: new Date(Date.now() - 259200000).toISOString(),
            category: 'users',
            link: '/usuarios'
          }
        ];
        
        setNotifications(exampleNotifications);
        localStorage.setItem('pdv_notifications', JSON.stringify(exampleNotifications));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    alert('Configurações de notificação salvas com sucesso!');
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    localStorage.setItem('pdv_notifications', JSON.stringify(updatedNotifications));
    
    if (selectedNotification?.id === id) {
      setSelectedNotification({ ...selectedNotification, read: true });
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('pdv_notifications', JSON.stringify(updatedNotifications));
    
    if (selectedNotification) {
      setSelectedNotification({ ...selectedNotification, read: true });
    }
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('pdv_notifications', JSON.stringify(updatedNotifications));
    
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  const clearAllNotifications = () => {
    if (confirm('Tem certeza que deseja excluir todas as notificações?')) {
      setNotifications([]);
      localStorage.setItem('pdv_notifications', JSON.stringify([]));
      setSelectedNotification(null);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.category) {
      case 'system':
        return <Settings size={20} className="text-blue-600" />;
      case 'sales':
        return <ShoppingCart size={20} className="text-green-600" />;
      case 'stock':
        return <Package size={20} className="text-orange-600" />;
      case 'financial':
        return <DollarSign size={20} className="text-purple-600" />;
      case 'users':
        return <Users size={20} className="text-indigo-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-orange-600" />;
      case 'error':
        return <XCircle size={16} className="text-red-600" />;
      case 'info':
      default:
        return <Bell size={16} className="text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'read' && notification.read) ||
        (filterType === 'unread' && !notification.read);
      
      const matchesCategory = 
        filterCategory === 'all' || 
        notification.category === filterCategory;
      
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesCategory && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

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
                <Bell size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Notificações</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gerencie suas notificações e alertas
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } shadow-lg disabled:opacity-50`}
              >
                <CheckCircle size={20} />
                Marcar Todas como Lidas
              </button>
              
              <button
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
                className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } shadow-lg disabled:opacity-50`}
              >
                <Trash2 size={20} />
                Limpar Todas
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da Esquerda - Lista de Notificações */}
          <div className="lg:col-span-2">
            {/* Filtros */}
            <div className={`p-6 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                {/* Busca */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar notificações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                      }`}
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={20} className="text-gray-500" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="all">Todas</option>
                      <option value="unread">Não lidas</option>
                      <option value="read">Lidas</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Tag size={20} className="text-gray-500" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="all">Todas as categorias</option>
                      <option value="system">Sistema</option>
                      <option value="sales">Vendas</option>
                      <option value="stock">Estoque</option>
                      <option value="financial">Financeiro</option>
                      <option value="users">Usuários</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Bell size={24} className="text-primary" />
                    Notificações
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  
                  <button
                    onClick={loadNotifications}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    title="Atualizar"
                  >
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-6 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedNotification?.id === notification.id 
                            ? theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
                            : ''
                        } ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                        onClick={() => {
                          setSelectedNotification(notification);
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.type === 'success' ? 'bg-green-100' :
                            notification.type === 'warning' ? 'bg-orange-100' :
                            notification.type === 'error' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {getNotificationIcon(notification)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-lg">{notification.title}</h4>
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                )}
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatDate(notification.date)}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {getNotificationTypeIcon(notification.type)}
                                <span className={`text-xs ${
                                  notification.type === 'success' ? 'text-green-600' :
                                  notification.type === 'warning' ? 'text-orange-600' :
                                  notification.type === 'error' ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  {notification.type === 'success' ? 'Sucesso' :
                                   notification.type === 'warning' ? 'Alerta' :
                                   notification.type === 'error' ? 'Erro' :
                                   'Informação'}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Marcar como lida"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Nenhuma notificação encontrada</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : 'Você não tem notificações no momento'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Detalhes e Configurações */}
          <div className="space-y-8">
            {/* Detalhes da Notificação */}
            {selectedNotification ? (
              <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedNotification.type === 'success' ? 'bg-green-100' :
                        selectedNotification.type === 'warning' ? 'bg-orange-100' :
                        selectedNotification.type === 'error' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {getNotificationTypeIcon(selectedNotification.type)}
                      </div>
                      Detalhes
                    </h3>
                    
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className={`p-6 rounded-xl mb-6 ${
                    selectedNotification.type === 'success' ? 'bg-green-50 border border-green-200' :
                    selectedNotification.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                    selectedNotification.type === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <h4 className={`text-xl font-bold mb-2 ${
                      selectedNotification.type === 'success' ? 'text-green-800' :
                      selectedNotification.type === 'warning' ? 'text-orange-800' :
                      selectedNotification.type === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {selectedNotification.title}
                    </h4>
                    
                    <p className={`${
                      selectedNotification.type === 'success' ? 'text-green-700' :
                      selectedNotification.type === 'warning' ? 'text-orange-700' :
                      selectedNotification.type === 'error' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {selectedNotification.message}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Categoria:</span>
                      <span className="text-sm">
                        {selectedNotification.category === 'system' ? 'Sistema' :
                         selectedNotification.category === 'sales' ? 'Vendas' :
                         selectedNotification.category === 'stock' ? 'Estoque' :
                         selectedNotification.category === 'financial' ? 'Financeiro' :
                         'Usuários'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Data:</span>
                      <span className="text-sm">{formatDate(selectedNotification.date)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm flex items-center gap-1">
                        {selectedNotification.read ? (
                          <>
                            <CheckCircle size={14} className="text-green-600" />
                            Lida
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="text-blue-600" />
                            Não lida
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    {selectedNotification.link && (
                      <button
                        className="flex-1 bg-primary text-white py-3 px-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <Eye size={18} />
                        Ver Detalhes
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(selectedNotification.id)}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Trash2 size={18} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Bell size={24} className="text-primary" />
                    Resumo
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                          <p className="text-2xl font-bold text-primary">{notifications.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                          <Bell size={20} className="text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Não Lidas</p>
                          <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                          <BellRing size={20} className="text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={20} />
                      <p className="font-bold">Informações</p>
                    </div>
                    <p className="text-sm">
                      Selecione uma notificação para ver os detalhes completos. Você pode marcar notificações como lidas ou excluí-las.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações de Notificação */}
            <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={24} className="text-secondary" />
                  Configurações
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Canais de Notificação */}
                <div>
                  <h4 className="font-bold mb-4">Canais de Notificação</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                          <Mail size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Notificações por Email</p>
                          <p className="text-xs text-gray-500">Receba alertas no seu email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailEnabled}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                          <Smartphone size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Notificações Push</p>
                          <p className="text-xs text-gray-500">Receba alertas no navegador</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushEnabled}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Tipos de Alerta */}
                <div>
                  <h4 className="font-bold mb-4">Tipos de Alerta</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100">
                          <Package size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Alertas de Estoque</p>
                          <p className="text-xs text-gray-500">Estoque baixo ou esgotado</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.stockAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, stockAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                          <ShoppingCart size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Alertas de Vendas</p>
                          <p className="text-xs text-gray-500">Novas vendas e devoluções</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.salesAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, salesAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                          <DollarSign size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Alertas Financeiros</p>
                          <p className="text-xs text-gray-500">Despesas e vencimentos</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.financialAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, financialAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                          <Settings size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Alertas do Sistema</p>
                          <p className="text-xs text-gray-500">Atualizações e manutenção</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Configurações Avançadas */}
                {notificationSettings.emailEnabled && (
                  <div>
                    <h4 className="font-bold mb-4">Configurações de Email</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Endereço de Email</label>
                        <input
                          type="email"
                          value={notificationSettings.emailAddress}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailAddress: e.target.value }))}
                          className={`w-full px-4 py-3 border rounded-xl ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                          placeholder="seu@email.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequência</label>
                        <select
                          value={notificationSettings.emailFrequency}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailFrequency: e.target.value }))}
                          className={`w-full px-4 py-3 border rounded-xl ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        >
                          <option value="realtime">Tempo real</option>
                          <option value="daily">Resumo diário</option>
                          <option value="weekly">Resumo semanal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={saveSettings}
                  className="w-full bg-primary text-white py-3 px-6 rounded-xl hover:opacity-90 font-medium"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Sistema de Notificações • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente Info para o ícone de informação
const Info: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default NotificationsScreen;