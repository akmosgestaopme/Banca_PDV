import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Lock, Eye, EyeOff, LogIn, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { db } from '../../services/database';

const LoginScreen: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { login } = useAuth();
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();

  // Atualizar hora atual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(usuario, senha);
      if (!success) {
        setError('Usuário ou senha inválidos');
      } else {
        setSuccess(true);
        // Mostrar mensagem de sucesso por 1 segundo antes de redirecionar
        setTimeout(() => {
          // O redirecionamento é automático pelo hook de autenticação
        }, 1000);
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const companyLogo = localStorage.getItem('company_logo');
  const companyData = localStorage.getItem('company_data') ? JSON.parse(localStorage.getItem('company_data')!) : null;
  const companyName = companyData?.nomeFantasia || 'PDV Banca de Jornal';

  // Função para resetar usuários padrão
  const resetUsers = () => {
    if (confirm('Deseja resetar os usuários padrão do sistema?')) {
      // Limpar dados de usuários
      localStorage.removeItem('pdv_users');
      
      // Recriar usuários padrão
      const defaultUsers = [
        {
          id: 'admin-001',
          nome: 'Administrador do Sistema',
          usuario: 'admin',
          senha: '123456',
          tipo: 'administrador',
          ativo: true,
          criadoEm: new Date().toISOString()
        },
        {
          id: 'gerente-001',
          nome: 'Gerente da Loja',
          usuario: 'gerente',
          senha: '123456',
          tipo: 'gerente',
          ativo: true,
          criadoEm: new Date().toISOString()
        },
        {
          id: 'vendedor-001',
          nome: 'Vendedor da Loja',
          usuario: 'vendedor',
          senha: '123456',
          tipo: 'vendedor',
          ativo: true,
          criadoEm: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('pdv_users', JSON.stringify(defaultUsers));
      alert('Usuários padrão resetados com sucesso!');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background com gradiente e efeito de ondas */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 opacity-90"></div>
      
      {/* Padrão de ondas decorativo */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50 V100 H0 Z" fill="white" />
          <path d="M0,60 Q25,40 50,60 T100,60 V100 H0 Z" fill="white" />
          <path d="M0,70 Q25,50 50,70 T100,70 V100 H0 Z" fill="white" />
        </svg>
      </div>
      
      {/* Círculos decorativos */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-blue-300 opacity-10 blur-3xl"></div>
      
      {/* Container principal */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden">
        {/* Painel esquerdo - Informações */}
        <div className="hidden md:block w-2/5 p-12 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white">
          <div className="h-full flex flex-col">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
                  <ShoppingCart className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">PDV BANCA</h1>
                  <p className="text-sm text-blue-200">SISTEMAS ERP</p>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h2>
              <p className="text-blue-200 mb-6">
                Acesse o sistema para gerenciar vendas, estoque, finanças e muito mais.
              </p>
            </div>
            
            <div className="mt-auto space-y-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-300" />
                  <h3 className="font-semibold">Sistema Completo</h3>
                </div>
                <p className="text-sm text-blue-200">
                  PDV, controle de estoque, financeiro, relatórios e muito mais em um único lugar.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-300" />
                  <h3 className="font-semibold">Suporte 24/7</h3>
                </div>
                <p className="text-sm text-blue-200">
                  Conte com nossa equipe de suporte a qualquer momento.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-blue-200">
                Powered by <span className="font-bold" style={{ color: secondaryColor }}>CYBERPIU</span>
              </p>
              <p className="text-xs text-blue-300 mt-1">
                {currentTime.toLocaleDateString('pt-BR')} • {currentTime.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Painel direito - Formulário de login */}
        <div className={`w-full md:w-3/5 p-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="max-w-md mx-auto">
            <div className="text-center mb-10">
              <div className="bg-blue-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <ShoppingCart className="text-blue-600" size={48} />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>{companyName}</h1>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Acesse sua conta para continuar
              </p>
            </div>

            {success ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-bold">Login realizado com sucesso!</p>
                  <p className="text-sm">Redirecionando para o sistema...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Usuário
                  </label>
                  <div className="relative">
                    <User className={`absolute left-4 top-3.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                      placeholder="Digite seu usuário"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-4 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-3.5 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Entrar no Sistema
                    </>
                  )}
                </button>
                
                <div className="text-center">
                  <a 
                    href="#" 
                    className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Funcionalidade em desenvolvimento');
                    }}
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
              </form>
            )}

            {/* Versão mobile do footer - mantido como estava */}
            <div className="mt-8 text-center md:hidden">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Powered by <span className="font-bold" style={{ color: secondaryColor }}>CYBERPIU</span>
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                {currentTime.toLocaleDateString('pt-BR')} • {currentTime.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;