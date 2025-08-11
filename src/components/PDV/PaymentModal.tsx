import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Gift, CheckCircle, Calculator, ArrowRight, DollarSign, Clock, Calendar, Printer, Download, RefreshCw, Plus } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentComplete: (payments: PaymentMethod[], troco: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onPaymentComplete }) => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [currentPayment, setCurrentPayment] = useState<PaymentMethod>({
    tipo: 'dinheiro',
    valor: total
  });
  const [valorRecebido, setValorRecebido] = useState(total);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentTypes = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
    { id: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard, color: '#3b82f6' },
    { id: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard, color: '#8b5cf6' },
    { id: 'pix', label: 'PIX', icon: Smartphone, color: '#06b6d4' },
    { id: 'vale', label: 'Vale', icon: Gift, color: '#f59e0b' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const getTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.valor, 0) + currentPayment.valor;
  };

  const getRemaining = () => {
    return total - payments.reduce((sum, payment) => sum + payment.valor, 0);
  };

  const getTroco = () => {
    if (currentPayment.tipo !== 'dinheiro') return 0;
    const totalPaid = getTotalPaid();
    return totalPaid > total ? totalPaid - total : 0;
  };

  const addPayment = () => {
    if (currentPayment.valor <= 0) return;
    
    setPayments([...payments, currentPayment]);
    const remaining = getRemaining() - currentPayment.valor;
    
    if (remaining > 0) {
      setCurrentPayment({
        tipo: 'dinheiro',
        valor: remaining
      });
      setValorRecebido(remaining);
    } else {
      setCurrentPayment({
        tipo: 'dinheiro',
        valor: 0
      });
      setValorRecebido(0);
    }
  };

  const removePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
    
    const remaining = getRemaining();
    setCurrentPayment({
      tipo: 'dinheiro',
      valor: remaining
    });
    setValorRecebido(remaining);
  };

  const handleComplete = () => {
    const allPayments = currentPayment.valor > 0 ? [...payments, currentPayment] : payments;
    const totalPaid = allPayments.reduce((sum, p) => sum + p.valor, 0);
    
    if (totalPaid < total) {
      alert('Valor insuficiente para completar o pagamento!');
      return;
    }

    setIsProcessing(true);
    
    // Simular processamento de pagamento
    setTimeout(() => {
      onPaymentComplete(allPayments, getTroco());
      setIsProcessing(false);
    }, 1500);
  };

  const canComplete = () => {
    const totalPaid = getTotalPaid();
    return totalPaid >= total;
  };

  useEffect(() => {
    if (currentPayment.tipo === 'dinheiro') {
      setCurrentPayment(prev => ({ ...prev, valor: valorRecebido }));
    }
  }, [valorRecebido, currentPayment.tipo]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentPayment(prev => ({ ...prev, tipo: 'dinheiro' }));
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentPayment(prev => ({ ...prev, tipo: 'cartao_debito' }));
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentPayment(prev => ({ ...prev, tipo: 'cartao_credito' }));
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCurrentPayment(prev => ({ ...prev, tipo: 'pix' }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (canComplete()) {
          handleComplete();
        } else if (currentPayment.valor > 0) {
          addPayment();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [canComplete, currentPayment.valor]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
              <DollarSign size={24} className="text-white" />
            </div>
            Finalizar Venda
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Formas de Pagamento */}
          <div>
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Calculator size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total a Pagar</p>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Data/Hora</p>
                  <p className="font-medium">
                    {format(currentTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} />
                <span>Aguardando pagamento...</span>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Forma de Pagamento
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCurrentPayment(prev => ({ ...prev, tipo: type.id as any }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      currentPayment.tipo === type.id
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark' 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color }}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-left">{type.label}</p>
                      <p className="text-xs text-gray-500">F{paymentTypes.indexOf(type) + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">
                {currentPayment.tipo === 'dinheiro' ? 'Valor Recebido' : 'Valor do Pagamento'}
              </label>
              <input
                type="number"
                step="0.01"
                value={currentPayment.tipo === 'dinheiro' ? valorRecebido : currentPayment.valor}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (currentPayment.tipo === 'dinheiro') {
                    setValorRecebido(value);
                  } else {
                    setCurrentPayment(prev => ({ ...prev, valor: value }));
                  }
                }}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all text-2xl font-bold text-center ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                }`}
                style={{ borderColor: secondaryColor }}
                autoFocus
              />
            </div>

            {currentPayment.tipo === 'cartao_credito' && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Parcelas</label>
                <select
                  value={currentPayment.parcelas || 1}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    parcelas: parseInt(e.target.value) 
                  }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6, 10, 12].map(num => (
                    <option key={num} value={num}>
                      {num}x de {formatCurrency(currentPayment.valor / num)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={addPayment}
              disabled={currentPayment.valor <= 0}
              className={`w-full py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 ${
                currentPayment.valor <= 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'text-white'
              }`}
              style={{ backgroundColor: currentPayment.valor <= 0 ? undefined : primaryColor }}
            >
              <Plus size={20} />
              Adicionar Pagamento
            </button>
          </div>

          {/* Coluna Direita - Resumo e Finalização */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Resumo do Pagamento
            </h3>

            {/* Pagamentos Adicionados */}
            {payments.length > 0 && (
              <div className={`p-6 rounded-xl mb-6 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <h4 className="font-bold mb-4">Pagamentos Adicionados</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {payments.map((payment, index) => {
                    const paymentType = paymentTypes.find(t => t.id === payment.tipo);
                    const Icon = paymentType?.icon || CreditCard;
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: paymentType?.color || '#6b7280' }}>
                            <Icon size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{paymentType?.label || payment.tipo}</p>
                            {payment.parcelas && payment.parcelas > 1 && (
                              <p className="text-xs text-gray-500">
                                {payment.parcelas}x de {formatCurrency(payment.valor / payment.parcelas)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold">{formatCurrency(payment.valor)}</p>
                          <button
                            onClick={() => removePayment(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cálculos */}
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total da Venda:</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Pago:</span>
                  <span className="font-bold text-green-600">{formatCurrency(payments.reduce((sum, p) => sum + p.valor, 0))}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Restante:</span>
                  <span className="font-bold" style={{ color: getRemaining() > 0 ? '#ef4444' : '#22c55e' }}>
                    {formatCurrency(getRemaining())}
                  </span>
                </div>
                
                {getTroco() > 0 && (
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-bold text-green-600">Troco:</span>
                    <span className="font-bold text-green-600">{formatCurrency(getTroco())}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Troco */}
            {getTroco() > 0 && (
              <div className={`p-6 rounded-xl mb-6 bg-green-100 border border-green-200`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500 text-white">
                    <ArrowRight size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-green-800">Troco a Devolver</p>
                    <p className="text-3xl font-bold text-green-700">{formatCurrency(getTroco())}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className={`flex-1 border-2 py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancelar (ESC)
              </button>
              <button
                onClick={handleComplete}
                disabled={!canComplete() || isProcessing}
                className={`flex-1 py-4 px-6 rounded-xl text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 ${
                  !canComplete() || isProcessing ? 'bg-gray-400 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: canComplete() && !isProcessing ? secondaryColor : undefined }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Finalizar Venda (ENTER)
                  </>
                )}
              </button>
            </div>

            {/* Atalhos */}
            <div className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
              <h4 className="font-bold mb-3 text-sm flex items-center gap-2">
                <Zap size={16} />
                Atalhos de Teclado
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">F1</span>
                  <span>Dinheiro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">F2</span>
                  <span>Cartão Débito</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">F3</span>
                  <span>Cartão Crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">F4</span>
                  <span>PIX</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">ENTER</span>
                  <span>Adicionar/Finalizar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded font-mono">ESC</span>
                  <span>Cancelar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;