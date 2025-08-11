import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, Calendar, Clock, RefreshCw, Filter, Download, Zap, AlertTriangle, CheckCircle, XCircle, FileText, Truck, Tag, Eye, ArrowRight, ArrowLeft, Search, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/database';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [dashboardData, setDashboardData] = useState({
    totalVendas: 0,
    totalItens: 0,
    ticketMedio: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    saldoLiquido: 0,
    produtosMaisVendidos: [] as any[],
    vendasPorCategoria: [] as any[],
    vendasPorHora: [] as any[],
    vendasPorFormaPagamento: [] as any[],
    estoqueMinimo: [] as any[],
    ultimasVendas: [] as any[]
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Definir intervalo de datas
      let startDate: Date, endDate: Date;
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate = startOfDay(now);
          endDate = now;
          break;
        case 'yesterday':
          startDate = startOfDay(subDays(now, 1));
          endDate = endOfDay(subDays(now, 1));
          break;
        case 'week':
          startDate = startOfDay(subDays(now, 7));
          endDate = now;
          break;
        case 'month':
          startDate = startOfDay(subDays(now, 30));
          endDate = now;
          break;
        default:
          startDate = startOfDay(now);
          endDate = now;
      }
      
      // Buscar dados
      const sales = db.getAllSales().filter(sale => {
        const saleDate = new Date(sale.dataVenda);
        return !sale.cancelada && saleDate >= startDate && saleDate <= endDate;
      });
      
      const movements = db.getAllCashMovements().filter(movement => {
        const movementDate = new Date(movement.data);
        return movementDate >= startDate && movementDate <= endDate;
      });
      
      const products = db.getAllProducts();
      
      // Calcular métricas
      const totalVendas = sales.length;
      const totalItens = sales.reduce((sum, sale) => sum + sale.itens.reduce((itemSum, item) => itemSum + item.quantidade, 0), 0);
      const totalVendido = sales.reduce((sum, sale) => sum + sale.total, 0);
      const ticketMedio = totalVendas > 0 ? totalVendido / totalVendas : 0;
      
      const totalEntradas = movements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
      const totalSaidas = movements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
      const saldoLiquido = totalEntradas - totalSaidas;
      
      // Produtos mais vendidos
      const produtosVendidos = new Map<string, { id: string, nome: string, quantidade: number, total: number }>();
      
      sales.forEach(sale => {
        sale.itens.forEach(item => {
          const produtoId = item.produtoId;
          const produtoAtual = produtosVendidos.get(produtoId) || { 
            id: produtoId, 
            nome: item.produto.nome, 
            quantidade: 0, 
            total: 0 
          };
          
          produtosVendidos.set(produtoId, {
            ...produtoAtual,
            quantidade: produtoAtual.quantidade + item.quantidade,
            total: produtoAtual.total + item.total
          });
        });
      });
      
      const produtosMaisVendidos = Array.from(produtosVendidos.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
      
      // Vendas por categoria
      const categorias = new Map<string, number>();
      
      sales.forEach(sale => {
        sale.itens.forEach(item => {
          const categoria = item.produto.categoria;
          const valorAtual = categorias.get(categoria) || 0;
          categorias.set(categoria, valorAtual + item.total);
        });
      });
      
      const vendasPorCategoria = Array.from(categorias.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      // Vendas por hora
      const horasVenda = new Map<number, number>();
      
      for (let i = 0; i < 24; i++) {
        horasVenda.set(i, 0);
      }
      
      sales.forEach(sale => {
        const hora = new Date(sale.dataVenda).getHours();
        const valorAtual = horasVenda.get(hora) || 0;
        horasVenda.set(hora, valorAtual + sale.total);
      });
      
      const vendasPorHora = Array.from(horasVenda.entries())
        .map(([hour, value]) => ({ 
          hour: `${hour}h`, 
          value 
        }));
      
      // Vendas por forma de pagamento
      const formasPagamento = new Map<string, number>();
      
      sales.forEach(sale => {
        sale.pagamentos.forEach(pagamento => {
          const forma = pagamento.tipo;
          const valorAtual = formasPagamento.get(forma) || 0;
          formasPagamento.set(forma, valorAtual + pagamento.valor);
        });
      });
      
      const vendasPorFormaPagamento = Array.from(formasPagamento.entries())
        .map(([name, value]) => {
          const label = {
            'dinheiro': 'Dinheiro',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'pix': 'PIX',
            'vale': 'Vale'
          }[name] || name;
          
          return { name: label, value };
        })
        .sort((a, b) => b.value - a.value);
      
      // Produtos com estoque mínimo
      const estoqueMinimo = products
        .filter(p => p.estoque <= p.estoqueMinimo && p.ativo)
        .sort((a, b) => a.estoque - b.estoque)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          nome: p.nome,
          estoque: p.estoque,
          minimo: p.estoqueMinimo,
          percentual: p.estoque / p.estoqueMinimo * 100
        }));
      
      // Últimas vendas
      const ultimasVendas = sales
        .sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime())
        .slice(0, 5)
        .map(sale => ({
          id: sale.id,
          numero: sale.numero,
          data: sale.dataVenda,
          total: sale.total,
          itens: sale.itens.length,
          vendedor: sale.vendedor
        }));
      
      // Atualizar estado
      setDashboardData({
        totalVendas,
        totalItens,
        ticketMedio,
        totalEntradas,
        totalSaidas,
        saldoLiquido,
        produtosMaisVendidos,
        vendasPorCategoria,
        vendasPorHora,
        vendasPorFormaPagamento,
        estoqueMinimo,
        ultimasVendas
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
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
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  // Exportar para PDF
  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    setExportType('pdf');
    
    try {
      // Carregar dados da empresa
      const companyDataStr = localStorage.getItem('company_data');
      const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
      
      // Configurar documento PDF
      const doc = new jsPDF('p', 'mm', 'a4');
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
      doc.text('RELATÓRIO GERENCIAL - DASHBOARD', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Período do relatório
      doc.setFontSize(10);
      let periodoTexto = '';
      switch (dateRange) {
        case 'today':
          periodoTexto = `Hoje (${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
          break;
        case 'yesterday':
          periodoTexto = `Ontem (${format(subDays(new Date(), 1), 'dd/MM/yyyy', { locale: ptBR })})`;
          break;
        case 'week':
          periodoTexto = `Últimos 7 dias (${format(subDays(new Date(), 7), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
          break;
        case 'month':
          periodoTexto = `Últimos 30 dias (${format(subDays(new Date(), 30), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
          break;
      }
      doc.text(`Período: ${periodoTexto}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Resumo Financeiro
      doc.setFontSize(14);
      doc.text('RESUMO FINANCEIRO', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.text(`Total de Vendas: ${dashboardData.totalVendas} vendas (${dashboardData.totalItens} itens)`, 20, yPosition);
      yPosition += 6;
      doc.text(`Ticket Médio: ${formatCurrency(dashboardData.ticketMedio)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total de Entradas: ${formatCurrency(dashboardData.totalEntradas)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total de Saídas: ${formatCurrency(dashboardData.totalSaidas)}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Saldo Líquido: ${formatCurrency(dashboardData.saldoLiquido)}`, 20, yPosition);
      yPosition += 15;
      
      // Produtos Mais Vendidos
      if (dashboardData.produtosMaisVendidos.length > 0) {
        doc.setFontSize(14);
        doc.text('PRODUTOS MAIS VENDIDOS', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        dashboardData.produtosMaisVendidos.forEach((produto, index) => {
          doc.text(`${index + 1}. ${produto.nome}`, 20, yPosition);
          doc.text(`${produto.quantidade} unidades`, 120, yPosition);
          doc.text(`${formatCurrency(produto.total)}`, 170, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Vendas por Categoria
      if (dashboardData.vendasPorCategoria.length > 0) {
        doc.setFontSize(14);
        doc.text('VENDAS POR CATEGORIA', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        dashboardData.vendasPorCategoria.forEach((categoria) => {
          doc.text(categoria.name, 20, yPosition);
          doc.text(formatCurrency(categoria.value), 170, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Alertas de Estoque
      if (dashboardData.estoqueMinimo.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text('ALERTAS DE ESTOQUE', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        dashboardData.estoqueMinimo.forEach((produto) => {
          doc.text(produto.nome, 20, yPosition);
          doc.text(`${produto.estoque} / ${produto.minimo}`, 170, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Últimas Vendas
      if (dashboardData.ultimasVendas.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text('ÚLTIMAS VENDAS', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        dashboardData.ultimasVendas.forEach((venda) => {
          doc.text(`Venda #${venda.numero}`, 20, yPosition);
          doc.text(format(new Date(venda.data), 'dd/MM/yyyy HH:mm', { locale: ptBR }), 70, yPosition);
          doc.text(`${venda.itens} itens`, 120, yPosition);
          doc.text(formatCurrency(venda.total), 170, yPosition);
          yPosition += 6;
        });
      }
      
      // Capturar gráficos
      if (chartsRef.current) {
        try {
          // Adicionar nova página para os gráficos
          doc.addPage();
          
          // Capturar o elemento de gráficos
          const canvas = await html2canvas(chartsRef.current, {
            scale: 2,
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
          });
          
          // Adicionar a imagem ao PDF
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40; // Margem de 20mm em cada lado
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.text('GRÁFICOS', pageWidth / 2, 20, { align: 'center' });
          doc.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
        } catch (error) {
          console.error('Erro ao capturar gráficos:', error);
        }
      }
      
      // Rodapé
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`dashboard-${format(new Date(), 'ddMMyyyy-HHmmss')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório em PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Exportar para Excel
  const exportToExcel = () => {
    setIsExporting(true);
    setExportType('excel');
    
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Adicionar planilha de resumo
      const resumoData = [
        ['RELATÓRIO GERENCIAL - DASHBOARD'],
        [''],
        ['Período:', getDateRangeText()],
        ['Gerado em:', format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })],
        [''],
        ['RESUMO FINANCEIRO'],
        ['Total de Vendas:', `${dashboardData.totalVendas} vendas (${dashboardData.totalItens} itens)`],
        ['Ticket Médio:', formatCurrency(dashboardData.ticketMedio)],
        ['Total de Entradas:', formatCurrency(dashboardData.totalEntradas)],
        ['Total de Saídas:', formatCurrency(dashboardData.totalSaidas)],
        ['Saldo Líquido:', formatCurrency(dashboardData.saldoLiquido)]
      ];
      
      const resumoWs = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, resumoWs, 'Resumo');
      
      // Adicionar planilha de produtos mais vendidos
      if (dashboardData.produtosMaisVendidos.length > 0) {
        const produtosData = [
          ['PRODUTOS MAIS VENDIDOS'],
          [''],
          ['Produto', 'Quantidade', 'Total']
        ];
        
        dashboardData.produtosMaisVendidos.forEach(produto => {
          produtosData.push([
            produto.nome,
            produto.quantidade,
            produto.total
          ]);
        });
        
        const produtosWs = XLSX.utils.aoa_to_sheet(produtosData);
        XLSX.utils.book_append_sheet(wb, produtosWs, 'Produtos');
      }
      
      // Adicionar planilha de vendas por categoria
      if (dashboardData.vendasPorCategoria.length > 0) {
        const categoriasData = [
          ['VENDAS POR CATEGORIA'],
          [''],
          ['Categoria', 'Valor']
        ];
        
        dashboardData.vendasPorCategoria.forEach(categoria => {
          categoriasData.push([
            categoria.name,
            categoria.value
          ]);
        });
        
        const categoriasWs = XLSX.utils.aoa_to_sheet(categoriasData);
        XLSX.utils.book_append_sheet(wb, categoriasWs, 'Categorias');
      }
      
      // Adicionar planilha de vendas por hora
      if (dashboardData.vendasPorHora.some(item => item.value > 0)) {
        const horasData = [
          ['VENDAS POR HORA'],
          [''],
          ['Hora', 'Valor']
        ];
        
        dashboardData.vendasPorHora.forEach(hora => {
          horasData.push([
            hora.hour,
            hora.value
          ]);
        });
        
        const horasWs = XLSX.utils.aoa_to_sheet(horasData);
        XLSX.utils.book_append_sheet(wb, horasWs, 'Horas');
      }
      
      // Adicionar planilha de formas de pagamento
      if (dashboardData.vendasPorFormaPagamento.length > 0) {
        const pagamentosData = [
          ['FORMAS DE PAGAMENTO'],
          [''],
          ['Forma', 'Valor']
        ];
        
        dashboardData.vendasPorFormaPagamento.forEach(forma => {
          pagamentosData.push([
            forma.name,
            forma.value
          ]);
        });
        
        const pagamentosWs = XLSX.utils.aoa_to_sheet(pagamentosData);
        XLSX.utils.book_append_sheet(wb, pagamentosWs, 'Pagamentos');
      }
      
      // Adicionar planilha de alertas de estoque
      if (dashboardData.estoqueMinimo.length > 0) {
        const estoqueData = [
          ['ALERTAS DE ESTOQUE'],
          [''],
          ['Produto', 'Estoque Atual', 'Estoque Mínimo', 'Percentual']
        ];
        
        dashboardData.estoqueMinimo.forEach(produto => {
          estoqueData.push([
            produto.nome,
            produto.estoque,
            produto.minimo,
            `${produto.percentual.toFixed(0)}%`
          ]);
        });
        
        const estoqueWs = XLSX.utils.aoa_to_sheet(estoqueData);
        XLSX.utils.book_append_sheet(wb, estoqueWs, 'Estoque');
      }
      
      // Adicionar planilha de últimas vendas
      if (dashboardData.ultimasVendas.length > 0) {
        const vendasData = [
          ['ÚLTIMAS VENDAS'],
          [''],
          ['Número', 'Data', 'Itens', 'Total', 'Vendedor']
        ];
        
        dashboardData.ultimasVendas.forEach(venda => {
          vendasData.push([
            `#${venda.numero}`,
            format(new Date(venda.data), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
            venda.itens,
            venda.total,
            venda.vendedor
          ]);
        });
        
        const vendasWs = XLSX.utils.aoa_to_sheet(vendasData);
        XLSX.utils.book_append_sheet(wb, vendasWs, 'Vendas');
      }
      
      // Exportar o arquivo
      XLSX.writeFile(wb, `dashboard-${format(new Date(), 'ddMMyyyy-HHmmss')}.xlsx`);
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      alert('Erro ao gerar o relatório em Excel. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today':
        return `Hoje (${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
      case 'yesterday':
        return `Ontem (${format(subDays(new Date(), 1), 'dd/MM/yyyy', { locale: ptBR })})`;
      case 'week':
        return `Últimos 7 dias (${format(subDays(new Date(), 7), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
      case 'month':
        return `Últimos 30 dias (${format(subDays(new Date(), 30), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`;
      default:
        return '';
    }
  };

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`} ref={dashboardRef}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-100'
              }`}>
                <BarChart3 size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Dashboard</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Visão geral do seu negócio
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className={`px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="today">Hoje</option>
                  <option value="yesterday">Ontem</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
                </select>
              </div>
              
              <button
                onClick={loadDashboardData}
                className={`p-3 rounded-xl transition-all hover:scale-110 ${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-lg`}
                title="Atualizar"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className={`p-3 rounded-xl transition-all hover:scale-110 ${
                    theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                  } shadow-lg`}
                  title="Exportar"
                >
                  <Download size={20} />
                </button>
                
                {showExportOptions && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-10 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowExportOptions(false);
                          exportToPDF();
                        }}
                        className={`flex items-center gap-2 px-4 py-2 w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        disabled={isExporting}
                      >
                        {isExporting && exportType === 'pdf' ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <FileText size={16} />
                        )}
                        Exportar PDF
                      </button>
                      <button
                        onClick={() => {
                          setShowExportOptions(false);
                          exportToExcel();
                        }}
                        className={`flex items-center gap-2 px-4 py-2 w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        disabled={isExporting}
                      >
                        {isExporting && exportType === 'excel' ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <FileSpreadsheet size={16} />
                        )}
                        Exportar Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Vendas</p>
                <p className="text-3xl font-bold text-primary">{dashboardData.totalVendas}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary/10">
                <ShoppingCart size={28} className="text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {dashboardData.totalItens} itens vendidos
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ticket Médio</p>
                <p className="text-3xl font-bold text-secondary">{formatCurrency(dashboardData.ticketMedio)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary/10">
                <DollarSign size={28} className="text-secondary" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Por venda realizada
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Entradas</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(dashboardData.totalEntradas)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100">
                <TrendingUp size={28} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total de entradas no período
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Saídas</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(dashboardData.totalSaidas)}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-100">
                <TrendingDown size={28} className="text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total de saídas no período
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" ref={chartsRef}>
          {/* Produtos Mais Vendidos */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Package size={24} className="text-primary" />
                Produtos Mais Vendidos
              </h3>
            </div>
            
            <div className="p-6">
              {dashboardData.produtosMaisVendidos.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.produtosMaisVendidos.map((produto, index) => (
                    <div key={produto.id} className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <span className="font-medium">{produto.nome}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(produto.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {produto.quantidade} unidades vendidas
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Preço médio: {formatCurrency(produto.total / produto.quantidade)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhuma venda no período</p>
                  <p className="text-sm text-gray-500">
                    Selecione outro período ou realize vendas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vendas por Categoria */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Tag size={24} className="text-secondary" />
                Vendas por Categoria
              </h3>
            </div>
            
            <div className="p-6 h-80">
              {dashboardData.vendasPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.vendasPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.vendasPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#374151' : '#fff',
                        borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                        color: theme === 'dark' ? '#fff' : '#000'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                  <Tag size={48} className="mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhuma venda no período</p>
                  <p className="text-sm text-gray-500">
                    Selecione outro período ou realize vendas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vendas por Hora */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock size={24} className="text-primary" />
                Vendas por Hora
              </h3>
            </div>
            
            <div className="p-6 h-80">
              {dashboardData.vendasPorHora.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.vendasPorHora}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#374151' : '#fff',
                        borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                        color: theme === 'dark' ? '#fff' : '#000'
                      }}
                    />
                    <Bar dataKey="value" fill={primaryColor} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                  <Clock size={48} className="mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhuma venda no período</p>
                  <p className="text-sm text-gray-500">
                    Selecione outro período ou realize vendas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <DollarSign size={24} className="text-secondary" />
                Formas de Pagamento
              </h3>
            </div>
            
            <div className="p-6">
              {dashboardData.vendasPorFormaPagamento.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.vendasPorFormaPagamento.map((forma, index) => {
                    const percentage = dashboardData.totalEntradas > 0 
                      ? (forma.value / dashboardData.totalEntradas) * 100 
                      : 0;
                    
                    return (
                      <div key={forma.name} className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{forma.name}</span>
                          <div className="text-right">
                            <span className="font-bold">{formatCurrency(forma.value)}</span>
                            <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhuma venda no período</p>
                  <p className="text-sm text-gray-500">
                    Selecione outro período ou realize vendas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertas e Últimas Vendas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Alertas de Estoque */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle size={24} className="text-orange-500" />
                Alertas de Estoque
              </h3>
            </div>
            
            <div className="p-6">
              {dashboardData.estoqueMinimo.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.estoqueMinimo.map((produto) => (
                    <div key={produto.id} className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            produto.estoque === 0 
                              ? 'bg-red-100' 
                              : produto.percentual < 50 
                                ? 'bg-orange-100' 
                                : 'bg-yellow-100'
                          }`}>
                            {produto.estoque === 0 ? (
                              <XCircle size={16} className="text-red-600" />
                            ) : produto.percentual < 50 ? (
                              <AlertTriangle size={16} className="text-orange-600" />
                            ) : (
                              <AlertTriangle size={16} className="text-yellow-600" />
                            )}
                          </div>
                          <span className="font-medium">{produto.nome}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${
                            produto.estoque === 0 
                              ? 'text-red-600' 
                              : produto.percentual < 50 
                                ? 'text-orange-600' 
                                : 'text-yellow-600'
                          }`}>
                            {produto.estoque} / {produto.minimo}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            produto.estoque === 0 
                              ? 'bg-red-600' 
                              : produto.percentual < 50 
                                ? 'bg-orange-500' 
                                : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(100, produto.percentual)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {produto.estoque === 0 
                            ? 'Sem estoque!' 
                            : `${produto.percentual.toFixed(0)}% do mínimo`}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800">
                          Repor estoque
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium mb-2">Estoque adequado</p>
                  <p className="text-sm text-gray-500">
                    Todos os produtos estão com estoque acima do mínimo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Últimas Vendas */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} className="text-primary" />
                Últimas Vendas
              </h3>
            </div>
            
            <div className="p-6">
              {dashboardData.ultimasVendas.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.ultimasVendas.map((venda) => (
                    <div key={venda.id} className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingCart size={20} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Venda #{venda.numero.toString().padStart(6, '0')}</div>
                            <div className="text-xs text-gray-500">{formatDate(venda.data)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(venda.total)}</div>
                          <div className="text-xs text-gray-500">{venda.itens} itens</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Vendedor: {venda.vendedor}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Eye size={14} />
                          Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhuma venda no período</p>
                  <p className="text-sm text-gray-500">
                    Selecione outro período ou realize vendas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <DollarSign size={24} className="text-primary" />
            Resumo Financeiro
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Total de Entradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.totalEntradas)}
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
                    {formatCurrency(dashboardData.totalSaidas)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl ${
              dashboardData.saldoLiquido >= 0 
                ? theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                : theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${
                    dashboardData.saldoLiquido >= 0 
                      ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    Saldo Líquido
                  </p>
                  <p className={`text-2xl font-bold ${
                    dashboardData.saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {formatCurrency(dashboardData.saldoLiquido)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  dashboardData.saldoLiquido >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  <DollarSign className={dashboardData.saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'} size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Dashboard • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;