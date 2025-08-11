import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Grid, List, Package, Tag, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw, Download, Upload, BarChart3, FileText, Zap } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/database';
import { Product, Supplier } from '../../types';
import ProductModal from './ProductModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

const ProductsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user, checkPermission } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Carregar produtos
      const allProducts = db.getAllProducts();
      setProducts(allProducts);
      
      // Carregar fornecedores
      const allSuppliers = db.getAllSuppliers();
      setSuppliers(allSuppliers);
      
      // Extrair categorias únicas
      const uniqueCategories = Array.from(new Set(allProducts.map(p => p.categoria)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (productData: Omit<Product, 'id' | 'criadoEm'>) => {
    if (editingProduct) {
      // Atualizar produto existente
      db.updateProduct(editingProduct.id, productData);
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData } : p
      ));
    } else {
      // Criar novo produto
      const newProduct = db.createProduct(productData);
      setProducts([...products, newProduct]);
      
      // Adicionar nova categoria se necessário
      if (!categories.includes(productData.categoria)) {
        setCategories([...categories, productData.categoria]);
      }
    }
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Deseja excluir o produto "${product.nome}"?`)) {
      db.updateProduct(product.id, { ativo: false });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, ativo: false } : p
      ));
    }
  };

  const handleToggleStatus = (product: Product) => {
    db.updateProduct(product.id, { ativo: !product.ativo });
    setProducts(products.map(p => 
      p.id === product.id ? { ...p, ativo: !p.ativo } : p
    ));
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      // Filtro por texto
      const matchesSearch = 
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigoBarras && product.codigoBarras.includes(searchTerm));
      
      // Filtro por status
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && product.ativo) ||
        (filterStatus === 'inactive' && !product.ativo);
      
      // Filtro por categoria
      const matchesCategory = 
        filterCategory === 'all' || 
        product.categoria === filterCategory;
      
      // Filtro por estoque
      const matchesStock = 
        filterStock === 'all' || 
        (filterStock === 'low' && product.estoque <= product.estoqueMinimo && product.estoque > 0) ||
        (filterStock === 'out' && product.estoque === 0);
      
      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.nome.localeCompare(b.nome);
      } else if (sortBy === 'price') {
        return b.preco - a.preco;
      } else {
        return a.estoque - b.estoque;
      }
    });
  };

  const filteredProducts = getFilteredProducts();
  const activeProducts = products.filter(p => p.ativo);
  const inactiveProducts = products.filter(p => !p.ativo);
  const lowStockProducts = products.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0);
  const outOfStockProducts = products.filter(p => p.estoque === 0);

  const generateProductsPDF = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Carregar dados da empresa
      const companyDataStr = localStorage.getItem('company_data');
      const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Cabeçalho com dados da empresa (apenas se informados)
      if (companyData && (companyData.nomeFantasia || companyData.razaoSocial)) {
        doc.setFontSize(14);
        doc.text(companyData.nomeFantasia || companyData.razaoSocial, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
        
        if (companyData.cnpj) {
          doc.setFontSize(10);
          doc.text(`CNPJ: ${companyData.cnpj}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 6;
        }
        yPosition += 5;
      }

      // Título do relatório
      doc.setFontSize(16);
      doc.text('RELATÓRIO DE PRODUTOS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Resumo
      doc.setFontSize(12);
      doc.text('RESUMO', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Total de Produtos: ${products.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Produtos Ativos: ${activeProducts.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Produtos Inativos: ${inactiveProducts.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Estoque Baixo: ${lowStockProducts.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Sem Estoque: ${outOfStockProducts.length}`, 20, yPosition);
      yPosition += 15;

      // Lista de produtos
      doc.setFontSize(12);
      doc.text('PRODUTOS', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Código', 20, yPosition);
      doc.text('Nome', 45, yPosition);
      doc.text('Categoria', 110, yPosition);
      doc.text('Preço', 150, yPosition);
      doc.text('Estoque', 170, yPosition);
      doc.text('Status', 190, yPosition);
      yPosition += 6;
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 4;
      
      // Dados da tabela
      doc.setFont('helvetica', 'normal');
      filteredProducts.forEach((product) => {
        // Verificar se precisa de nova página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
          
          // Cabeçalho da tabela na nova página
          doc.setFont('helvetica', 'bold');
          doc.text('Código', 20, yPosition);
          doc.text('Nome', 45, yPosition);
          doc.text('Categoria', 110, yPosition);
          doc.text('Preço', 150, yPosition);
          doc.text('Estoque', 170, yPosition);
          doc.text('Status', 190, yPosition);
          yPosition += 6;
          
          // Linha separadora
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.line(20, yPosition, 190, yPosition);
          yPosition += 4;
          
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(product.codigo, 20, yPosition);
        
        // Nome do produto (com quebra de linha se necessário)
        const nameLines = doc.splitTextToSize(product.nome, 60);
        nameLines.forEach((line: string, i: number) => {
          doc.text(line, 45, yPosition + (i * 4));
        });
        
        // Avançar posição Y baseado no número de linhas do nome
        const nameHeight = nameLines.length * 4;
        
        doc.text(product.categoria, 110, yPosition);
        doc.text(`R$ ${product.preco.toFixed(2)}`, 150, yPosition);
        
        // Destacar estoque baixo ou zerado
        if (product.estoque === 0) {
          doc.setTextColor(255, 0, 0); // Vermelho para sem estoque
        } else if (product.estoque <= product.estoqueMinimo) {
          doc.setTextColor(255, 165, 0); // Laranja para estoque baixo
        }
        
        doc.text(product.estoque.toString(), 170, yPosition);
        doc.setTextColor(0, 0, 0); // Resetar cor
        
        // Status
        if (product.ativo) {
          doc.setTextColor(0, 128, 0); // Verde para ativo
          doc.text('ATIVO', 190, yPosition);
        } else {
          doc.setTextColor(128, 128, 128); // Cinza para inativo
          doc.text('INATIVO', 190, yPosition);
        }
        
        doc.setTextColor(0, 0, 0); // Resetar cor
        yPosition += Math.max(nameHeight, 6) + 2;
      });

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`produtos-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const canCreateProduct = checkPermission('products_create');
  const canEditProduct = checkPermission('products_edit');
  const canDeleteProduct = checkPermission('products_delete');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-100'
              }`}>
                <Package size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Produtos</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gerencie seu catálogo de produtos
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={generateProductsPDF}
                disabled={isGeneratingPdf}
                className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } shadow-lg`}
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Exportar PDF
                  </>
                )}
              </button>
              
              {canCreateProduct && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
                >
                  <Plus size={24} />
                  Novo Produto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="text-4xl font-bold text-primary">{products.length}</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Package size={32} className="text-primary" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ativos</p>
                <p className="text-4xl font-bold text-green-600">{activeProducts.length}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Inativos</p>
                <p className="text-4xl font-bold text-red-600">{inactiveProducts.length}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <EyeOff size={32} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Estoque Baixo</p>
                <p className="text-4xl font-bold text-orange-600">{lowStockProducts.length}</p>
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sem Estoque</p>
                <p className="text-4xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controles e Filtros */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Tag size={20} className="text-gray-500" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Package size={20} className="text-gray-500" />
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos os estoques</option>
                  <option value="low">Estoque baixo</option>
                  <option value="out">Sem estoque</option>
                </select>
              </div>

              {/* Toggle de visualização */}
              <div className={`flex items-center p-1 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-primary text-white shadow-lg' 
                      : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-primary text-white shadow-lg' 
                      : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visualização em Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`group p-8 rounded-3xl shadow-xl border-l-4 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-800 border-secondary' : 'bg-white border-secondary'
                } ${!product.ativo ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      {product.foto ? (
                        <img
                          src={product.foto}
                          alt={product.nome}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Package size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{product.nome}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        product.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditProduct && (
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canEditProduct && (
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`p-2 rounded-xl transition-all hover:scale-110 ${
                          product.ativo 
                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={product.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {product.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    {canDeleteProduct && (
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Código:</span>
                    <span className="text-sm font-medium">{product.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Categoria:</span>
                    <span className="text-sm font-medium">{product.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Preço:</span>
                    <span className="text-sm font-bold text-green-600">R$ {product.preco.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Estoque:</span>
                    <span className={`text-sm font-bold ${
                      product.estoque === 0 
                        ? 'text-red-600' 
                        : product.estoque <= product.estoqueMinimo 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                    }`}>
                      {product.estoque} {product.estoque <= product.estoqueMinimo && product.estoque > 0 && '⚠️'}
                      {product.estoque === 0 && '❌'}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      product.estoque === 0 
                        ? 'bg-red-600' 
                        : product.estoque <= product.estoqueMinimo 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (product.estoque / product.estoqueMinimo) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="mt-4 text-xs text-center text-gray-500">
                  Mín: {product.estoqueMinimo} | Fornecedor: {
                    product.fornecedorId 
                      ? suppliers.find(s => s.id === product.fornecedorId)?.nome || 'N/A'
                      : 'N/A'
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'list' && (
          <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold">Produto</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Código</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Categoria</th>
                    <th className="px-8 py-6 text-right text-sm font-bold">Preço</th>
                    <th className="px-8 py-6 text-center text-sm font-bold">Estoque</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Status</th>
                    <th className="px-8 py-6 text-center text-sm font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            {product.foto ? (
                              <img
                                src={product.foto}
                                alt={product.nome}
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              <Package size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{product.nome}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {product.codigoBarras || 'Sem código de barras'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-mono">{product.codigo}</td>
                      <td className="px-8 py-6 text-sm">{product.categoria}</td>
                      <td className="px-8 py-6 text-right font-bold text-green-600">
                        R$ {product.preco.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${
                            product.estoque === 0 
                              ? 'text-red-600' 
                              : product.estoque <= product.estoqueMinimo 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                          }`}>
                            {product.estoque}
                          </span>
                          <span className="text-xs text-gray-500">Mín: {product.estoqueMinimo}</span>
                          
                          {product.estoque === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full mt-1">
                              Sem estoque
                            </span>
                          )}
                          
                          {product.estoque > 0 && product.estoque <= product.estoqueMinimo && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full mt-1">
                              Estoque baixo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          product.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.ativo ? (
                            <>
                              <CheckCircle size={14} className="mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-3">
                          {canEditProduct && (
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canEditProduct && (
                            <button
                              onClick={() => handleToggleStatus(product)}
                              className={`p-2 rounded-xl transition-all hover:scale-110 ${
                                product.ativo 
                                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={product.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {product.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                          {canDeleteProduct && (
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {filteredProducts.length === 0 && (
          <div className={`text-center py-20 rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="text-8xl mb-6">📦</div>
            <h3 className="text-2xl font-bold mb-4">Nenhum produto encontrado</h3>
            <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterStock !== 'all'
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece cadastrando seu primeiro produto'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && filterStock === 'all' && canCreateProduct && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 font-medium text-lg transition-all hover:scale-105"
              >
                Cadastrar Primeiro Produto
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <ProductModal
            product={editingProduct}
            suppliers={suppliers.filter(s => s.ativo)}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingProduct(null);
            }}
          />
        )}
      </div>

      {/* Footer discreto */}
      <footer className={`py-8 border-t ${
        theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-8">
          <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Powered by CYBERPIU
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProductsScreen;