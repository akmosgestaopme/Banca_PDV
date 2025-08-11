import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Package, Search, Filter, Grid, List, TrendingUp, BarChart3, Eye, Settings } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface Category {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
}

const CategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true
  });

  const defaultCategories = [
    'JORNAIS',
    'REVISTAS', 
    'BEBIDAS',
    'CIGARROS',
    'TABACARIA',
    'BRINQUEDOS',
    'INFORMÁTICA',
    'PAPELARIA',
    'DIVERSOS'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const savedCategories = JSON.parse(localStorage.getItem('pdv_categories') || '[]');
    
    if (savedCategories.length === 0) {
      // Criar categorias padrão
      const defaultCats = defaultCategories.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        nome: name,
        descricao: `Categoria ${name.toLowerCase()}`,
        ativo: true,
        criadoEm: new Date().toISOString()
      }));
      
      localStorage.setItem('pdv_categories', JSON.stringify(defaultCats));
      setCategories(defaultCats);
    } else {
      setCategories(savedCategories);
    }
  };

  const saveCategories = (cats: Category[]) => {
    localStorage.setItem('pdv_categories', JSON.stringify(cats));
    setCategories(cats);
  };

  const handleSave = () => {
    if (!formData.nome.trim()) return;

    if (editingCategory) {
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, ...formData }
          : cat
      );
      saveCategories(updatedCategories);
    } else {
      const newCategory: Category = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        criadoEm: new Date().toISOString()
      };
      saveCategories([...categories, newCategory]);
    }

    setShowModal(false);
    setEditingCategory(null);
    setFormData({ nome: '', descricao: '', ativo: true });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nome: category.nome,
      descricao: category.descricao || '',
      ativo: category.ativo
    });
    setShowModal(true);
  };

  const handleDelete = (category: Category) => {
    if (confirm(`Deseja excluir a categoria "${category.nome}"?`)) {
      const updatedCategories = categories.filter(cat => cat.id !== category.id);
      saveCategories(updatedCategories);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && category.ativo) ||
                         (filterStatus === 'inactive' && !category.ativo);
    
    return matchesSearch && matchesFilter;
  });

  const activeCategories = categories.filter(cat => cat.ativo);
  const inactiveCategories = categories.filter(cat => !cat.ativo);

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'JORNAIS': '📰',
      'REVISTAS': '📖',
      'BEBIDAS': '🥤',
      'CIGARROS': '🚬',
      'TABACARIA': '🚬',
      'BRINQUEDOS': '🧸',
      'INFORMÁTICA': '💻',
      'PAPELARIA': '📝',
      'DIVERSOS': '📦'
    };
    return iconMap[categoryName.toUpperCase()] || '🏷️';
  };

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
                <Tag size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Categorias</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Organize seus produtos por categorias
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
            >
              <Plus size={24} />
              Nova Categoria
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="text-4xl font-bold text-primary">{categories.length}</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Tag size={32} className="text-primary" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ativas</p>
                <p className="text-4xl font-bold text-green-600">{activeCategories.length}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp size={32} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Inativas</p>
                <p className="text-4xl font-bold text-red-600">{inactiveCategories.length}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <Package size={32} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mais Usada</p>
                <p className="text-lg font-bold text-secondary">
                  {activeCategories.length > 0 ? activeCategories[0].nome : 'N/A'}
                </p>
              </div>
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <BarChart3 size={32} className="text-secondary" />
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
                  placeholder="Buscar categorias..."
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
                  <option value="all">Todas</option>
                  <option value="active">Ativas</option>
                  <option value="inactive">Inativas</option>
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
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`group p-8 rounded-3xl shadow-xl border-l-4 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-800 border-secondary' : 'bg-white border-secondary'
                } ${!category.ativo ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getCategoryIcon(category.nome)}</div>
                    <div>
                      <h3 className="font-bold text-xl">{category.nome}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        category.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {category.descricao && (
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {category.descricao}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-xs">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {new Date(category.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>0 produtos</span>
                  </div>
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
                    <th className="px-8 py-6 text-left text-sm font-bold">Categoria</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Descrição</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Status</th>
                    <th className="px-8 py-6 text-left text-sm font-bold">Criado em</th>
                    <th className="px-8 py-6 text-center text-sm font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{getCategoryIcon(category.nome)}</div>
                          <div>
                            <span className="font-bold text-lg">{category.nome}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">{category.descricao || '-'}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          category.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        {new Date(category.criadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-110"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-110"
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
        {filteredCategories.length === 0 && (
          <div className={`text-center py-20 rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="text-8xl mb-6">🏷️</div>
            <h3 className="text-2xl font-bold mb-4">Nenhuma categoria encontrada</h3>
            <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando sua primeira categoria'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 font-medium text-lg transition-all hover:scale-105"
              >
                Criar Primeira Categoria
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-3xl p-8 w-full max-w-md shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Tag size={24} className="text-primary" />
                  </div>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ nome: '', descricao: '', ativo: true });
                  }}
                  className={`p-2 rounded-xl transition-all hover:scale-110 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3">Nome da Categoria *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                    placeholder="Ex: ELETRÔNICOS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className={`w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                    rows={3}
                    placeholder="Descrição opcional da categoria..."
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
                  <label htmlFor="ativo" className="text-sm font-medium">
                    Categoria ativa
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setFormData({ nome: '', descricao: '', ativo: true });
                    }}
                    className={`flex-1 border-2 py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-primary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all hover:scale-105"
                  >
                    {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                  </button>
                </div>
              </div>
            </div>
          </div>
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

export default CategoriesScreen;