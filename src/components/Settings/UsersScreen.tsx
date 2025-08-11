import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/database';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import UserModal from './UserModal';

const UsersScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(db.getAllUsers());
  };

  const handleSave = (userData: Omit<User, 'id' | 'criadoEm'>) => {
    if (editingUser) {
      db.updateUser(editingUser.id, userData);
    } else {
      db.createUser(userData);
    }
    loadUsers();
    setShowModal(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Você não pode desativar seu próprio usuário!');
      return;
    }
    
    db.updateUser(user.id, { ativo: !user.ativo });
    loadUsers();
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }
    
    if (confirm(`Deseja excluir o usuário "${user.nome}"?`)) {
      db.updateUser(user.id, { ativo: false });
      loadUsers();
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserTypeColor = (tipo: User['tipo']) => {
    switch (tipo) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'gerente':
        return 'bg-blue-100 text-blue-800';
      case 'vendedor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (tipo: User['tipo']) => {
    switch (tipo) {
      case 'administrador':
        return <Shield size={16} className="text-red-600" />;
      case 'gerente':
        return <UserCheck size={16} className="text-blue-600" />;
      case 'vendedor':
        return <Users size={16} className="text-green-600" />;
      default:
        return <Users size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users size={32} style={{ color: '#0d214f' }} />
              Gestão de Usuários
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
              Controle de usuários e permissões do sistema • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center gap-2 font-medium shadow-lg"
            style={{ backgroundColor: '#0d214f' }}
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Filtros */}
        <div className={`rounded-xl shadow-lg mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome, usuário ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Usuários</p>
                <p className="text-2xl font-bold" style={{ color: '#0d214f' }}>
                  {users.length}
                </p>
              </div>
              <Users className="text-blue-500" size={24} />
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.ativo).length}
                </p>
              </div>
              <UserCheck className="text-green-500" size={24} />
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Administradores</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.tipo === 'administrador' && u.ativo).length}
                </p>
              </div>
              <Shield className="text-red-500" size={24} />
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Vendedores</p>
                <p className="text-2xl font-bold" style={{ color: '#ea580c' }}>
                  {users.filter(u => u.tipo === 'vendedor' && u.ativo).length}
                </p>
              </div>
              <Users className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        {/* Cards de Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-6 rounded-xl shadow-lg border-l-4 transition-all hover:shadow-xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } ${user.ativo ? 'border-green-500' : 'border-red-500'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: user.ativo ? '#0d214f' : '#6b7280' }}
                  >
                    {getUserTypeIcon(user.tipo)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user.nome}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{user.usuario}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={user.ativo ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                    disabled={user.id === currentUser?.id}
                  >
                    {user.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-red-600 hover:text-red-800"
                    disabled={user.id === currentUser?.id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.tipo)}`}>
                    {getUserTypeIcon(user.tipo)}
                    <span className="ml-1 capitalize">{user.tipo}</span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                {user.id === currentUser?.id && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center">
                    Usuário Atual
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Criado em {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela Detalhada */}
        <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold">Todos os Usuários</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Login</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Criado em</th>
                  <th className="px-6 py-4 text-center text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: user.ativo ? '#0d214f' : '#6b7280' }}
                        >
                          {getUserTypeIcon(user.tipo)}
                        </div>
                        <div>
                          <p className="font-medium">{user.nome}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-blue-600 font-medium">Você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">@{user.usuario}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.tipo)}`}>
                        {getUserTypeIcon(user.tipo)}
                        <span className="ml-1 capitalize">{user.tipo}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.ativo ? <UserCheck size={12} className="mr-1" /> : <UserX size={12} className="mr-1" />}
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={user.ativo ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-800"
                          disabled={user.id === currentUser?.id}
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

        {/* Modal */}
        {showModal && (
          <UserModal
            user={editingUser}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingUser(null);
            }}
          />
        )}

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Gestão de Usuários • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersScreen;