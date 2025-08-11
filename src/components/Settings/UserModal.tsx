import React, { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface UserModalProps {
  user?: UserType | null;
  onSave: (user: Omit<UserType, 'id' | 'criadoEm'>) => void;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    senha: '',
    confirmSenha: '',
    tipo: 'vendedor' as UserType['tipo'],
    ativo: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        usuario: user.usuario,
        senha: '',
        confirmSenha: '',
        tipo: user.tipo,
        ativo: user.ativo
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && formData.senha !== formData.confirmSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (!user && formData.senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    const userData: Omit<UserType, 'id' | 'criadoEm'> = {
      nome: formData.nome,
      usuario: formData.usuario,
      senha: formData.senha || user?.senha || '',
      tipo: formData.tipo,
      ativo: formData.ativo
    };

    onSave(userData);
  };

  const userTypes = [
    { value: 'vendedor', label: 'Vendedor', description: 'Acesso ao PDV e vendas' },
    { value: 'gerente', label: 'Gerente', description: 'Acesso a relatórios e gestão' },
    { value: 'administrador', label: 'Administrador', description: 'Acesso total ao sistema' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-8 w-full max-w-md shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <User size={28} style={{ color: '#0d214f' }} />
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nome Completo *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome de Usuário *</label>
            <input
              type="text"
              value={formData.usuario}
              onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value.toLowerCase() }))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Ex: joao.silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {user ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="Mínimo 6 caracteres"
                required={!user}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Senha *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmSenha}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmSenha: e.target.value }))}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  placeholder="Confirme a senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">Tipo de Usuário *</label>
            <div className="space-y-3">
              {userTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                    formData.tipo === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : theme === 'dark' 
                        ? 'border-gray-600 hover:border-gray-500' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={type.value}
                    checked={formData.tipo === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as UserType['tipo'] }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={
                        type.value === 'administrador' ? 'text-red-600' :
                        type.value === 'gerente' ? 'text-blue-600' : 'text-green-600'
                      } />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm">
              Usuário ativo
            </label>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 border py-3 px-6 rounded-xl font-medium ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90"
              style={{ backgroundColor: '#0d214f' }}
            >
              {user ? 'Atualizar' : 'Criar'} Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;