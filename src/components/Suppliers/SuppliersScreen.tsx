import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, MapPin, Building, Filter, Grid, List, Download, Upload, Copy, CheckCircle, XCircle, FileText, Globe, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Supplier } from '../../types';
import { db } from '../../services/database';
import { useTheme } from '../../hooks/useTheme';
import SupplierModal from './SupplierModal';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SuppliersScreen: React.FC = () => {
  const { theme } = useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    setSuppliers(db.getAllSuppliers());
  };

  const handleSave = (supplierData: Omit<Supplier, 'id' | 'criadoEm'>) => {
    if (editingSupplier) {
      // Atualizar fornecedor existente
      db.updateSupplier(editingSupplier.id, supplierData);
    } else {
      // Criar novo fornecedor
      db.createSupplier(supplierData);
    }
    loadSuppliers();
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`Deseja excluir o fornecedor "${supplier.nome}"?`)) {
      db.updateSupplier(supplier.id, { ativo: false });
      loadSuppliers();
    }
  };

  const handleToggleStatus = (supplier: Supplier) => {
    db.updateSupplier(supplier.id, { ativo: !supplier.ativo });
    loadSuppliers();
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar para o clipboard:', err);
    }
  };

  const generateSuppliersPDF = async () => {
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
      doc.text('LISTA DE FORNECEDORES', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Filtrar fornecedores conforme os filtros atuais
      const filteredSuppliers = getFilteredSuppliers();
      
      // Resumo
      doc.setFontSize(12);
      doc.text('RESUMO', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Total de Fornecedores: ${filteredSuppliers.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Fornecedores Ativos: ${filteredSuppliers.filter(s => s.ativo).length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Fornecedores Inativos: ${filteredSuppliers.filter(s => !s.ativo).length}`, 20, yPosition);
      yPosition += 15;

      // Lista de fornecedores
      doc.setFontSize(12);
      doc.text('FORNECEDORES', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(8);
      filteredSuppliers.forEach((supplier, index) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.text(`${index + 1}. ${supplier.nome} ${!supplier.ativo ? '(INATIVO)' : ''}`, 20, yPosition);
        yPosition += 6;
        
        doc.setFontSize(8);
        doc.text(`CNPJ/CPF: ${supplier.cnpjCpf}`, 25, yPosition);
        yPosition += 4;
        doc.text(`Telefone: ${supplier.telefone}`, 25, yPosition);
        yPosition += 4;
        doc.text(`Email: ${supplier.email}`, 25, yPosition);
        yPosition += 4;
        
        if (supplier.endereco) {
          doc.text(`Endereço: ${supplier.endereco}`, 25, yPosition);
          yPosition += 4;
        }
        
        doc.text(`Cadastrado em: ${format(new Date(supplier.criadoEm), 'dd/MM/yyyy', { locale: ptBR })}`, 25, yPosition);
        yPosition += 8;
      });

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`fornecedores-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.cnpjCpf.includes(searchTerm) ||
                           supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'active' && supplier.ativo) ||
                           (filterStatus === 'inactive' && !supplier.ativo);
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.nome.localeCompare(b.nome);
      } else {
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      }
    });
  };

  const filteredSuppliers = getFilteredSuppliers();
  const activeSuppliers = suppliers.filter(s => s.ativo);
  const inactiveSuppliers = suppliers.filter(s => !s.ativo);

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
                <Truck size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Fornecedores</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gerencie seus fornecedores e parcerias comerciais
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={generateSuppliersPDF}
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
              
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
              >
                <Plus size={24} />
                Novo Fornecedor
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="text-4xl font-bold text-primary">{suppliers.length}</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Truck size={32} className="text-primary" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ativos</p>
                <p className="text-4xl font-bold text-green-600">{activeSuppliers.length}</p>
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
                <p className="text-4xl font-bold text-red-600">{inactiveSuppliers.length}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <XCircle size={32} className="text-red-600" />
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
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar fornecedores..."
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
            <div className="flex items-center gap-4">
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
                <FileText size={20} className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="name">Nome</option>
                  <option value="date">Data de Cadastro</option>
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
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={`group p-8 rounded-3xl shadow-xl border-l-4 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-800 border-secondary' : 'bg-white border-secondary'
                } ${!supplier.ativo ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
                      <Building size={28} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{supplier.nome}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        supplier.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(supplier)}
                      className={`p-2 rounded-xl transition-all hover:scale-110 ${
                        supplier.ativo 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={supplier.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {supplier.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-mono">{supplier.cnpjCpf}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100">
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <span className="text-sm">{supplier.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100">
                      <Mail size={16} className="text-purple-600" />
                    </div>
                    <span className="text-sm truncate max-w-[180px]">{supplier.email}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewDetails(supplier)}
                  className={`w-full py-3 rounded-xl font-medium transition-all hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Ver Detalhes
                </button>
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
                    <th className="px-8 py-6 text-left text-sm font-bold">Fornecedor</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">CNPJ/CPF</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Contato</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Status</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Criado em</th>
                    <th className="px-8 py-6 text-center text-sm font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                            <Building size={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{supplier.nome}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`}>
                              {supplier.endereco || 'Endereço não informado'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-mono">{supplier.cnpjCpf}</td>
                      <td className="px-8 py-6 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-green-600" />
                            <span>{supplier.telefone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-blue-600" />
                            <span className="truncate max-w-[150px]">{supplier.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          supplier.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.ativo ? (
                            <>
                              <CheckCircle size={14} className="mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle size={14} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        {format(new Date(supplier.criadoEm), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleViewDetails(supplier)}
                            className="p-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all hover:scale-110"
                            title="Ver Detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(supplier)}
                            className={`p-2 rounded-xl transition-all hover:scale-110 ${
                              supplier.ativo 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            title={supplier.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {supplier.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(supplier)}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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
        {filteredSuppliers.length === 0 && (
          <div className={`text-center py-20 rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="text-8xl mb-6">🚚</div>
            <h3 className="text-2xl font-bold mb-4">Nenhum fornecedor encontrado</h3>
            <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece cadastrando seu primeiro fornecedor'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 font-medium text-lg transition-all hover:scale-105"
              >
                Cadastrar Primeiro Fornecedor
              </button>
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Building size={24} className="text-primary" />
                  </div>
                  Detalhes do Fornecedor
                </h2>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className={`p-2 rounded-xl transition-all hover:scale-110 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10">
                      <Building size={32} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedSupplier.nome}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSupplier.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSupplier.ativo ? (
                          <>
                            <CheckCircle size={12} className="mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="mr-1" />
                            Inativo
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedSupplier)}
                      className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        handleToggleStatus(selectedSupplier);
                        setSelectedSupplier(null);
                      }}
                      className={`p-2 rounded-xl transition-all hover:scale-110 ${
                        selectedSupplier.ativo 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={selectedSupplier.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {selectedSupplier.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Informações Detalhadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="font-medium">CNPJ/CPF</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedSupplier.cnpjCpf, 'cnpjCpf')}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Copiar"
                      >
                        {copiedField === 'cnpjCpf' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-lg font-mono">{selectedSupplier.cnpjCpf}</p>
                  </div>

                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-green-600" />
                        <span className="font-medium">Telefone</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedSupplier.telefone, 'telefone')}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Copiar"
                      >
                        {copiedField === 'telefone' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-lg">{selectedSupplier.telefone}</p>
                  </div>

                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-purple-600" />
                        <span className="font-medium">Email</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedSupplier.email, 'email')}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Copiar"
                      >
                        {copiedField === 'email' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-lg break-all">{selectedSupplier.email}</p>
                  </div>

                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-orange-600" />
                      <span className="font-medium">Data de Cadastro</span>
                    </div>
                    <p className="text-lg">{format(new Date(selectedSupplier.criadoEm), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                </div>

                {/* Endereço */}
                {selectedSupplier.endereco && (
                  <div className={`p-4 rounded-xl mt-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-red-600" />
                        <span className="font-medium">Endereço</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedSupplier.endereco || '', 'endereco')}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Copiar"
                      >
                        {copiedField === 'endereco' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-lg">{selectedSupplier.endereco}</p>
                  </div>
                )}

                {/* Ações Rápidas */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <a
                    href={`mailto:${selectedSupplier.email}`}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Mail size={18} />
                    Enviar Email
                  </a>
                  <a
                    href={`tel:${selectedSupplier.telefone.replace(/\D/g, '')}`}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Phone size={18} />
                    Ligar
                  </a>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className={`px-6 py-3 rounded-xl font-medium ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <SupplierModal
            supplier={editingSupplier}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingSupplier(null);
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

export default SuppliersScreen;