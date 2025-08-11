import React, { useState, useEffect } from 'react';
import { X, Building, Phone, Mail, MapPin, FileText, Globe, Link, Save, AlertTriangle, CheckCircle, XCircle, Copy, Truck, Search } from 'lucide-react';
import { Supplier } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface SupplierModalProps {
  supplier?: Supplier | null;
  onSave: (supplier: Omit<Supplier, 'id' | 'criadoEm'>) => void;
  onClose: () => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ supplier, onSave, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    cnpjCpf: '',
    telefone: '',
    email: '',
    endereco: '',
    website: '',
    observacoes: '',
    ativo: true
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        nome: supplier.nome,
        cnpjCpf: supplier.cnpjCpf,
        telefone: supplier.telefone,
        email: supplier.email,
        endereco: supplier.endereco || '',
        website: supplier.website || '',
        observacoes: supplier.observacoes || '',
        ativo: supplier.ativo
      });
    }
  }, [supplier]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (formData.cnpjCpf && !validarCnpjCpf(formData.cnpjCpf)) {
      newErrors.cnpjCpf = 'CNPJ/CPF inválido';
    }
    
    if (formData.email && !validarEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (formData.website && !validarWebsite(formData.website)) {
      newErrors.website = 'Website inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarCnpjCpf = (value: string) => {
    // Simplificado para fins de demonstração
    const numeros = value.replace(/\D/g, '');
    return numeros.length === 11 || numeros.length === 14 || numeros.length === 0;
  };

  const validarEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === '';
  };

  const validarWebsite = (website: string) => {
    return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?].*)?$/.test(website) || website === '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const formatCnpjCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar para o clipboard:', err);
    }
  };

  const handleCnpjSearch = async () => {
    // Simplificado para fins de demonstração
    // Em um ambiente real, você faria uma chamada API para buscar dados do CNPJ
    const cnpj = formData.cnpjCpf.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      setErrors(prev => ({ ...prev, cnpjCpf: 'CNPJ deve ter 14 dígitos para consulta' }));
      return;
    }
    
    // Simulação de busca
    alert('Funcionalidade de consulta CNPJ em desenvolvimento');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Truck size={24} className="text-primary" />
            </div>
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Building size={16} className="text-gray-500" />
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nome: e.target.value }));
                    if (errors.nome) {
                      setErrors(prev => ({ ...prev, nome: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  } ${errors.nome ? 'border-red-500' : ''}`}
                  placeholder="Ex: Distribuidora ABC Ltda"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.nome}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  CNPJ/CPF
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.cnpjCpf}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          cnpjCpf: formatCnpjCpf(e.target.value) 
                        }));
                        if (errors.cnpjCpf) {
                          setErrors(prev => ({ ...prev, cnpjCpf: '' }));
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                      } ${errors.cnpjCpf ? 'border-red-500' : ''}`}
                      placeholder="00.000.000/0000-00"
                    />
                    {formData.cnpjCpf && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.cnpjCpf, 'cnpjCpf')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        title="Copiar"
                      >
                        {copied === 'cnpjCpf' ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCnpjSearch}
                    className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Buscar dados do CNPJ"
                  >
                    <Search size={18} />
                  </button>
                </div>
                {errors.cnpjCpf && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.cnpjCpf}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  Telefone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        telefone: formatPhone(e.target.value) 
                      }));
                      if (errors.telefone) {
                        setErrors(prev => ({ ...prev, telefone: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    } ${errors.telefone ? 'border-red-500' : ''}`}
                    placeholder="(11) 99999-9999"
                  />
                  {formData.telefone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.telefone, 'telefone')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      title="Copiar"
                    >
                      {copied === 'telefone' ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
                {errors.telefone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.telefone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    } ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="contato@empresa.com"
                  />
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.email, 'email')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      title="Copiar"
                    >
                      {copied === 'email' ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Coluna da Direita */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />
                  Endereço
                </label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                  rows={3}
                  placeholder="Endereço completo da empresa..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Globe size={16} className="text-gray-500" />
                  Website
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, website: e.target.value }));
                      if (errors.website) {
                        setErrors(prev => ({ ...prev, website: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    } ${errors.website ? 'border-red-500' : ''}`}
                    placeholder="https://www.empresa.com"
                  />
                  {formData.website && (
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.website, 'website')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copiar"
                      >
                        {copied === 'website' ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                      <a
                        href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                        title="Abrir website"
                      >
                        <Link size={18} />
                      </a>
                    </div>
                  )}
                </div>
                {errors.website && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.website}
                  </p>
                )}
              </div>

              <div>
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
                  placeholder="Observações adicionais sobre o fornecedor..."
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
                      Fornecedor ativo
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-600" />
                      Fornecedor inativo
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          {!supplier && (
            <div className={`p-4 rounded-xl border-l-4 border-blue-500 ${
              theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
            }`}>
              <h5 className="font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Informações Importantes:
              </h5>
              <div className="text-sm space-y-1">
                <p>• Apenas o nome da empresa é obrigatório</p>
                <p>• Fornecedores cadastrados poderão ser associados a produtos</p>
                <p>• Mantenha os dados de contato sempre atualizados</p>
                <p>• Fornecedores inativos não aparecerão nas listas de seleção</p>
              </div>
            </div>
          )}

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
              className="flex-1 bg-primary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {supplier ? 'Atualizar' : 'Criar'} Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;