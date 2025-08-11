import React, { useState } from 'react';
import { X, Download, Calendar, FileText, TrendingUp, TrendingDown, Printer, Filter, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { CashRegister, CashSession, CashMovement } from '../../types';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isWithinInterval, subDays, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { useTheme } from '../../hooks/useTheme';

interface CashReportModalProps {
  cashRegisters: CashRegister[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  onClose: () => void;
}

const CashReportModal: React.FC<CashReportModalProps> = ({ 
  cashRegisters, 
  cashSessions, 
  cashMovements, 
  onClose 
}) => {
  const { theme } = useTheme();
  const [reportType, setReportType] = useState<'daily' | 'custom' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState(subDays(new Date(), 7).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCash, setSelectedCash] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const getFilteredData = () => {
    let startDateObj: Date;
    let endDateObj: Date;

    if (reportType === 'daily') {
      startDateObj = startOfDay(new Date(selectedDate));
      endDateObj = endOfDay(new Date(selectedDate));
    } else if (reportType === 'monthly') {
      startDateObj = startOfMonth(new Date(selectedMonth));
      endDateObj = endOfMonth(new Date(selectedMonth));
    } else {
      startDateObj = startOfDay(new Date(startDate));
      endDateObj = endOfDay(new Date(endDate));
    }

    const filteredMovements = cashMovements.filter(movement => {
      const movementDate = new Date(movement.data);
      const dateMatch = isWithinInterval(movementDate, { start: startDateObj, end: endDateObj });
      const cashMatch = selectedCash === '' || movement.caixaId === selectedCash;
      return dateMatch && cashMatch;
    });

    const filteredSessions = cashSessions.filter(session => {
      const sessionDate = new Date(session.dataAbertura);
      const dateMatch = isWithinInterval(sessionDate, { start: startDateObj, end: endDateObj });
      const cashMatch = selectedCash === '' || session.caixaId === selectedCash;
      return dateMatch && cashMatch;
    });

    return { filteredMovements, filteredSessions, startDateObj, endDateObj };
  };

  const formatDate = (dateString: string, showTime = true) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return showTime 
        ? `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`
        : 'Hoje';
    } else if (isYesterday(date)) {
      return showTime 
        ? `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`
        : 'Ontem';
    } else {
      return showTime 
        ? format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
        : format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const { filteredMovements, filteredSessions, startDateObj, endDateObj } = getFilteredData();
      
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
      doc.text('RELATÓRIO DE MOVIMENTAÇÃO DE CAIXA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      const periodText = reportType === 'daily' 
        ? `Período: ${format(startDateObj, 'dd/MM/yyyy', { locale: ptBR })}`
        : reportType === 'monthly'
          ? `Período: ${format(startDateObj, 'MMMM/yyyy', { locale: ptBR })}`
          : `Período: ${format(startDateObj, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDateObj, 'dd/MM/yyyy', { locale: ptBR })}`;
      doc.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      if (selectedCash) {
        const cashName = cashRegisters.find(c => c.id === selectedCash)?.nome || 'N/A';
        doc.text(`Caixa: ${cashName}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }

      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Resumo
      const totalEntradas = filteredMovements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
      const totalSaidas = filteredMovements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
      const saldoLiquido = totalEntradas - totalSaidas;

      doc.setFontSize(14);
      doc.text('RESUMO FINANCEIRO', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total de Entradas: R$ ${totalEntradas.toFixed(2)}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total de Saídas: R$ ${totalSaidas.toFixed(2)}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Saldo Líquido: R$ ${saldoLiquido.toFixed(2)}`, 20, yPosition);
      yPosition += 15;

      // Sessões
      if (filteredSessions.length > 0) {
        doc.setFontSize(14);
        doc.text('SESSÕES DE CAIXA', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(8);
        filteredSessions.forEach(session => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${session.caixa} - ${session.usuario}`, 20, yPosition);
          doc.text(`Abertura: ${format(new Date(session.dataAbertura), 'dd/MM HH:mm', { locale: ptBR })}`, 20, yPosition + 4);
          if (session.dataFechamento) {
            doc.text(`Fechamento: ${format(new Date(session.dataFechamento), 'dd/MM HH:mm', { locale: ptBR })}`, 20, yPosition + 8);
          }
          doc.text(`Vl. Abertura: R$ ${session.valorAbertura.toFixed(2)}`, 120, yPosition);
          if (session.valorFechamento) {
            doc.text(`Vl. Fechamento: R$ ${session.valorFechamento.toFixed(2)}`, 120, yPosition + 4);
          }
          doc.text(`Status: ${session.status}`, 120, yPosition + 8);
          yPosition += 15;
        });
      }

      // Movimentações
      if (filteredMovements.length > 0) {
        yPosition += 10;
        doc.setFontSize(14);
        doc.text('MOVIMENTAÇÕES DETALHADAS', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(8);
        filteredMovements.forEach(movement => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          const cashName = cashRegisters.find(c => c.id === movement.caixaId)?.nome || 'N/A';
          doc.text(`${format(new Date(movement.data), 'dd/MM HH:mm', { locale: ptBR })}`, 20, yPosition);
          doc.text(`${cashName}`, 50, yPosition);
          doc.text(`${movement.categoria}`, 80, yPosition);
          doc.text(`${movement.descricao}`, 110, yPosition);
          doc.text(`${movement.tipo === 'entrada' ? '+' : '-'}R$ ${movement.valor.toFixed(2)}`, 160, yPosition);
          yPosition += 5;
        });
      }

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`relatorio-caixa-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const { filteredMovements } = getFilteredData();
  const totalEntradas = filteredMovements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
  const totalSaidas = filteredMovements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
  const saldoLiquido = totalEntradas - totalSaidas;

  // Agrupar por categorias
  const getCategoriesData = () => {
    const categories: { [key: string]: { entrada: number, saida: number } } = {};
    
    filteredMovements.forEach(movement => {
      if (!categories[movement.categoria]) {
        categories[movement.categoria] = { entrada: 0, saida: 0 };
      }
      
      if (movement.tipo === 'entrada') {
        categories[movement.categoria].entrada += movement.valor;
      } else {
        categories[movement.categoria].saida += movement.valor;
      }
    });
    
    return Object.entries(categories).map(([name, values]) => ({
      name,
      entrada: values.entrada,
      saida: values.saida,
      saldo: values.entrada - values.saida
    })).sort((a, b) => b.saldo - a.saldo);
  };

  // Agrupar por forma de pagamento
  const getPaymentMethodsData = () => {
    const methods: { [key: string]: number } = {};
    
    filteredMovements.forEach(movement => {
      if (!methods[movement.formaPagamento]) {
        methods[movement.formaPagamento] = 0;
      }
      methods[movement.formaPagamento] += movement.valor;
    });
    
    return Object.entries(methods).map(([method, value]) => ({
      method,
      value,
      percentage: (value / (totalEntradas + totalSaidas)) * 100
    })).sort((a, b) => b.value - a.value);
  };

  const categoriesData = getCategoriesData();
  const paymentMethodsData = getPaymentMethodsData();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            Relatórios de Caixa
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              Tipo de Relatório
            </label>
            <div className="space-y-2">
              <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                reportType === 'daily'
                  ? 'border-primary bg-primary/10'
                  : theme === 'dark' 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="daily"
                  checked={reportType === 'daily'}
                  onChange={() => setReportType('daily')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    reportType === 'daily'
                      ? 'bg-primary text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Calendar size={16} />
                  </div>
                  <span className="font-medium">Diário</span>
                </div>
              </label>
              
              <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                reportType === 'monthly'
                  ? 'border-primary bg-primary/10'
                  : theme === 'dark' 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="monthly"
                  checked={reportType === 'monthly'}
                  onChange={() => setReportType('monthly')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    reportType === 'monthly'
                      ? 'bg-primary text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Calendar size={16} />
                  </div>
                  <span className="font-medium">Mensal</span>
                </div>
              </label>
              
              <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                reportType === 'custom'
                  ? 'border-primary bg-primary/10'
                  : theme === 'dark' 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="reportType"
                  value="custom"
                  checked={reportType === 'custom'}
                  onChange={() => setReportType('custom')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    reportType === 'custom'
                      ? 'bg-primary text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Calendar size={16} />
                  </div>
                  <span className="font-medium">Personalizado</span>
                </div>
              </label>
            </div>
          </div>

          {/* Seleção de Data */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-bold mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              {reportType === 'daily' ? 'Data' : reportType === 'monthly' ? 'Mês/Ano' : 'Período'}
            </label>
            
            {reportType === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                }`}
              />
            )}
            
            {reportType === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                }`}
              />
            )}
            
            {reportType === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Caixa e Botão Gerar */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-gray-500" />
                Caixa
              </label>
              <select
                value={selectedCash}
                onChange={(e) => setSelectedCash(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                }`}
              >
                <option value="">Todos os caixas</option>
                {cashRegisters.map(register => (
                  <option key={register.id} value={register.id}>
                    {register.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full bg-primary text-white py-3 px-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Gerar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${
            theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Total de Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalEntradas)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${
            theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Total de Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalSaidas)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${
            saldoLiquido >= 0 
              ? theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
              : theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  saldoLiquido >= 0 
                    ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  Saldo Líquido
                </p>
                <p className={`text-2xl font-bold ${
                  saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {formatCurrency(saldoLiquido)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                saldoLiquido >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <Calendar className={saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'} size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos e Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Categorias */}
          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Movimentações por Categoria
              </h3>
            </div>
            
            {categoriesData.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {categoriesData.map((category, index) => (
                  <div key={category.name} className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{category.name}</span>
                      <span className={`font-bold ${
                        category.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(category.saldo)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Entradas:</span>
                        <span className="text-green-600">{formatCurrency(category.entrada)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Saídas:</span>
                        <span className="text-red-600">{formatCurrency(category.saida)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </div>
          
          {/* Formas de Pagamento */}
          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PieChart size={20} className="text-primary" />
                Formas de Pagamento
              </h3>
            </div>
            
            {paymentMethodsData.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {paymentMethodsData.map((method, index) => {
                  const methodLabel = {
                    'dinheiro': 'Dinheiro',
                    'cartao_debito': 'Cartão Débito',
                    'cartao_credito': 'Cartão Crédito',
                    'pix': 'PIX',
                    'cheque': 'Cheque',
                    'transferencia': 'Transferência'
                  }[method.method] || method.method;
                  
                  return (
                    <div key={method.method} className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{methodLabel}</span>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(method.value)}</span>
                          <span className="text-xs text-gray-500 ml-2">({method.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="p-6 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Movimentações do Período
              </h3>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Imprimir
                    window.print();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1 text-sm font-medium"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                
                <button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                >
                  {isGenerating ? (
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
          
          <div className="overflow-x-auto max-h-96">
            {filteredMovements.length > 0 ? (
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} sticky top-0`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Caixa</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Categoria</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Descrição</th>
                    <th className="px-4 py-3 text-right text-sm font-bold">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Usuário</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className={`hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(movement.data)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {cashRegisters.find(c => c.id === movement.caixaId)?.nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          movement.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.tipo === 'entrada' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                          {movement.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{movement.categoria}</td>
                      <td className="px-4 py-3 text-sm">{movement.descricao}</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${
                        movement.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.tipo === 'entrada' ? '+' : '-'}{formatCurrency(movement.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm">{movement.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium">Nenhuma movimentação encontrada no período selecionado</p>
                <p className="text-sm text-gray-400 mt-2">Tente selecionar outro período ou caixa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashReportModal;