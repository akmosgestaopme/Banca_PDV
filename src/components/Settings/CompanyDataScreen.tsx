import React, { useState, useEffect } from 'react';
import { Building, Save, Upload, MapPin, Phone, Mail, FileText, Globe, Hash } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface CompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
  logo: string;
  observacoes: string;
}

const CompanyDataScreen: React.FC = () => {
  const { theme } = useTheme();
  const [companyData, setCompanyData] = useState<CompanyData>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    website: '',
    logo: '',
    observacoes: ''
  });

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = () => {
    const savedData = localStorage.getItem('company_data');
    if (savedData) {
      setCompanyData(JSON.parse(savedData));
    }
  };

  const handleSave = () => {
    localStorage.setItem('company_data', JSON.stringify(companyData));
    alert('Dados da empresa salvos com sucesso!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCompanyData(prev => ({ ...prev, logo: result }));
        localStorage.setItem('company_logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building size={32} style={{ color: '#0d214f' }} />
            Dados da Empresa
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
            Configure as informações da sua empresa • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
          <div className={`mt-4 p-4 rounded-lg border-l-4 border-blue-500 ${
            theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
          }`}>
            <p className="text-sm">
              ℹ️ <strong>Informação:</strong> Todos os campos são opcionais. Preencha apenas as informações que desejar exibir no sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logo da Empresa */}
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload size={24} style={{ color: '#ea580c' }} />
              Logo da Empresa
            </h3>
            
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-6 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                {companyData.logo ? (
                  <img src={companyData.logo} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <Building size={64} className="text-gray-400" />
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl hover:opacity-90 cursor-pointer font-medium text-white"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Upload size={20} />
                Escolher Logo
              </label>
              <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                PNG, JPG até 2MB. Recomendado: 400x400px
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className={`lg:col-span-2 p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileText size={24} style={{ color: '#0d214f' }} />
              Informações da Empresa
            </h3>

            <div className="space-y-6">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Razão Social</label>
                  <input
                    type="text"
                    value={companyData.razaoSocial}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="Ex: Banca de Jornal ABC Ltda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome Fantasia
                    <span className="text-xs text-blue-500 ml-2">(aparecerá no PDV)</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.nomeFantasia}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="Ex: Banca do João"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CNPJ</label>
                  <input
                    type="text"
                    value={companyData.cnpj}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={companyData.inscricaoEstadual}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, inscricaoEstadual: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="000.000.000.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Inscrição Municipal</label>
                  <input
                    type="text"
                    value={companyData.inscricaoMunicipal}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, inscricaoMunicipal: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="000000000"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Endereço
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Logradouro</label>
                    <input
                      type="text"
                      value={companyData.endereco}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, endereco: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="Ex: Rua das Flores"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Número</label>
                    <input
                      type="text"
                      value={companyData.numero}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, numero: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Complemento</label>
                    <input
                      type="text"
                      value={companyData.complemento}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, complemento: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="Sala 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro</label>
                    <input
                      type="text"
                      value={companyData.bairro}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, bairro: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade</label>
                    <input
                      type="text"
                      value={companyData.cidade}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, cidade: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="São Paulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={companyData.estado}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, estado: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CEP</label>
                    <input
                      type="text"
                      value={companyData.cep}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Phone size={20} />
                  Contato
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    <input
                      type="text"
                      value={companyData.telefone}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={companyData.website}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={companyData.observacoes}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  rows={4}
                  placeholder="Informações adicionais sobre a empresa..."
                />
              </div>

              {/* Botão Salvar */}
              <div className="border-t pt-6">
                <button
                  onClick={handleSave}
                  className="w-full text-white py-4 px-6 rounded-xl hover:opacity-90 flex items-center justify-center gap-3 font-medium text-lg"
                  style={{ backgroundColor: '#0d214f' }}
                >
                  <Save size={24} />
                  Salvar Dados da Empresa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Dados da Empresa • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyDataScreen;