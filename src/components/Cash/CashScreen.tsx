import React, { useState, useEffect } from 'react';
import { Calculator, Plus, TrendingUp, TrendingDown, DollarSign, Clock, Calendar, Users, Package, FileText, Download, Printer, RefreshCw, Search, Filter, Eye, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Building, Banknote, CreditCard, Smartphone, Receipt, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/database';
import { CashRegister, CashSession, CashMovement } from '../../types';
import { format, isToday, isYesterday, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashRegisterModal from './CashRegisterModal';
import CashSessionModal from './CashSessionModal';
import CashMovementModal from './CashMovementModal';
import CashReportModal from './CashReportModal';
import jsPDF from 'jspdf';

const CashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user } = useAuth();
  
  // Estados para dados
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para modais
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [isClosingSession, setIsClosingSession] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const registers = db.getAllCashRegisters();
      const sessions = db.getAllCashSessions();
      const movements = db.getAllCashMovements();
      
      setCashRegisters(registers);
      setCashSessions(sessions);
      setCashMovements(movements);
      
      // Encontrar sessão atual do usuário
      const userCurrentSession = sessions.find(s => 
        s.usuarioId === user?.id && s.status === 'aberto'
      );
      setCurrentSession(userCurrentSession || null);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRegister = (registerData: Omit<CashRegister, 'id' | 'criadoEm'>) => {
    const newRegister = db.createCashRegister(registerData);
    setCashRegisters([...cashRegisters, newRegister]);
    setShowRegisterModal(false);
  };

  const handleUpdateRegister = (registerData: Omit<CashRegister, 'id' | 'criadoEm'>) => {
    if (!editingRegister) return;
    
    db.updateCashRegister(editingRegister.id, registerData);
    setCashRegisters(cashRegisters.map(r => 
      r.id === editingRegister.id ? { ...r, ...registerData } : r
    ));
    setShowRegisterModal(false);
    setEditingRegister(null);
  };

  const handleOpenCash = (sessionData: any) => {
    if (!user) return;
    
    const newSession = db.openCashSession({
      ...sessionData,
      usuarioId: user.id,
      usuario: user.nome
    });
    
    setCashSessions([...cashSessions, newSession]);
    setCurrentSession(newSession);
    setShowSessionModal(false);
    loadData();
  };

  const handleCloseCash = (closingData: any) => {
    if (!currentSession) return;
    
    db.closeCashSession(currentSession.id, closingData.valorFechamento, closingData.observacoesFechamento);
    setCurrentSession(null);
    setShowSessionModal(false);
    setIsClosingSession(false);
    loadData();
  };

  const handleCreateMovement = (movementData: any) => {
    if (!user) return;
    
    const newMovement = db.createCashMovement({
      ...movementData,
      usuarioId: user.id,
      usuario: user.nome,
      sessaoId: currentSession?.id
    });
    
    setCashMovements([...cashMovements, newMovement]);
    setShowMovementModal(false);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  const getFilteredMovements = () => {
    let filtered = cashMovements;
    
    // Filtro por data
    if (dateFilter !== 'all') {
      const today = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(today);
          filtered = filtered.filter(m => {
            const movDate = parseISO(m.data);
            return movDate >= startDate && movDate <= endOfDay(today);
          });
          break;
        case 'yesterday':
          const yesterday = subDays(today, 1);
          startDate = startOfDay(yesterday);
          filtered = filtered.filter(m => {
            const movDate = parseISO(m.data);
            return movDate >= startDate && movDate <= endOfDay(yesterday);
          });
          break;
        case 'week':
          startDate = subDays(today, 7);
          filtered = filtered.filter(m => {
            const movDate = parseISO(m.data);
            return movDate >= startDate;
          });
          break;
      }
    }
    
    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.tipo === typeFilter);
    }
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.usuario.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  };

  const filteredMovements = getFilteredMovements();
  
  // Calcular totais
  const totalEntradas = filteredMovements
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.valor, 0);
    
  const totalSaidas = filteredMovements
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + m.valor, 0);
    
  const saldoLiquido = totalEntradas - totalSaidas;

  // Função para imprimir
  const handlePrint = () => {
    setIsPrinting(true);
    
    // Criar conteúdo para impressão
    const printContent = `
      <html>
        <head>
          <title>Relatório de Movimentações - ${format(new Date(), 'dd/MM/yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary-item { display: inline-block; margin: 0 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .entrada { color: #10b981; }
            .saida { color: #ef4444; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Movimentações de Caixa</h1>
            <p>Data: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            <p>Usuário: ${user?.nome}</p>
          </div>
          
          <div class="summary">
            <h3>Resumo Financeiro</h3>
            <div class="summary-item">
              <strong>Total de Entradas:</strong> ${formatCurrency(totalEntradas)}
            </div>
            <div class="summary-item">
              <strong>Total de Saídas:</strong> ${formatCurrency(totalSaidas)}
            </div>
            <div class="summary-item">
              <strong>Saldo Líquido:</strong> ${formatCurrency(saldoLiquido)}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMovements.map(movement => `
                <tr>
                  <td>${formatDate(movement.data)}</td>
                  <td class="${movement.tipo}">${movement.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                  <td>${movement.categoria}</td>
                  <td>${movement.descricao}</td>
                  <td class="${movement.tipo}">${formatCurrency(movement.valor)}</td>
                  <td>${movement.usuario}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px;">
            <p>Powered by CYBERPIU</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    
    setIsPrinting(false);
  };

  // Função para gerar PDF
  const generatePDF = async () => {
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
      doc.text('RELATÓRIO DE MOVIMENTAÇÕES DE CAIXA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`Usuário: ${user?.nome}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      yPosition += 20;

      // Resumo
      doc.setFontSize(12);
      doc.text('RESUMO FINANCEIRO', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Total de Entradas: ${formatCurrency(totalEntradas)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total de Saídas: ${formatCurrency(totalSaidas)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Saldo Líquido: ${formatCurrency(saldoLiquido)}`, 20, yPosition);
      yPosition += 15;

      // Lista de movimentações
      doc.setFontSize(12);
      doc.text('MOVIMENTAÇÕES', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Data/Hora', 20, yPosition);
      doc.text('Tipo', 60, yPosition);
      doc.text('Categoria', 85, yPosition);
      doc.text('Descrição', 115, yPosition);
      doc.text('Valor', 160, yPosition);
      yPosition += 6;
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 4;
      
      // Dados da tabela
      doc.setFont('helvetica', 'normal');
      filteredMovements.forEach((movement) => {
        // Verificar se precisa de nova página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(format(parseISO(movement.data), 'dd/MM HH:mm', { locale: ptBR }), 20, yPosition);
        doc.text(movement.tipo === 'entrada' ? 'Entrada' : 'Saída', 60, yPosition);
        doc.text(movement.categoria, 85, yPosition);
        doc.text(movement.descricao, 115, yPosition);
        doc.text(formatCurrency(movement.valor), 160, yPosition);
        yPosition += 6;
      });

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`movimentacoes-caixa-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
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
                <Calculator size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Controle de Caixa</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gerencie sessões de caixa e movimentações financeiras
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={loadData}
                disabled={isLoading}
                className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } shadow-lg`}
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                Atualizar
              </button>
              
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
              >
                <Plus size={24} />
                Novo Caixa
              </button>
            </div>
          </div>
        </div>

        {/* Status do Caixa Atual */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${
          currentSession 
            ? theme === 'dark' ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
            : theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                currentSession ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Calculator size={32} className="text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${
                  currentSession ? 'text-green-700' : 'text-red-700'
                }`}>
                  {currentSession ? 'Caixa Aberto' : 'Caixa Fechado'}
                </h3>
                <p className={`${
                  currentSession 
                    ? theme === 'dark' ? 'text-green-300' : 'text-green-600'
                    : theme === 'dark' ? 'text-red-300' : 'text-red-600'
                }`}>
                  {currentSession 
                    ? `${currentSession.caixa} - Aberto em ${format(parseISO(currentSession.dataAbertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
                    : 'Nenhum caixa está aberto no momento'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              {currentSession ? (
                <button
                  onClick={() => {
                    setIsClosingSession(true);
                    setShowSessionModal(true);
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 flex items-center gap-2 font-medium"
                >
                  <XCircle size={20} />
                  Fechar Caixa
                </button>
              ) : (
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 font-medium"
                >
                  <CheckCircle size={20} />
                  Abrir Caixa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Entradas</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100">
                <TrendingUp size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Saídas</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-100">
                <TrendingDown size={28} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Saldo Líquido</p>
                <p className={`text-3xl font-bold ${saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(saldoLiquido)}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                saldoLiquido >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <DollarSign size={28} className={saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'} />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center gap-2 font-medium transition-all hover:scale-105"
            >
              <FileText size={20} />
              Relatórios
            </button>
            
            <button
              onClick={() => {
                setMovementType('entrada');
                setShowMovementModal(true);
              }}
              disabled={!currentSession}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp size={20} />
              Nova Entrada
            </button>
            
            <button
              onClick={() => {
                setMovementType('saida');
                setShowMovementModal(true);
              }}
              disabled={!currentSession}
              className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 flex items-center gap-2 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingDown size={20} />
              Nova Saída
            </button>
            
            <button
              onClick={handlePrint}
              disabled={isPrinting || filteredMovements.length === 0}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isPrinting ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Imprimindo...
                </>
              ) : (
                <>
                  <Printer size={20} />
                  Imprimir
                </>
              )}
            </button>
            
            <button
              onClick={generatePDF}
              disabled={isGeneratingPdf || filteredMovements.length === 0}
              className="bg-secondary text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center gap-2 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Relatório PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={`p-6 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar movimentações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
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
                <Calendar size={20} className="text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="today">Hoje</option>
                  <option value="yesterday">Ontem</option>
                  <option value="week">Última semana</option>
                  <option value="all">Todas as datas</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Caixas */}
        <div className={`rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building size={24} className="text-primary" />
              Caixas Cadastrados
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cashRegisters.map(register => {
                const activeSessions = cashSessions.filter(s => 
                  s.caixaId === register.id && s.status === 'aberto'
                );
                
                return (
                  <div 
                    key={register.id}
                    className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                      activeSessions.length > 0
                        ? 'border-green-500 bg-green-50'
                        : theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          activeSessions.length > 0 ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          <Calculator size={24} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{register.nome}</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {register.descricao || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingRegister(register);
                            setShowRegisterModal(true);
                          }}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <span className={`text-sm font-bold ${
                          activeSessions.length > 0 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {activeSessions.length > 0 ? 'Aberto' : 'Fechado'}
                        </span>
                      </div>
                      
                      {activeSessions.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">Operador:</span>
                          <span className="text-sm font-bold">
                            {activeSessions[0].usuario}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={24} className="text-secondary" />
                Movimentações
              </h3>
              
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredMovements.length} movimentações encontradas
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            {filteredMovements.length > 0 ? (
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Data/Hora</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Descrição</th>
                    <th className="px-6 py-4 text-right text-sm font-bold">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Usuário</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(movement.data)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          movement.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.tipo === 'entrada' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                          {movement.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{movement.categoria}</td>
                      <td className="px-6 py-4 text-sm">{movement.descricao}</td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${
                        movement.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.tipo === 'entrada' ? '+' : '-'}{formatCurrency(movement.valor)}
                      </td>
                      <td className="px-6 py-4 text-sm">{movement.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</p>
                <p className="text-sm text-gray-500">
                  {searchTerm || dateFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Registre sua primeira movimentação'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modais */}
        {showRegisterModal && (
          <CashRegisterModal
            register={editingRegister}
            onSave={editingRegister ? handleUpdateRegister : handleCreateRegister}
            onClose={() => {
              setShowRegisterModal(false);
              setEditingRegister(null);
            }}
          />
        )}

        {showSessionModal && (
          <CashSessionModal
            cashRegisters={cashRegisters.filter(r => r.ativo)}
            session={currentSession}
            isClosing={isClosingSession}
            onSave={isClosingSession ? handleCloseCash : handleOpenCash}
            onClose={() => {
              setShowSessionModal(false);
              setIsClosingSession(false);
            }}
          />
        )}

        {showMovementModal && (
          <CashMovementModal
            type={movementType}
            cashRegisters={cashRegisters.filter(r => r.ativo)}
            currentCashId={currentSession?.caixaId}
            onSave={handleCreateMovement}
            onClose={() => setShowMovementModal(false)}
          />
        )}

        {showReportModal && (
          <CashReportModal
            cashRegisters={cashRegisters}
            cashSessions={cashSessions}
            cashMovements={cashMovements}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Controle de Caixa • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashScreen;