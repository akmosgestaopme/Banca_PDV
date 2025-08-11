import React, { useEffect, useState } from 'react';
import { ShoppingCart, Clock, Calendar, Zap, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [currentTime, setCurrentTime] = useState(new Date());
  const companyLogo = localStorage.getItem('company_logo');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100'
    }`}>
      {/* Header com Gradiente */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 gradient-primary"
        ></div>
        
        <div className="relative z-10 pt-16 pb-20">
          <div className="max-w-6xl mx-auto px-6">
            {/* Logo e Título Principal */}
            <div className="text-center mb-16">
              <div className="relative inline-block mb-8">
                <div 
                  className="w-48 h-48 mx-auto rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden gradient-primary"
                  style={{ 
                    boxShadow: `0 25px 50px -12px ${primaryColor}40`
                  }}
                >
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt="Logo da Empresa" 
                      className="w-44 h-44 rounded-full object-cover border-4 border-white/20"
                    />
                  ) : (
                    <ShoppingCart size={80} className="text-white" />
                  )}
                  
                  {/* Efeito de Brilho */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
                </div>
                
                {/* Indicador Online */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg btn-secondary">
                  <Zap size={24} className="text-white" />
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <h1 className="text-7xl font-black mb-4 tracking-tight">
                  <span className="text-primary">PDV</span>
                  <span className="mx-2 text-secondary">•</span>
                  <span className="text-secondary">BANCA</span>
                </h1>
                
                <div className="text-2xl font-bold mb-6 text-primary">
                  SISTEMA INTELIGENTE DE VENDAS
                </div>
                
                <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${
                  theme === 'dark' ? 'text-blue-200' : 'text-slate-600'
                }`}>
                  Solução completa para gestão de vendas, estoque e controle financeiro. 
                  Tecnologia avançada para impulsionar seu negócio.
                </p>
              </div>
            </div>

            {/* Cards de Status em Tempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {/* Data e Hora */}
              <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-blue-700/50' 
                  : 'bg-white/80 border-blue-200/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary"
                  >
                    <Calendar className="text-white" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {currentTime.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      {currentTime.toLocaleDateString('pt-BR', { 
                        weekday: 'long' 
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hora */}
              <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-blue-700/50' 
                  : 'bg-white/80 border-blue-200/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary"
                  >
                    <Clock className="text-white" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {currentTime.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      Hora Atual
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Sistema */}
              <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-blue-700/50' 
                  : 'bg-white/80 border-blue-200/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#1e40af' }}
                  >
                    <TrendingUp className="text-white" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#1e40af' }}>
                      ONLINE
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      Sistema Ativo
                    </div>
                  </div>
                </div>
              </div>

              {/* Versão */}
              <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-blue-700/50' 
                  : 'bg-white/80 border-blue-200/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    <Package className="text-white" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                      v1.0
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      Versão Atual
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recursos Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className={`p-8 rounded-2xl shadow-xl text-center ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-primary"
                >
                  <ShoppingCart className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary">
                  PDV Inteligente
                </h3>
                <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
                  Sistema de vendas completo com controle de estoque, múltiplas formas de pagamento e impressão de cupons.
                </p>
              </div>

              <div className={`p-8 rounded-2xl shadow-xl text-center ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-secondary"
                >
                  <DollarSign className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-secondary">
                  Controle Financeiro
                </h3>
                <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
                  Gestão completa de caixa, movimentações financeiras e relatórios detalhados para tomada de decisões.
                </p>
              </div>

              <div className={`p-8 rounded-2xl shadow-xl text-center ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: '#1e40af' }}
                >
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#1e40af' }}>
                  Multi-usuário
                </h3>
                <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
                  Sistema com controle de permissões, múltiplos usuários e auditoria completa de todas as operações.
                </p>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className={`p-8 rounded-2xl shadow-xl ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-white'
            }`}>
              <h3 className="text-2xl font-bold text-center mb-8 text-primary">
                Estatísticas do Sistema
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-black mb-2 text-primary">
                    100%
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                    Uptime Sistema
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-black mb-2 text-secondary">
                    24/7
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                    Disponibilidade
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-black mb-2" style={{ color: '#1e40af' }}>
                    ∞
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                    Transações
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-black mb-2" style={{ color: '#3b82f6' }}>
                    ⚡
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                    Performance
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com Créditos CYBERPIU */}
      <div className={`py-12 ${
        theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50/50'
      }`}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-6">
            <div className="text-4xl font-black mb-4">
              <span className="text-primary">Powered by</span>
              <span className="mx-3 text-secondary">•</span>
              <span className="text-secondary">CYBERPIU</span>
            </div>
            <p className={`text-lg ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
              Tecnologia e Inovação para o seu Negócio
            </p>
          </div>
          
          <div className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>
            <p>Sistema PDV Banca de Jornal v1.0.0</p>
            <p>© 2024 CYBERPIU. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;