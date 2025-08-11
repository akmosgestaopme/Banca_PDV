import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Upload, Calendar, Clock, DollarSign, Tag, FileText, CreditCard, Banknote, Smartphone, Receipt, MessageSquare } from 'lucide-react';
import { CashRegister } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashMovementModalProps {
  type: 'entrada' | 'saida';
  cashRegisters: CashRegister[];
  currentCashId?: string;
  onSave: (movement: any) => void;
  onClose: () => void;
}

const CashMovementModal: React.FC<CashMovementModalProps> = ({ 
  type, 
  cashRegisters, 
  currentCashId,
  onSave, 
  onClose 
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    caixaId: currentCashId || '',
    tipo: type,
    categoria: type === 'entrada' ? 'receita' : 'despesa',
    subcategoria: '',
    descricao: '',
    valor: 0,
    formaPagamento: 'dinheiro' as const,
    comprovante: '',
    observacoes: '',
    data: new Date().toISOString()
  });

  // Atualizar data e hora para o momento atual
  useEffect(() => {
    const interval = setInterval(() => {
      setFormData(prev => ({ ...prev, data: new Date().toISOString() }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Atualizar quando o tipo mudar
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      tipo: type,
      categoria: type === 'entrada' ? 'receita' : 'despesa'
    }));
  }, [type]);

  // Atualizar quando o caixa atual mudar
  useEffect(() => {
    if (currentCashId) {
      setFormData(prev => ({ ...prev, caixaId: currentCashId }));
    }
  }, [currentCashId]);

  const entradaCategories = [
    { value: 'receita', label: 'Receita', icon: DollarSign },
    { value: 'suprimento', label: 'Suprimento', icon: TrendingUp },
    { value: 'abertura', label: 'Abertura de Caixa', icon: Clock }
  ];

  const saidaCategories = [
    { value: 'despesa', label: 'Despesa', icon: TrendingDown },
    { value: 'sangria', label: 'Sangria', icon: Banknote },
    { value: 'troco', label: 'Troco', icon: DollarSign },
    { value: 'fechamento', label: 'Fechamento de Caixa', icon: Clock }
  ];

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
    { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: Smartphone },
    { value: 'cheque', label: 'Cheque', icon: Receipt },
    { value: 'transferencia', label: 'Transferência', icon: CreditCard }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, comprovante: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = type === 'entrada' ? entradaCategories : saidaCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {type === 'entrada' ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <span>Nova Entrada</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
                <span>Nova Saída</span>
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
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                Data
              </label>
              <div className={`px-4 py-3 border-2 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                {format(new Date(formData.data), 'dd/MM/yyyy', { locale: ptBR })}
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
                {format(new Date(formData.data), 'HH:mm:ss', { locale: ptBR })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-gray-500" />
              Caixa *
            </label>
            <select
              value={formData.caixaId}
              onChange={(e) => setFormData(prev => ({ ...prev, caixaId: e.target.value }))}
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
              <Tag size={16} className="text-gray-500" />
              Categoria *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <label
                    key={cat.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.categoria === cat.value
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark' 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="categoria"
                      value={cat.value}
                      checked={formData.categoria === cat.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        formData.categoria === cat.value
                          ? 'bg-primary text-white'
                          : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-medium">{cat.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <Tag size={16} className="text-gray-500" />
              Subcategoria
            </label>
            <input
              type="text"
              value={formData.subcategoria}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              }`}
              placeholder="Ex: Aluguel, Energia, Vendas..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              }`}
              placeholder="Descrição da movimentação..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-gray-500" />
              Valor *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all text-xl font-bold text-center ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              } ${type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(method => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.formaPagamento === method.value
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark' 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="formaPagamento"
                      value={method.value}
                      checked={formData.formaPagamento === method.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, formaPagamento: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        formData.formaPagamento === method.value
                          ? 'bg-primary text-white'
                          : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <Upload size={16} className="text-gray-500" />
              Comprovante
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="comprovante-upload"
              />
              <label
                htmlFor="comprovante-upload"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer font-medium transition-all hover:scale-105 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Upload size={18} />
                Anexar Arquivo
              </label>
              {formData.comprovante && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">Arquivo anexado</span>
                </div>
              )}
            </div>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Formatos aceitos: JPG, PNG, PDF até 5MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-500" />
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              }`}
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

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
                type === 'entrada' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Registrar {type === 'entrada' ? 'Entrada' : 'Saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashMovementModal;