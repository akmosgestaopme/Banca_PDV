import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Calendar, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { CashRegister, CashSession } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashSessionModalProps {
  cashRegisters: CashRegister[];
  session?: CashSession | null;
  isClosing?: boolean;
  onSave: (session: any) => void;
  onClose: () => void;
}

const CashSessionModal: React.FC<CashSessionModalProps> = ({ 
  cashRegisters, 
  session, 
  isClosing = false, 
  onSave, 
  onClose 
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    caixaId: '',
    caixa: '',
    valorAbertura: 0,
    valorFechamento: 0,
    observacoesAbertura: '',
    observacoesFechamento: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (session) {
      setFormData({
        caixaId: session.caixaId,
        caixa: session.caixa,
        valorAbertura: session.valorAbertura,
        valorFechamento: session.valorFechamento || 0,
        observacoesAbertura: session.observacoesAbertura || '',
        observacoesFechamento: session.observacoesFechamento || ''
      });
    }
    
    // Atualizar hora atual
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isClosing) {
      const selectedRegister = cashRegisters.find(c => c.id === formData.caixaId);
      onSave({
        caixaId: formData.caixaId,
        caixa: selectedRegister?.nome || '',
        valorAbertura: formData.valorAbertura,
        observacoesAbertura: formData.observacoesAbertura
      });
    } else {
      onSave({
        valorFechamento: formData.valorFechamento,
        observacoesFechamento: formData.observacoesFechamento
      });
    }
  };

  // Calcular diferença entre valor de abertura e fechamento
  const calcularDiferenca = () => {
    if (!session) return 0;
    
    // Valor esperado = valor de abertura + entradas - saídas
    const valorEsperado = session.valorAbertura + session.totalEntradas - session.totalSaidas;
    return formData.valorFechamento - valorEsperado;
  };

  const diferenca = isClosing ? calcularDiferenca() : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-md shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {isClosing ? (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <span>Fechar Caixa</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <span>Abrir Caixa</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-110 ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data e Hora Atual */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                Data
              </label>
              <div className={`px-4 py-3 border-2 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                {format(currentTime, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                Hora
              </label>
              <div className={`px-4 py-3 border-2 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                {format(currentTime, 'HH:mm:ss', { locale: ptBR })}
              </div>
            </div>
          </div>

          {!isClosing && (
            <>
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-500" />
                  Selecionar Caixa *
                </label>
                <select
                  value={formData.caixaId}
                  onChange={(e) => {
                    const selectedRegister = cashRegisters.find(c => c.id === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      caixaId: e.target.value,
                      caixa: selectedRegister?.nome || ''
                    }));
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                  required
                >
                  <option value="">Selecione um caixa...</option>
                  {cashRegisters.map(register => (
                    <option key={register.id} value={register.id}>
                      {register.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-500" />
                  Valor de Abertura *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorAbertura}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorAbertura: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all text-xl font-bold text-center ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  } text-green-600`}
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Valor em dinheiro disponível no caixa para abertura
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  Observações de Abertura
                </label>
                <textarea
                  value={formData.observacoesAbertura}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoesAbertura: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                  rows={3}
                  placeholder="Observações sobre a abertura do caixa..."
                />
              </div>
            </>
          )}

          {isClosing && (
            <>
              <div className={`p-6 rounded-xl mb-6 ${
                theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <DollarSign size={18} />
                  Resumo da Sessão
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Caixa:</p>
                    <p className="font-medium">{session?.caixa}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Abertura:</p>
                    <p className="font-medium">{session ? format(new Date(session.dataAbertura), 'dd/MM HH:mm', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Valor Abertura:</p>
                    <p className="font-medium text-green-600">R$ {session?.valorAbertura.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Movimentações:</p>
                    <p className="font-medium">{session?.totalEntradas.toFixed(2)} / {session?.totalSaidas.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-500" />
                  Valor de Fechamento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorFechamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorFechamento: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all text-xl font-bold text-center ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  } text-blue-600`}
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Valor em dinheiro contado no fechamento do caixa
                </p>
              </div>

              {/* Diferença */}
              {formData.valorFechamento > 0 && (
                <div className={`p-4 rounded-xl ${
                  diferenca === 0 
                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                    : diferenca > 0 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                      : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {diferenca === 0 ? (
                      <>
                        <CheckCircle size={20} className="text-green-600" />
                        <p className="font-bold text-green-600">Valor Exato</p>
                      </>
                    ) : diferenca > 0 ? (
                      <>
                        <AlertTriangle size={20} className="text-blue-600" />
                        <p className="font-bold text-blue-600">Sobra de Caixa</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={20} className="text-red-600" />
                        <p className="font-bold text-red-600">Falta no Caixa</p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-sm ${
                      diferenca === 0 
                        ? 'text-green-600' 
                        : diferenca > 0 
                          ? 'text-blue-600'
                          : 'text-red-600'
                    }`}>
                      Diferença:
                    </p>
                    <p className={`font-bold ${
                      diferenca === 0 
                        ? 'text-green-600' 
                        : diferenca > 0 
                          ? 'text-blue-600'
                          : 'text-red-600'
                    }`}>
                      R$ {Math.abs(diferenca).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  Observações de Fechamento
                </label>
                <textarea
                  value={formData.observacoesFechamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoesFechamento: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                  rows={3}
                  placeholder="Observações sobre o fechamento do caixa..."
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 border-2 py-3 px-6 rounded-xl font-bold transition-all hover:scale-105 ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-6 rounded-xl text-white font-bold transition-all hover:scale-105 ${
                isClosing 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isClosing ? 'Fechar Caixa' : 'Abrir Caixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashSessionModal;