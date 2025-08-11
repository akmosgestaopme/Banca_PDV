import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ColorProvider } from './hooks/useColors';
import { db } from './services/database';
import LoginScreen from './components/Login/LoginScreen';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import HomeScreen from './components/Home/HomeScreen';
import PDVScreen from './components/PDV/PDVScreen';
import ProductsScreen from './components/Products/ProductsScreen';
import DashboardScreen from './components/Dashboard/DashboardScreen';
import CashScreen from './components/Cash/CashScreen';
import CategoriesScreen from './components/Categories/CategoriesScreen';
import AppearanceScreen from './components/Settings/AppearanceScreen';
import SuppliersScreen from './components/Suppliers/SuppliersScreen';
import FinancialScreen from './components/Financial/FinancialScreen';
import ReportsScreen from './components/Reports/ReportsScreen';
import CompanyDataScreen from './components/Settings/CompanyDataScreen';
import UsersScreen from './components/Settings/UsersScreen';
import RolesPermissionsScreen from './components/Settings/RolesPermissionsScreen';
import NotificationsScreen from './components/Settings/NotificationsScreen';
import BackupScreen from './components/Settings/BackupScreen';
import TutorialScreen from './components/Settings/TutorialScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app data...');
        
        // Inicializar dados do sistema
        await db.initializeData();
        
        // Configurar favicon personalizado se existir
        const savedFavicon = localStorage.getItem('company_favicon');
        if (savedFavicon) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = savedFavicon;
          }
        }
        
        console.log('App initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError(error instanceof Error ? error.message : 'Erro desconhecido');
        setIsInitialized(true); // Permitir que o app continue mesmo com erro
      }
    };
    
    initializeApp();
  }, []);

  // Mostrar loading enquanto inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Inicializando Sistema...</p>
          <p className="text-sm opacity-75 mt-2">Powered by CYBERPIU</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-600">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Erro de Inicialização</h1>
          <p className="mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-red-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomeScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'caixa':
        return <CashScreen />;
      case 'produtos':
        return <ProductsScreen />;
      case 'categorias':
        return <CategoriesScreen />;
      case 'aparencia':
        return <AppearanceScreen />;
      case 'fornecedores':
        return <SuppliersScreen />;
      case 'financeiro':
        return <FinancialScreen />;
      case 'relatorios':
        return <ReportsScreen />;
      case 'dados-empresa':
        return <CompanyDataScreen />;
      case 'usuarios':
        return <UsersScreen />;
      case 'cargos-permissoes':
        return <RolesPermissionsScreen />;
      case 'notificacoes':
        return <NotificationsScreen />;
      case 'backup':
        return <BackupScreen />;
      case 'tutorial':
        return <TutorialScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Se a página atual for PDV, renderizar em tela cheia sem sidebar
  if (currentPage === 'pdv') {
    return <PDVScreen onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ColorProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ColorProvider>
  );
}

export default App;