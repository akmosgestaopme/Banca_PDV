import React, { useEffect, useState } from 'react';
import { ShoppingCart, Clock, Calendar, Zap, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen p-8 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 mx-auto rounded-full shadow-2xl flex items-center justify-center mb-8 bg-gradient-to-br from-primary to-secondary">
            <ShoppingCart size={60} className="text-white" />
          </div>

          <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h1 className="text-6xl font-black mb-4 tracking-tight">
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
            </p>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
            theme === 'dark' 
              ? 'bg-slate-800/80 border-blue-700/50' 
              : 'bg-white/80 border-blue-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary">
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

          <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
            theme === 'dark' 
              ? 'bg-slate-800/80 border-blue-700/50' 
              : 'bg-white/80 border-blue-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary">
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

          <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
            theme === 'dark' 
              ? 'bg-slate-800/80 border-blue-700/50' 
              : 'bg-white/80 border-blue-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-600">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ONLINE
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                  Sistema Ativo
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-xl backdrop-blur-sm border ${
            theme === 'dark' 
              ? 'bg-slate-800/80 border-blue-700/50' 
              : 'bg-white/80 border-blue-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-600">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
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
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-primary">
              <ShoppingCart className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">
              PDV Inteligente
            </h3>
            <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
              Sistema de vendas completo com controle de estoque e múltiplas formas de pagamento.
            </p>
          </div>

          <div className={`p-8 rounded-2xl shadow-xl text-center ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-secondary">
              <DollarSign className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-secondary">
              Controle Financeiro
            </h3>
            <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
              Gestão completa de caixa, movimentações financeiras e relatórios detalhados.
            </p>
          </div>

          <div className={`p-8 rounded-2xl shadow-xl text-center ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-blue-600">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-blue-600">
              Multi-usuário
            </h3>
            <p className={`${theme === 'dark' ? 'text-blue-200' : 'text-slate-600'}`}>
              Sistema com controle de permissões e auditoria completa de operações.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center ${
          theme === 'dark' ? 'text-blue-300' : 'text-slate-600'
        }`}>
          <div className="text-4xl font-black mb-4">
            <span className="text-primary">Powered by</span>
            <span className="mx-3 text-secondary">•</span>
            <span className="text-secondary">CYBERPIU</span>
          </div>
          <p className="text-lg">Tecnologia e Inovação para o seu Negócio</p>
          <div className="text-sm mt-4">
            <p>Sistema PDV Banca de Jornal v1.0.0</p>
            <p>© 2024 CYBERPIU. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;