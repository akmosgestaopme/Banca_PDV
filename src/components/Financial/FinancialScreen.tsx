import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, FileText, Calendar, Clock, Search, Filter, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, Edit, Trash2, Download, Printer, Repeat, CreditCard, Banknote, Smartphone, Receipt, ArrowRight, ArrowLeft, Tag, Package, Building } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/database';
import { Expense } from '../../types';
import { format, isToday, isYesterday, parseISO, startOfDay, endOfDay, subDays, isAfter, isBefore, addDays, isSameDay, isFuture, isPast, isThisMonth, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExpenseModal from './ExpenseModal';
import jsPDF from 'jspdf';

const FinancialScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user } = useAuth();
  
  // Estados para dados
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'overdue'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'variable'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'description'>('date');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    
    try {
      const allExpenses = db.getAllExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = (expenseData: Omit<Expense, 'id' | 'criadoEm'>) => {
    if (!user) return;
    
    const newExpense = db.createExpense({
      ...expenseData,
      usuarioId: user.id
    });
    
    setExpenses([...expenses, newExpense]);
    setShowExpenseModal(false);
  };

  const handleUpdateExpense = (expenseData: Omit<Expense, 'id' | 'criadoEm'>) => {
    if (!editingExpense) return;
    
    db.updateExpense(editingExpense.id, expenseData);
    
    setExpenses(expenses.map(e => 
      e.id === editingExpense.id ? { ...e, ...expenseData } : e
    ));
    
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (confirm(`Deseja excluir a despesa "${expense.descricao}"?`)) {
      db.deleteExpense(expense.id);
      setExpenses(expenses.filter(e => e.id !== expense.id));
    }
  };

  const handlePayExpense = (expense: Expense) => {
    if (!expense.pago) {
      const today = new Date().toISOString().split('T')[0];
      
      db.updateExpense(expense.id, {
        pago: true,
        dataPagamento: today
      });
      
      setExpenses(expenses.map(e => 
        e.id === expense.id 
          ? { ...e, pago: true, dataPagamento: today } 
          : e
      ));
    }
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
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else if (isSameDay(date, addDays(new Date(), 1))) {
      return 'Amanhã';
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      // Filtro por texto
      const matchesSearch = 
        expense.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.observacoes && expense.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por status
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'paid' && expense.pago) ||
        (statusFilter === 'pending' && !expense.pago);
      
      // Filtro por tipo
      const matchesType = 
        typeFilter === 'all' || 
        (typeFilter === 'fixed' && expense.categoria === 'fixa') ||
        (typeFilter === 'variable' && expense.categoria === 'variavel');
      
      // Filtro por data
      const vencimento = parseISO(expense.dataVencimento);
      let matchesDate = true;
      
      if (dateFilter === 'today') {
        matchesDate = isToday(vencimento);
      } else if (dateFilter === 'tomorrow') {
        matchesDate = isSameDay(vencimento, addDays(new Date(), 1));
      } else if (dateFilter === 'week') {
        matchesDate = isThisWeek(vencimento);
      } else if (dateFilter === 'month') {
        matchesDate = isThisMonth(vencimento);
      } else if (dateFilter === 'overdue') {
        matchesDate = isPast(vencimento) && !expense.pago;
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
      } else if (sortBy === 'value') {
        return b.valor - a.valor;
      } else {
        return a.descricao.localeCompare(b.descricao);
      }
    });
  };

  const filteredExpenses = getFilteredExpenses();
  
  // Calcular totais
  const totalPendente = filteredExpenses
    .filter(e => !e.pago)
    .reduce((sum, e) => sum + e.valor, 0);
    
  const totalPago = filteredExpenses
    .filter(e => e.pago)
    .reduce((sum, e) => sum + e.valor, 0);
    
  const totalGeral = totalPendente + totalPago;
  
  // Despesas vencidas
  const despesasVencidas = expenses.filter(e => 
    !e.pago && isPast(parseISO(e.dataVencimento)) && !isToday(parseISO(e.dataVencimento))
  );
  
  // Despesas para hoje
  const despesasHoje = expenses.filter(e => 
    !e.pago && isToday(parseISO(e.dataVencimento))
  );
  
  // Despesas para amanhã
  const despesasAmanha = expenses.filter(e => 
    !e.pago && isSameDay(parseISO(e.dataVencimento), addDays(new Date(), 1))
  );
  
  // Despesas recorrentes
  const despesasRecorrentes = expenses.filter(e => e.recorrente);

  const generateExpensesPDF = async () => {
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
      doc.text('RELATÓRIO DE DESPESAS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Resumo
      doc.setFontSize(12);
      doc.text('RESUMO FINANCEIRO', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Total Pendente: ${formatCurrency(totalPendente)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Pago: ${formatCurrency(totalPago)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Geral: ${formatCurrency(totalGeral)}`, 20, yPosition);
      yPosition += 15;

      // Lista de despesas
      doc.setFontSize(12);
      doc.text('DESPESAS', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Descrição', 20, yPosition);
      doc.text('Vencimento', 90, yPosition);
      doc.text('Valor', 130, yPosition);
      doc.text('Status', 160, yPosition);
      yPosition += 6;
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 4;
      
      // Dados da tabela
      doc.setFont('helvetica', 'normal');
      filteredExpenses.forEach((expense) => {
        // Verificar se precisa de nova página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
          
          // Cabeçalho da tabela na nova página
          doc.setFont('helvetica', 'bold');
          doc.text('Descrição', 20, yPosition);
          doc.text('Vencimento', 90, yPosition);
          doc.text('Valor', 130, yPosition);
          doc.text('Status', 160, yPosition);
          yPosition += 6;
          
          // Linha separadora
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.line(20, yPosition, 190, yPosition);
          yPosition += 4;
          
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(expense.descricao, 20, yPosition);
        doc.text(format(parseISO(expense.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }), 90, yPosition);
        doc.text(formatCurrency(expense.valor), 130, yPosition);
        
        if (expense.pago) {
          doc.setTextColor(0, 128, 0); // Verde para pago
          doc.text('PAGO', 160, yPosition);
        } else {
          const vencimento = parseISO(expense.dataVencimento);
          if (isPast(vencimento) && !isToday(vencimento)) {
            doc.setTextColor(255, 0, 0); // Vermelho para vencido
            doc.text('VENCIDO', 160, yPosition);
          } else {
            doc.setTextColor(255, 165, 0); // Laranja para pendente
            doc.text('PENDENTE', 160, yPosition);
          }
        }
        
        doc.setTextColor(0, 0, 0); // Resetar cor
        yPosition += 8;
      });

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`despesas-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
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
                <DollarSign size={40} className="text-secondary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-secondary mb-3">Financeiro</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Controle de despesas e contas a pagar
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={generateExpensesPDF}
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
                    Relatório PDF
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="bg-secondary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-2xl transition-all hover:scale-105"
              >
                <Plus size={24} />
                Nova Despesa
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Pendente</p>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalPendente)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-orange-100">
                <Clock size={28} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredExpenses.filter(e => !e.pago).length} despesas pendentes
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Pago</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100">
                <CheckCircle size={28} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredExpenses.filter(e => e.pago).length} despesas pagas
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Geral</p>
                <p className="text-3xl font-bold text-secondary">{formatCurrency(totalGeral)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary/10">
                <DollarSign size={28} className="text-secondary" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredExpenses.length} despesas no total
              </p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Vencidas</h3>
                <p className="text-sm text-gray-500">Despesas em atraso</p>
              </div>
            </div>
            
            {despesasVencidas.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {despesasVencidas.slice(0, 3).map(despesa => (
                  <div key={despesa.id} className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{despesa.descricao}</span>
                      <span className="font-bold text-red-600">{formatCurrency(despesa.valor)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Vencimento: {formatDate(despesa.dataVencimento)}</span>
                      <button 
                        onClick={() => handlePayExpense(despesa)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                ))}
                
                {despesasVencidas.length > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    + {despesasVencidas.length - 3} despesas vencidas
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-gray-500">Nenhuma despesa vencida</p>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Hoje</h3>
                <p className="text-sm text-gray-500">Vencendo hoje</p>
              </div>
            </div>
            
            {despesasHoje.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {despesasHoje.slice(0, 3).map(despesa => (
                  <div key={despesa.id} className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{despesa.descricao}</span>
                      <span className="font-bold text-orange-600">{formatCurrency(despesa.valor)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Vencimento: Hoje</span>
                      <button 
                        onClick={() => handlePayExpense(despesa)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                ))}
                
                {despesasHoje.length > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    + {despesasHoje.length - 3} despesas para hoje
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-gray-500">Nenhuma despesa para hoje</p>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Amanhã</h3>
                <p className="text-sm text-gray-500">Vencendo amanhã</p>
              </div>
            </div>
            
            {despesasAmanha.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {despesasAmanha.slice(0, 3).map(despesa => (
                  <div key={despesa.id} className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{despesa.descricao}</span>
                      <span className="font-bold text-blue-600">{formatCurrency(despesa.valor)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Vencimento: Amanhã</span>
                      <button 
                        onClick={() => handlePayExpense(despesa)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                ))}
                
                {despesasAmanha.length > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    + {despesasAmanha.length - 3} despesas para amanhã
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-gray-500">Nenhuma despesa para amanhã</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar despesas..."
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
                  <option value="all">Todas as datas</option>
                  <option value="today">Hoje</option>
                  <option value="tomorrow">Amanhã</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="overdue">Vencidas</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Todos os status</option>
                  <option value="pending">Pendentes</option>
                  <option value="paid">Pagas</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-gray-500" />
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
                  <option value="fixed">Fixas</option>
                  <option value="variable">Variáveis</option>
                </select>
              </div>
              
              <button
                onClick={loadExpenses}
                className={`p-3 rounded-xl transition-all hover:scale-110 ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title="Atualizar"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Despesas */}
        <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={24} className="text-secondary" />
                Despesas
              </h3>
              
              <div className="flex items-center gap-3">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filteredExpenses.length} despesas encontradas
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={generateExpensesPDF}
                    disabled={isGeneratingPdf}
                    className="bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {filteredExpenses.length > 0 ? (
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Descrição</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Vencimento</th>
                    <th className="px-6 py-4 text-right text-sm font-bold">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Pagamento</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredExpenses.map((expense) => {
                    const vencimento = parseISO(expense.dataVencimento);
                    const vencido = isPast(vencimento) && !isToday(vencimento) && !expense.pago;
                    const venceHoje = isToday(vencimento) && !expense.pago;
                    
                    const statusClass = expense.pago 
                      ? 'bg-green-100 text-green-800' 
                      : vencido 
                        ? 'bg-red-100 text-red-800' 
                        : venceHoje 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800';
                    
                    const statusIcon = expense.pago 
                      ? <CheckCircle size={12} className="mr-1" />
                      : vencido 
                        ? <XCircle size={12} className="mr-1" />
                        : venceHoje 
                          ? <Clock size={12} className="mr-1" />
                          : <Calendar size={12} className="mr-1" />;
                    
                    const statusText = expense.pago 
                      ? 'Pago' 
                      : vencido 
                        ? 'Vencido' 
                        : venceHoje 
                          ? 'Vence hoje' 
                          : 'A vencer';
                    
                    const paymentMethodLabel = expense.pago && expense.formaPagamento ? {
                      'dinheiro': 'Dinheiro',
                      'cartao_debito': 'Cartão Débito',
                      'cartao_credito': 'Cartão Crédito',
                      'pix': 'PIX',
                      'cheque': 'Cheque',
                      'transferencia': 'Transferência'
                    }[expense.formaPagamento] : '-';
                    
                    const paymentMethodIcon = expense.pago && expense.formaPagamento ? {
                      'dinheiro': <Banknote size={14} className="text-green-600" />,
                      'cartao_debito': <CreditCard size={14} className="text-blue-600" />,
                      'cartao_credito': <CreditCard size={14} className="text-purple-600" />,
                      'pix': <Smartphone size={14} className="text-cyan-600" />,
                      'cheque': <Receipt size={14} className="text-yellow-600" />,
                      'transferencia': <CreditCard size={14} className="text-indigo-600" />
                    }[expense.formaPagamento] : null;
                    
                    return (
                      <tr key={expense.id} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              expense.categoria === 'fixa' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              {expense.categoria === 'fixa' ? (
                                <Repeat size={20} className="text-blue-600" />
                              ) : (
                                <TrendingDown size={20} className="text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{expense.descricao}</p>
                              {expense.recorrente && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Recorrente
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm capitalize">{expense.categoria}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col">
                            <span>{formatDate(expense.dataVencimento)}</span>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(expense.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {formatCurrency(expense.valor)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                            {statusIcon}
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {expense.pago && expense.dataPagamento ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                {paymentMethodIcon}
                                <span>{paymentMethodLabel}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {format(parseISO(expense.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {!expense.pago && (
                              <button
                                onClick={() => handlePayExpense(expense)}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                                title="Marcar como pago"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setShowExpenseModal(true);
                              }}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhuma despesa encontrada</p>
                <p className="text-sm text-gray-500">
                  {searchTerm || dateFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Cadastre sua primeira despesa'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showExpenseModal && (
          <ExpenseModal
            expense={editingExpense}
            onSave={editingExpense ? handleUpdateExpense : handleCreateExpense}
            onClose={() => {
              setShowExpenseModal(false);
              setEditingExpense(null);
            }}
          />
        )}

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Controle Financeiro • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialScreen;