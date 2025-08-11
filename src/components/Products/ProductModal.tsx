import React, { useState, useEffect } from 'react';
import { X, Upload, Tag, DollarSign, Package, Barcode, Truck, Image, AlertTriangle, CheckCircle, XCircle, Save, RefreshCw, Copy } from 'lucide-react';
import { Product, Supplier } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface ProductModalProps {
  product?: Product | null;
  suppliers: Supplier[];
  onSave: (product: Omit<Product, 'id' | 'criadoEm'>) => void;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, suppliers, onSave, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    codigoBarras: '',
    preco: 0,
    categoria: '',
    estoque: 0,
    estoqueMinimo: 10,
    fornecedorId: '',
    foto: '',
    ativo: true
  });
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome,
        codigo: product.codigo,
        codigoBarras: product.codigoBarras || '',
        preco: product.preco,
        categoria: product.categoria,
        estoque: product.estoque,
        estoqueMinimo: product.estoqueMinimo,
        fornecedorId: product.fornecedorId || '',
        foto: product.foto || '',
        ativo: product.ativo
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se estiver usando categoria personalizada, use-a
    const finalFormData = {
      ...formData,
      categoria: showCustomCategory ? customCategory : formData.categoria
    };
    
    onSave(finalFormData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, foto: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCode = () => {
    setIsGeneratingCode(true);
    
    // Simular um pequeno atraso para mostrar o efeito de carregamento
    setTimeout(() => {
      const timestamp = Date.now().toString().slice(-6);
      const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newCode = `P${timestamp}${randomDigits}`;
      setFormData(prev => ({ ...prev, codigo: newCode }));
      setIsGeneratingCode(false);
    }, 500);
  };

  const generateBarcode = () => {
    // Gerar um código EAN-13 válido
    const prefix = '789'; // Prefixo para produtos brasileiros
    const middle = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const code = prefix + middle;
    
    // Calcular dígito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    const barcode = code + checkDigit;
    setFormData(prev => ({ ...prev, codigoBarras: barcode }));
  };

  // Obter categorias existentes
  const existingCategories = [
    'JORNAIS',
    'REVISTAS',
    'BEBIDAS',
    'CIGARROS',
    'TABACARIA',
    'BRINQUEDOS',
    'INFORMÁTICA',
    'PAPELARIA',
    'DOCES',
    'SALGADOS',
    'DIVERSOS'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Package size={24} className="text-primary" />
            </div>
            {product ? 'Editar Produto' : 'Novo Produto'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda - Foto e Informações Básicas */}
            <div className="lg:col-span-1">
              {/* Foto do Produto */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Image size={16} className="text-gray-500" />
                  Foto do Produto
                </label>
                <div className="flex flex-col items-center">
                  <div className={`w-full aspect-square mb-4 rounded-2xl border-2 border-dashed flex items-center justify-center ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`}>
                    {formData.foto ? (
                      <img
                        src={formData.foto}
                        alt="Preview"
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <Package size={64} className="text-gray-400" />
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer font-medium transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Upload size={18} />
                    {formData.foto ? 'Alterar Foto' : 'Escolher Foto'}
                  </label>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    JPG, PNG até 2MB • Recomendado: 500x500px
                  </p>
                </div>
              </div>

              {/* Status do Produto */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Status do Produto</label>
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
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
                          Produto ativo
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-red-600" />
                          Produto inativo
                        </>
                      )}
                    </label>
                  </div>
                  
                  <p className={`text-xs mt-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Produtos inativos não aparecem no PDV e não podem ser vendidos.
                  </p>
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Truck size={16} className="text-gray-500" />
                  Fornecedor
                </label>
                <select
                  value={formData.fornecedorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedorId: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                >
                  <option value="">Selecione um fornecedor...</option>
                  {suppliers.filter(s => s.ativo).map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.nome}</option>
                  ))}
                </select>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Associe um fornecedor para facilitar pedidos e reposição.
                </p>
              </div>
            </div>

            {/* Coluna da Direita - Dados do Produto */}
            <div className="lg:col-span-2 space-y-6">
              {/* Nome do Produto */}
              <div>
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-gray-500" />
                  Nome do Produto *
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
                  placeholder="Ex: Jornal O Globo - Edição Diária"
                  required
                />
              </div>

              {/* Códigos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <Tag size={16} className="text-gray-500" />
                    Código do Produto *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                      }`}
                      placeholder="Ex: P001"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      disabled={isGeneratingCode}
                      className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isGeneratingCode ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Zap size={18} />
                      )}
                      Gerar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <Barcode size={16} className="text-gray-500" />
                    Código de Barras
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.codigoBarras}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigoBarras: e.target.value }))}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                          : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                      }`}
                      placeholder="Ex: 7891234567890"
                    />
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Barcode size={18} />
                      EAN-13
                    </button>
                  </div>
                </div>
              </div>

              {/* Preço e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-500" />
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <Tag size={16} className="text-gray-500" />
                    Categoria *
                  </label>
                  {!showCustomCategory ? (
                    <div className="flex gap-3">
                      <select
                        value={formData.categoria}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setShowCustomCategory(true);
                            setCustomCategory("");
                          } else {
                            setFormData(prev => ({ ...prev, categoria: e.target.value }));
                          }
                        }}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                            : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                        }`}
                        required
                      >
                        <option value="">Selecione...</option>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="custom">+ Nova Categoria</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value.toUpperCase())}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                            : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                        }`}
                        placeholder="Nova categoria..."
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setFormData(prev => ({ ...prev, categoria: '' }));
                        }}
                        className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Estoque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <Package size={16} className="text-gray-500" />
                    Estoque Atual *
                  </label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-gray-500" />
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    value={formData.estoqueMinimo}
                    onChange={(e) => setFormData(prev => ({ ...prev, estoqueMinimo: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                    required
                  />
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    O sistema alertará quando o estoque estiver abaixo deste valor.
                  </p>
                </div>
              </div>

              {/* Alerta de Estoque */}
              {formData.estoque <= formData.estoqueMinimo && (
                <div className={`p-4 rounded-xl ${
                  formData.estoque === 0
                    ? theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                    : theme === 'dark' ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className={formData.estoque === 0 ? 'text-red-500' : 'text-yellow-500'} />
                    <div>
                      <p className={`font-bold ${formData.estoque === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {formData.estoque === 0 ? 'Produto sem estoque!' : 'Estoque abaixo do mínimo!'}
                      </p>
                      <p className={`text-sm ${
                        formData.estoque === 0 
                          ? theme === 'dark' ? 'text-red-300' : 'text-red-700'
                          : theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
                      }`}>
                        {formData.estoque === 0 
                          ? 'Este produto não poderá ser vendido até que o estoque seja reposto.' 
                          : `O estoque atual (${formData.estoque}) está abaixo do mínimo configurado (${formData.estoqueMinimo}).`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
              className="flex-1 bg-primary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {product ? 'Atualizar' : 'Criar'} Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;