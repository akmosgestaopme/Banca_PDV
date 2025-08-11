import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, CheckCircle, XCircle, Tag } from 'lucide-react';
import { CashRegister } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface CashRegisterModalProps {
  register?: CashRegister | null;
  onSave: (register: Omit<CashRegister, 'id' | 'criadoEm'>) => void;
  onClose: () => void;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ register, onSave, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true
  });

  useEffect(() => {
    if (register) {
      setFormData({
        nome: register.nome,
        descricao: register.descricao || '',
        ativo: register.ativo
      });
    }
  }, [register]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-md shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} className="text-primary" />
            </div>
            {register ? 'Editar Caixa' : 'Novo Caixa'}
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
          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <Tag size={16} className="text-gray-500" />
              Nome do Caixa *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              }`}
              placeholder="Ex: Caixa Principal, Caixa 01..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                  : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
              }`}
              rows={3}
              placeholder="Descrição opcional do caixa..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
              className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="flex items-center gap-2 text-sm font-medium">
              {formData.ativo ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  Caixa ativo
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-red-600" />
                  Caixa inativo
                </>
              )}
            </label>
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
              className="flex-1 bg-primary text-white py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-all hover:scale-105"
            >
              {register ? 'Atualizar' : 'Criar'} Caixa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashRegisterModal;