import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, Clock, CheckCircle, XCircle, AlertTriangle, Save, Repeat, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';
import { Expense } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { format, addMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseModalProps {
  expense?: Expense | null;
  onSave: (expense: Omit<Expense, 'id' | 'criadoEm'>) => void;
  onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ expense, onSave, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'fixa' as 'fixa' | 'variavel',
    valor: 0,
    dataVencimento: new Date().toISOString().split('T')[0],
    dataPagamento: '',
    pago: false,
    recorrente: false,
    formaPagamento: 'dinheiro' as 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'cheque' | 'transferencia',
    parcelas: 1,
    observacoes: '',
    usuarioId: user?.id || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(12);
  const [recurrenceDates, setRecurrenceDates] = useState<string[]>([]);

  useEffect(() => {
    if (expense) {
      setFormData({
        descricao: expense.descricao,
        categoria: expense.categoria,
        valor: expense.valor,
        dataVencimento: expense.dataVencimento,
        dataPagamento: expense.dataPagamento || '',
        pago: expense.pago,
        recorrente: expense.recorrente,
        formaPagamento: expense.formaPagamento || 'dinheiro',
        parcelas: expense.parcelas || 1,
        observacoes: expense.observacoes || '',
        usuarioId: expense.usuarioId
      });
    }
  }, [expense, user]);

  useEffect(() => {
    if (formData.recorrente) {
      generateRecurrenceDates();
    }
  }, [formData.dataVencimento, formData.recorrente, recurrenceMonths]);

  const generateRecurrenceDates = () => {
    if (!formData.dataVencimento) return;
    
    const dates: string[] = [];
    const baseDate = new Date(formData.dataVencimento);
    
    for (let i = 1; i <= recurrenceMonths; i++) {
      const nextDate = addMonths(baseDate, i);
      dates.push(format(nextDate, 'yyyy-MM-dd'));
    }
    
    setRecurrenceDates(dates);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    
    if (formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    
    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    }
    
    if (formData.pago && !formData.dataPagamento) {
      newErrors.dataPagamento = 'Data de pagamento é obrigatória para despesas pagas';
    }
    
    if (formData.pago && formData.dataPagamento) {
      const vencimento = parseISO(formData.dataVencimento);
      const pagamento = parseISO(formData.dataPagamento);
      
      if (isAfter(pagamento, new Date())) {
        newErrors.dataPagamento = 'Data de pagamento não pode ser futura';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const paymentMethods = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
    { id: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
    { id: 'pix', label: 'PIX', icon: Smartphone },
    { id: 'cheque', label: 'Cheque', icon: Receipt },
    { id: 'transferencia', label: 'Transferência', icon: CreditCard }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <DollarSign size={28} className="text-secondary" />
            </div>
            {expense ? 'Editar Despesa' : 'Nova Despesa'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                Descrição *
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, descricao: e.target.value }));
                  if (errors.descricao) {
                    setErrors(prev => ({ ...prev, descricao: '' }));
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                } ${errors.descricao ? 'border-red-500' : ''}`}
                placeholder="Ex: Aluguel, Energia, Fornecedor..."
                required
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.descricao}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Tag size={16} className="text-gray-500" />
                Categoria *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.categoria === 'fixa'
                      ? 'border-primary bg-primary/10'
                      : theme === 'dark' 
                        ? 'border-gray-600 hover:border-gray-500' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="categoria"
                    value="fixa"
                    checked={formData.categoria === 'fixa'}
                    onChange={() => setFormData(prev => ({ ...prev, categoria: 'fixa' }))}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      formData.categoria === 'fixa'
                        ? 'bg-primary text-white'
                        : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Repeat size={16} />
                    </div>
                    <span className="font-medium">Fixa</span>
                  </div>
                </label>
                
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.categoria === 'variavel'
                      ? 'border-primary bg-primary/10'
                      : theme === 'dark' 
                        ? 'border-gray-600 hover:border-gray-500' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="categoria"
                    value="variavel"
                    checked={formData.categoria === 'variavel'}
                    onChange={() => setFormData(prev => ({ ...prev, categoria: 'variavel' }))}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      formData.categoria === 'variavel'
                        ? 'bg-primary text-white'
                        : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <TrendingDown size={16} />
                    </div>
                    <span className="font-medium">Variável</span>
                  </div>
                </label>
              </div>
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
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }));
                  if (errors.valor) {
                    setErrors(prev => ({ ...prev, valor: '' }));
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all text-xl font-bold text-center ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                } ${errors.valor ? 'border-red-500' : ''} text-red-600`}
                placeholder="0,00"
                required
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.valor}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, dataVencimento: e.target.value }));
                  if (errors.dataVencimento) {
                    setErrors(prev => ({ ...prev, dataVencimento: '' }));
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                } ${errors.dataVencimento ? 'border-red-500' : ''}`}
                required
              />
              {errors.dataVencimento && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.dataVencimento}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pago"
                checked={formData.pago}
                onChange={(e) => setFormData(prev => ({ ...prev, pago: e.target.checked }))}
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="pago" className="flex items-center gap-2 text-sm font-medium">
                {formData.pago ? (
                  <>
                    <CheckCircle size={16} className="text-green-600" />
                    Despesa já foi paga
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-600" />
                    Despesa pendente
                  </>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recorrente"
                checked={formData.recorrente}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, recorrente: e.target.checked }));
                  setShowRecurrenceOptions(e.target.checked);
                }}
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="recorrente" className="flex items-center gap-2 text-sm font-medium">
                {formData.recorrente ? (
                  <>
                    <Repeat size={16} className="text-blue-600" />
                    Despesa recorrente (mensal)
                  </>
                ) : (
                  <>
                    <Clock size={16} className="text-gray-600" />
                    Despesa única
                  </>
                )}
              </label>
            </div>

            {formData.pago && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Data de Pagamento *
                  </label>
                  <input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dataPagamento: e.target.value }));
                      if (errors.dataPagamento) {
                        setErrors(prev => ({ ...prev, dataPagamento: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    } ${errors.dataPagamento ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.dataPagamento && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {errors.dataPagamento}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-500" />
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.formaPagamento === method.id
                              ? 'border-primary bg-primary/10'
                              : theme === 'dark' 
                                ? 'border-gray-600 hover:border-gray-500' 
                                : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="formaPagamento"
                            value={method.id}
                            checked={formData.formaPagamento === method.id}
                            onChange={() => setFormData(prev => ({ ...prev, formaPagamento: method.id as any }))}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              formData.formaPagamento === method.id
                                ? 'bg-primary text-white'
                                : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <span className="text-sm">{method.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {formData.formaPagamento === 'cartao_credito' && formData.pago && (
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-500" />
                  Parcelas
                </label>
                <select
                  value={formData.parcelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, parcelas: parseInt(e.target.value) }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6, 10, 12].map(num => (
                    <option key={num} value={num}>
                      {num}x de {formatCurrency(formData.valor / num)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showRecurrenceOptions && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Repeat size={16} className="text-gray-500" />
                  Recorrência
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <span>Repetir por</span>
                  <select
                    value={recurrenceMonths}
                    onChange={(e) => setRecurrenceMonths(parseInt(e.target.value))}
                    className={`px-4 py-2 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                  >
                    {[3, 6, 12, 24].map(months => (
                      <option key={months} value={months}>{months} meses</option>
                    ))}
                  </select>
                </div>
                
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Próximos Vencimentos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {recurrenceDates.slice(0, 6).map((date, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg text-sm ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    ))}
                    {recurrenceDates.length > 6 && (
                      <div className={`p-2 rounded-lg text-sm text-center ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        +{recurrenceDates.length - 6} datas
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`mt-3 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
                }`}>
                  <p className="text-xs flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Esta opção apenas marca a despesa como recorrente. Você precisará registrar os pagamentos mensalmente.
                  </p>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
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
                placeholder="Observações adicionais sobre a despesa..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 border-2 py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-secondary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {expense ? 'Atualizar' : 'Criar'} Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;