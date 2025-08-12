import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Gift, CheckCircle, Calculator, DollarSign, RefreshCw } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentComplete: (payments: PaymentMethod[], troco: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onPaymentComplete }) => {
  const { theme } = useTheme();
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [currentPayment, setCurrentPayment] = useState<PaymentMethod>({
    tipo: 'dinheiro',
    valor: total
  });
  const [valorRecebido, setValorRecebido] = useState(total);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentTypes = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: '#22c55e' },
    { id: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard, color: '#3b82f6' },
    { id: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard, color: '#8b5cf6' },
    { id: 'pix', label: 'PIX', icon: Smartphone, color: '#06b6d4' },
    { id: 'vale', label: 'Vale', icon: Gift, color: '#f59e0b' }
  ];

  const getTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.valor, 0) + currentPayment.valor;
  };

  const getTroco = () => {
    if (currentPayment.tipo !== 'dinheiro') return 0;
    const totalPaid = getTotalPaid();
    return totalPaid > total ? totalPaid - total : 0;
  };

  const handleComplete = () => {
    const allPayments = currentPayment.valor > 0 ? [...payments, currentPayment] : payments;
    const totalPaid = allPayments.reduce((sum, p) => sum + p.valor, 0);
    
    if (totalPaid < total) {
      alert('Valor insuficiente para completar o pagamento!');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      onPaymentComplete(allPayments, getTroco());
      setIsProcessing(false);
    }, 1000);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary">
              <DollarSign size={24} className="text-white" />
            </div>
            Finalizar Venda
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-110 ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formas de Pagamento */}
          <div>
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
                    <Calculator size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total a Pagar</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
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
                    <span className="font-medium">{type.label}</span>
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
                autoFocus
              />
            </div>
          </div>

          {/* Resumo */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Resumo do Pagamento
            </h3>

            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total da Venda:</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                
                {getTroco() > 0 && (
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-bold text-green-600">Troco:</span>
                    <span className="font-bold text-green-600">{formatCurrency(getTroco())}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className={`flex-1 border-2 py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={!canComplete() || isProcessing}
                className={`flex-1 py-4 px-6 rounded-xl text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 ${
                  !canComplete() || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Finalizar Venda
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;