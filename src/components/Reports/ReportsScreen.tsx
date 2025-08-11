import React, { useState, useEffect } from 'react';
import { FileText, BarChart3, Calendar, Download, Printer, Filter, RefreshCw, ShoppingCart, DollarSign, Package, Users, Truck, Tag, Clock, Search, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/database';
import { format, subDays, startOfDay, endOfDay, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'sales' | 'financial' | 'products' | 'users';
  permissionId: string;
}

const ReportsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const { user, checkPermission } = useAuth();
  
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['sales', 'financial', 'products']);

  // Lista de relatórios disponíveis
  const reportTypes: ReportType[] = [
    {
      id: 'sales_summary',
      name: 'Resumo de Vendas',
      description: 'Visão geral das vendas no período selecionado',
      icon: ShoppingCart,
      category: 'sales',
      permissionId: 'reports_sales'
    },
    {
      id: 'sales_by_product',
      name: 'Vendas por Produto',
      description: 'Análise detalhada de vendas por produto',
      icon: Package,
      category: 'sales',
      permissionId: 'reports_sales'
    },
    {
      id: 'sales_by_category',
      name: 'Vendas por Categoria',
      description: 'Análise de vendas agrupadas por categoria',
      icon: Tag,
      category: 'sales',
      permissionId: 'reports_sales'
    },
    {
      id: 'sales_by_hour',
      name: 'Vendas por Hora',
      description: 'Distribuição de vendas ao longo do dia',
      icon: Clock,
      category: 'sales',
      permissionId: 'reports_sales'
    },
    {
      id: 'financial_summary',
      name: 'Resumo Financeiro',
      description: 'Visão geral das finanças no período',
      icon: DollarSign,
      category: 'financial',
      permissionId: 'reports_financial'
    },
    {
      id: 'expenses_report',
      name: 'Relatório de Despesas',
      description: 'Análise detalhada de despesas',
      icon: ArrowLeft,
      category: 'financial',
      permissionId: 'reports_financial'
    },
    {
      id: 'cash_flow',
      name: 'Fluxo de Caixa',
      description: 'Análise de entradas e saídas',
      icon: ArrowRight,
      category: 'financial',
      permissionId: 'reports_financial'
    },
    {
      id: 'product_inventory',
      name: 'Inventário de Produtos',
      description: 'Relatório completo do estoque atual',
      icon: Package,
      category: 'products',
      permissionId: 'reports_products'
    },
    {
      id: 'low_stock',
      name: 'Produtos com Estoque Baixo',
      description: 'Lista de produtos com estoque abaixo do mínimo',
      icon: AlertTriangle,
      category: 'products',
      permissionId: 'reports_products'
    },
    {
      id: 'product_performance',
      name: 'Desempenho de Produtos',
      description: 'Análise de vendas e lucratividade por produto',
      icon: BarChart3,
      category: 'products',
      permissionId: 'reports_products'
    },
    {
      id: 'user_performance',
      name: 'Desempenho de Usuários',
      description: 'Análise de vendas por vendedor',
      icon: Users,
      category: 'users',
      permissionId: 'reports_sales'
    },
    {
      id: 'supplier_report',
      name: 'Relatório de Fornecedores',
      description: 'Análise de compras por fornecedor',
      icon: Truck,
      category: 'products',
      permissionId: 'reports_products'
    }
  ];

  // Filtrar relatórios por permissão
  const availableReports = reportTypes.filter(report => checkPermission(report.permissionId));

  useEffect(() => {
    if (selectedReport) {
      generateReport();
    }
  }, [selectedReport, dateRange, startDate, endDate]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;
    
    switch (dateRange) {
      case 'today':
        start = startOfDay(now);
        end = now;
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'week':
        start = startOfWeek(now, { locale: ptBR });
        end = endOfWeek(now, { locale: ptBR });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        start = startOfDay(parseISO(startDate));
        end = endOfDay(parseISO(endDate));
        break;
      default:
        start = startOfDay(now);
        end = now;
    }
    
    return { start, end };
  };

  const generateReport = async () => {
    if (!selectedReport) return;
    
    setIsLoading(true);
    
    try {
      const { start, end } = getDateRange();
      
      // Buscar dados conforme o tipo de relatório
      let data: any = null;
      
      switch (selectedReport.id) {
        case 'sales_summary':
          data = generateSalesSummary(start, end);
          break;
        case 'sales_by_product':
          data = generateSalesByProduct(start, end);
          break;
        case 'sales_by_category':
          data = generateSalesByCategory(start, end);
          break;
        case 'sales_by_hour':
          data = generateSalesByHour(start, end);
          break;
        case 'financial_summary':
          data = generateFinancialSummary(start, end);
          break;
        case 'expenses_report':
          data = generateExpensesReport(start, end);
          break;
        case 'cash_flow':
          data = generateCashFlow(start, end);
          break;
        case 'product_inventory':
          data = generateProductInventory();
          break;
        case 'low_stock':
          data = generateLowStockReport();
          break;
        case 'product_performance':
          data = generateProductPerformance(start, end);
          break;
        case 'user_performance':
          data = generateUserPerformance(start, end);
          break;
        case 'supplier_report':
          data = generateSupplierReport();
          break;
        default:
          data = null;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para gerar relatórios específicos
  const generateSalesSummary = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.itens.reduce((itemSum, item) => itemSum + item.quantidade, 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Vendas por dia
    const salesByDay = new Map<string, number>();
    
    sales.forEach(sale => {
      const day = format(new Date(sale.dataVenda), 'yyyy-MM-dd');
      const currentTotal = salesByDay.get(day) || 0;
      salesByDay.set(day, currentTotal + sale.total);
    });
    
    const dailySales = Array.from(salesByDay.entries())
      .map(([date, value]) => ({
        date: format(parseISO(date), 'dd/MM'),
        value
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Formas de pagamento
    const paymentMethods = new Map<string, number>();
    
    sales.forEach(sale => {
      sale.pagamentos.forEach(payment => {
        const method = payment.tipo;
        const currentTotal = paymentMethods.get(method) || 0;
        paymentMethods.set(method, currentTotal + payment.valor);
      });
    });
    
    const paymentData = Array.from(paymentMethods.entries())
      .map(([method, value]) => {
        const label = {
          'dinheiro': 'Dinheiro',
          'cartao_debito': 'Cartão Débito',
          'cartao_credito': 'Cartão Crédito',
          'pix': 'PIX',
          'vale': 'Vale'
        }[method] || method;
        
        return { name: label, value };
      });
    
    return {
      totalSales,
      totalRevenue,
      totalItems,
      averageTicket,
      dailySales,
      paymentData
    };
  };

  const generateSalesByProduct = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    const productSales = new Map<string, { id: string, name: string, quantity: number, revenue: number }>();
    
    sales.forEach(sale => {
      sale.itens.forEach(item => {
        const productId = item.produtoId;
        const current = productSales.get(productId) || { 
          id: productId, 
          name: item.produto.nome, 
          quantity: 0, 
          revenue: 0 
        };
        
        productSales.set(productId, {
          ...current,
          quantity: current.quantity + item.quantidade,
          revenue: current.revenue + item.total
        });
      });
    });
    
    const productData = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue);
    
    return {
      productData,
      totalProducts: productData.length,
      totalQuantity: productData.reduce((sum, p) => sum + p.quantity, 0),
      totalRevenue: productData.reduce((sum, p) => sum + p.revenue, 0)
    };
  };

  const generateSalesByCategory = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    const categorySales = new Map<string, { name: string, quantity: number, revenue: number }>();
    
    sales.forEach(sale => {
      sale.itens.forEach(item => {
        const category = item.produto.categoria;
        const current = categorySales.get(category) || { 
          name: category, 
          quantity: 0, 
          revenue: 0 
        };
        
        categorySales.set(category, {
          ...current,
          quantity: current.quantity + item.quantidade,
          revenue: current.revenue + item.total
        });
      });
    });
    
    const categoryData = Array.from(categorySales.values())
      .sort((a, b) => b.revenue - a.revenue);
    
    // Dados para gráfico de pizza
    const pieData = categoryData.map(category => ({
      name: category.name,
      value: category.revenue
    }));
    
    return {
      categoryData,
      pieData,
      totalCategories: categoryData.length,
      totalQuantity: categoryData.reduce((sum, c) => sum + c.quantity, 0),
      totalRevenue: categoryData.reduce((sum, c) => sum + c.revenue, 0)
    };
  };

  const generateSalesByHour = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    // Inicializar mapa com todas as horas do dia
    const hourSales = new Map<number, { hour: string, quantity: number, revenue: number }>();
    
    for (let i = 0; i < 24; i++) {
      hourSales.set(i, { 
        hour: `${i.toString().padStart(2, '0')}:00`, 
        quantity: 0, 
        revenue: 0 
      });
    }
    
    sales.forEach(sale => {
      const hour = new Date(sale.dataVenda).getHours();
      const current = hourSales.get(hour)!;
      
      hourSales.set(hour, {
        ...current,
        quantity: current.quantity + sale.itens.reduce((sum, item) => sum + item.quantidade, 0),
        revenue: current.revenue + sale.total
      });
    });
    
    const hourData = Array.from(hourSales.values());
    
    // Dados para gráfico de barras
    const chartData = hourData.map(hour => ({
      hour: hour.hour,
      value: hour.revenue
    }));
    
    // Encontrar hora de pico
    const peakHour = [...hourData].sort((a, b) => b.revenue - a.revenue)[0];
    
    return {
      hourData,
      chartData,
      peakHour,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0)
    };
  };

  const generateFinancialSummary = (start: Date, end: Date) => {
    const movements = db.getAllCashMovements().filter(movement => {
      const movementDate = new Date(movement.data);
      return movementDate >= start && movementDate <= end;
    });
    
    const expenses = db.getAllExpenses().filter(expense => {
      if (!expense.pago || !expense.dataPagamento) return false;
      const paymentDate = parseISO(expense.dataPagamento);
      return paymentDate >= start && paymentDate <= end;
    });
    
    const totalIncome = movements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
    const totalExpenses = movements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
    const netBalance = totalIncome - totalExpenses;
    
    // Categorias de entrada
    const incomeCategories = new Map<string, number>();
    
    movements.filter(m => m.tipo === 'entrada').forEach(movement => {
      const category = movement.categoria;
      const currentTotal = incomeCategories.get(category) || 0;
      incomeCategories.set(category, currentTotal + movement.valor);
    });
    
    const incomeData = Array.from(incomeCategories.entries())
      .map(([category, value]) => ({ name: category, value }))
      .sort((a, b) => b.value - a.value);
    
    // Categorias de saída
    const expenseCategories = new Map<string, number>();
    
    movements.filter(m => m.tipo === 'saida').forEach(movement => {
      const category = movement.categoria;
      const currentTotal = expenseCategories.get(category) || 0;
      expenseCategories.set(category, currentTotal + movement.valor);
    });
    
    const expenseData = Array.from(expenseCategories.entries())
      .map(([category, value]) => ({ name: category, value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      totalIncome,
      totalExpenses,
      netBalance,
      incomeData,
      expenseData,
      totalMovements: movements.length,
      totalPaidExpenses: expenses.length
    };
  };

  const generateExpensesReport = (start: Date, end: Date) => {
    const expenses = db.getAllExpenses().filter(expense => {
      // Incluir despesas pagas no período ou pendentes com vencimento no período
      if (expense.pago && expense.dataPagamento) {
        const paymentDate = parseISO(expense.dataPagamento);
        return paymentDate >= start && paymentDate <= end;
      } else {
        const dueDate = parseISO(expense.dataVencimento);
        return dueDate >= start && dueDate <= end;
      }
    });
    
    const totalPaid = expenses.filter(e => e.pago).reduce((sum, e) => sum + e.valor, 0);
    const totalPending = expenses.filter(e => !e.pago).reduce((sum, e) => sum + e.valor, 0);
    const totalExpenses = totalPaid + totalPending;
    
    // Agrupar por categoria
    const expensesByCategory = new Map<string, { paid: number, pending: number }>();
    
    expenses.forEach(expense => {
      const category = expense.categoria;
      const current = expensesByCategory.get(category) || { paid: 0, pending: 0 };
      
      if (expense.pago) {
        expensesByCategory.set(category, {
          ...current,
          paid: current.paid + expense.valor
        });
      } else {
        expensesByCategory.set(category, {
          ...current,
          pending: current.pending + expense.valor
        });
      }
    });
    
    const categoryData = Array.from(expensesByCategory.entries())
      .map(([category, values]) => ({
        name: category === 'fixa' ? 'Fixa' : 'Variável',
        paid: values.paid,
        pending: values.pending,
        total: values.paid + values.pending
      }))
      .sort((a, b) => b.total - a.total);
    
    // Dados para gráfico
    const chartData = [
      { name: 'Pagas', value: totalPaid },
      { name: 'Pendentes', value: totalPending }
    ];
    
    return {
      expenses,
      totalPaid,
      totalPending,
      totalExpenses,
      categoryData,
      chartData,
      paidCount: expenses.filter(e => e.pago).length,
      pendingCount: expenses.filter(e => !e.pago).length
    };
  };

  const generateCashFlow = (start: Date, end: Date) => {
    const movements = db.getAllCashMovements().filter(movement => {
      const movementDate = new Date(movement.data);
      return movementDate >= start && movementDate <= end;
    });
    
    // Agrupar por dia
    const dailyFlow = new Map<string, { date: string, income: number, expense: number }>();
    
    // Inicializar todos os dias no intervalo
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      dailyFlow.set(dateStr, {
        date: format(currentDate, 'dd/MM'),
        income: 0,
        expense: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Preencher com dados reais
    movements.forEach(movement => {
      const dateStr = format(new Date(movement.data), 'yyyy-MM-dd');
      const current = dailyFlow.get(dateStr) || { 
        date: format(new Date(movement.data), 'dd/MM'),
        income: 0, 
        expense: 0 
      };
      
      if (movement.tipo === 'entrada') {
        dailyFlow.set(dateStr, {
          ...current,
          income: current.income + movement.valor
        });
      } else {
        dailyFlow.set(dateStr, {
          ...current,
          expense: current.expense + movement.valor
        });
      }
    });
    
    const flowData = Array.from(dailyFlow.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calcular totais
    const totalIncome = movements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
    const totalExpense = movements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
    const netBalance = totalIncome - totalExpense;
    
    // Dados para gráfico
    const chartData = flowData.map(day => ({
      name: day.date,
      income: day.income,
      expense: day.expense,
      balance: day.income - day.expense
    }));
    
    return {
      flowData,
      chartData,
      totalIncome,
      totalExpense,
      netBalance,
      incomeCount: movements.filter(m => m.tipo === 'entrada').length,
      expenseCount: movements.filter(m => m.tipo === 'saida').length
    };
  };

  const generateProductInventory = () => {
    const products = db.getAllProducts();
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.ativo).length;
    const inactiveProducts = products.filter(p => !p.ativo).length;
    const lowStockProducts = products.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0).length;
    const outOfStockProducts = products.filter(p => p.estoque === 0).length;
    
    // Valor total do estoque
    const inventoryValue = products.reduce((sum, product) => sum + (product.preco * product.estoque), 0);
    
    // Agrupar por categoria
    const categoriesMap = new Map<string, { count: number, value: number }>();
    
    products.forEach(product => {
      const category = product.categoria;
      const current = categoriesMap.get(category) || { count: 0, value: 0 };
      
      categoriesMap.set(category, {
        count: current.count + 1,
        value: current.value + (product.preco * product.estoque)
      });
    });
    
    const categoryData = Array.from(categoriesMap.entries())
      .map(([category, data]) => ({
        name: category,
        count: data.count,
        value: data.value
      }))
      .sort((a, b) => b.value - a.value);
    
    // Dados para gráfico de pizza
    const pieData = categoryData.map(category => ({
      name: category.name,
      value: category.value
    }));
    
    return {
      products,
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      inventoryValue,
      categoryData,
      pieData
    };
  };

  const generateLowStockReport = () => {
    const products = db.getAllProducts();
    
    const lowStockProducts = products
      .filter(p => p.estoque <= p.estoqueMinimo && p.ativo)
      .sort((a, b) => (a.estoque / a.estoqueMinimo) - (b.estoque / b.estoqueMinimo));
    
    const outOfStockProducts = products.filter(p => p.estoque === 0 && p.ativo);
    const criticalProducts = products.filter(p => p.estoque <= p.estoqueMinimo * 0.5 && p.estoque > 0 && p.ativo);
    const warningProducts = products.filter(p => 
      p.estoque <= p.estoqueMinimo && 
      p.estoque > p.estoqueMinimo * 0.5 && 
      p.ativo
    );
    
    // Agrupar por categoria
    const categoriesMap = new Map<string, number>();
    
    lowStockProducts.forEach(product => {
      const category = product.categoria;
      const current = categoriesMap.get(category) || 0;
      categoriesMap.set(category, current + 1);
    });
    
    const categoryData = Array.from(categoriesMap.entries())
      .map(([category, count]) => ({
        name: category,
        count
      }))
      .sort((a, b) => b.count - a.count);
    
    // Dados para gráfico
    const chartData = [
      { name: 'Sem Estoque', value: outOfStockProducts.length },
      { name: 'Crítico', value: criticalProducts.length },
      { name: 'Alerta', value: warningProducts.length }
    ];
    
    return {
      lowStockProducts,
      outOfStockProducts,
      criticalProducts,
      warningProducts,
      totalLowStock: lowStockProducts.length,
      categoryData,
      chartData
    };
  };

  const generateProductPerformance = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    const productPerformance = new Map<string, { 
      id: string, 
      name: string, 
      quantity: number, 
      revenue: number,
      category: string
    }>();
    
    sales.forEach(sale => {
      sale.itens.forEach(item => {
        const productId = item.produtoId;
        const current = productPerformance.get(productId) || { 
          id: productId, 
          name: item.produto.nome, 
          quantity: 0, 
          revenue: 0,
          category: item.produto.categoria
        };
        
        productPerformance.set(productId, {
          ...current,
          quantity: current.quantity + item.quantidade,
          revenue: current.revenue + item.total
        });
      });
    });
    
    const performanceData = Array.from(productPerformance.values())
      .sort((a, b) => b.revenue - a.revenue);
    
    // Top 10 produtos
    const topProducts = performanceData.slice(0, 10);
    
    // Agrupar por categoria
    const categoriesMap = new Map<string, { quantity: number, revenue: number }>();
    
    performanceData.forEach(product => {
      const category = product.category;
      const current = categoriesMap.get(category) || { quantity: 0, revenue: 0 };
      
      categoriesMap.set(category, {
        quantity: current.quantity + product.quantity,
        revenue: current.revenue + product.revenue
      });
    });
    
    const categoryData = Array.from(categoriesMap.entries())
      .map(([category, data]) => ({
        name: category,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    // Dados para gráfico
    const chartData = topProducts.map(product => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      value: product.revenue
    }));
    
    return {
      performanceData,
      topProducts,
      categoryData,
      chartData,
      totalQuantity: performanceData.reduce((sum, p) => sum + p.quantity, 0),
      totalRevenue: performanceData.reduce((sum, p) => sum + p.revenue, 0)
    };
  };

  const generateUserPerformance = (start: Date, end: Date) => {
    const sales = db.getAllSales().filter(sale => {
      const saleDate = new Date(sale.dataVenda);
      return !sale.cancelada && saleDate >= start && saleDate <= end;
    });
    
    const userPerformance = new Map<string, { 
      id: string, 
      name: string, 
      sales: number, 
      items: number,
      revenue: number,
      averageTicket: number
    }>();
    
    sales.forEach(sale => {
      const userId = sale.vendedorId;
      const current = userPerformance.get(userId) || { 
        id: userId, 
        name: sale.vendedor, 
        sales: 0, 
        items: 0,
        revenue: 0,
        averageTicket: 0
      };
      
      const itemCount = sale.itens.reduce((sum, item) => sum + item.quantidade, 0);
      
      userPerformance.set(userId, {
        ...current,
        sales: current.sales + 1,
        items: current.items + itemCount,
        revenue: current.revenue + sale.total,
        averageTicket: (current.revenue + sale.total) / (current.sales + 1)
      });
    });
    
    const performanceData = Array.from(userPerformance.values())
      .sort((a, b) => b.revenue - a.revenue);
    
    // Dados para gráfico
    const chartData = performanceData.map(user => ({
      name: user.name,
      value: user.revenue
    }));
    
    return {
      performanceData,
      chartData,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalUsers: performanceData.length
    };
  };

  const generateSupplierReport = () => {
    const suppliers = db.getAllSuppliers();
    const products = db.getAllProducts();
    
    // Agrupar produtos por fornecedor
    const supplierProducts = new Map<string, Product[]>();
    
    products.forEach(product => {
      if (product.fornecedorId) {
        const current = supplierProducts.get(product.fornecedorId) || [];
        supplierProducts.set(product.fornecedorId, [...current, product]);
      }
    });
    
    // Calcular estatísticas por fornecedor
    const supplierData = suppliers.map(supplier => {
      const products = supplierProducts.get(supplier.id) || [];
      const productCount = products.length;
      const stockValue = products.reduce((sum, product) => sum + (product.preco * product.estoque), 0);
      const lowStockCount = products.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0).length;
      const outOfStockCount = products.filter(p => p.estoque === 0).length;
      
      return {
        id: supplier.id,
        name: supplier.nome,
        active: supplier.ativo,
        productCount,
        stockValue,
        lowStockCount,
        outOfStockCount
      };
    }).sort((a, b) => b.stockValue - a.stockValue);
    
    // Dados para gráfico
    const chartData = supplierData
      .filter(s => s.active && s.productCount > 0)
      .slice(0, 10)
      .map(supplier => ({
        name: supplier.name.length > 15 ? supplier.name.substring(0, 15) + '...' : supplier.name,
        value: supplier.stockValue
      }));
    
    return {
      supplierData,
      chartData,
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.ativo).length,
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + (p.preco * p.estoque), 0)
    };
  };

  const generatePDF = async () => {
    if (!reportData || !selectedReport) return;
    
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
      doc.text(selectedReport.name.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Período do relatório
      const { start, end } = getDateRange();
      doc.setFontSize(10);
      doc.text(`Período: ${format(start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Conteúdo específico para cada tipo de relatório
      switch (selectedReport.id) {
        case 'sales_summary':
          generateSalesSummaryPDF(doc, reportData, yPosition);
          break;
        case 'sales_by_product':
          generateSalesByProductPDF(doc, reportData, yPosition);
          break;
        case 'product_inventory':
          generateProductInventoryPDF(doc, reportData, yPosition);
          break;
        case 'low_stock':
          generateLowStockPDF(doc, reportData, yPosition);
          break;
        case 'financial_summary':
          generateFinancialSummaryPDF(doc, reportData, yPosition);
          break;
        case 'expenses_report':
          generateExpensesReportPDF(doc, reportData, yPosition);
          break;
        default:
          // Relatório genérico
          doc.setFontSize(12);
          doc.text('Dados do Relatório', 20, yPosition);
          yPosition += 10;
          
          doc.setFontSize(10);
          doc.text('Este relatório contém dados específicos que não podem ser representados em formato PDF.', 20, yPosition);
          yPosition += 6;
          doc.text('Por favor, visualize os dados na tela ou exporte para outro formato.', 20, yPosition);
      }

      // Rodapé discreto
      const finalY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.text('Powered by CYBERPIU', pageWidth / 2, finalY, { align: 'center' });

      doc.save(`relatorio-${selectedReport.id}-${format(new Date(), 'ddMMyyyy-HHmm')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório em PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Funções auxiliares para geração de PDF
  const generateSalesSummaryPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO DE VENDAS', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${data.totalSales}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Receita Total: R$ ${data.totalRevenue.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total de Itens: ${data.totalItems}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Ticket Médio: R$ ${data.averageTicket.toFixed(2)}`, 20, yPosition);
    yPosition += 15;

    // Vendas por dia
    if (data.dailySales.length > 0) {
      doc.setFontSize(12);
      doc.text('VENDAS POR DIA', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      data.dailySales.forEach((day: any) => {
        doc.text(`${day.date}: R$ ${day.value.toFixed(2)}`, 25, yPosition);
        yPosition += 5;
      });
      
      yPosition += 10;
    }

    // Formas de pagamento
    if (data.paymentData.length > 0) {
      doc.setFontSize(12);
      doc.text('FORMAS DE PAGAMENTO', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      data.paymentData.forEach((payment: any) => {
        doc.text(`${payment.name}: R$ ${payment.value.toFixed(2)}`, 25, yPosition);
        yPosition += 5;
      });
    }
  };

  const generateSalesByProductPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO DE VENDAS POR PRODUTO', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Produtos Vendidos: ${data.totalProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Quantidade Total: ${data.totalQuantity} unidades`, 20, yPosition);
    yPosition += 6;
    doc.text(`Receita Total: R$ ${data.totalRevenue.toFixed(2)}`, 20, yPosition);
    yPosition += 15;

    // Lista de produtos
    doc.setFontSize(12);
    doc.text('PRODUTOS MAIS VENDIDOS', 20, yPosition);
    yPosition += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Produto', 20, yPosition);
    doc.text('Quantidade', 120, yPosition);
    doc.text('Receita', 160, yPosition);
    yPosition += 6;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 4;
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    data.productData.slice(0, 20).forEach((product: any, index: number) => {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Cabeçalho da tabela na nova página
        doc.setFont('helvetica', 'bold');
        doc.text('Produto', 20, yPosition);
        doc.text('Quantidade', 120, yPosition);
        doc.text('Receita', 160, yPosition);
        yPosition += 6;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 4;
        
        doc.setFont('helvetica', 'normal');
      }
      
      // Nome do produto (com quebra de linha se necessário)
      const nameLines = doc.splitTextToSize(product.name, 95);
      nameLines.forEach((line: string, i: number) => {
        doc.text(line, 20, yPosition + (i * 4));
      });
      
      // Avançar posição Y baseado no número de linhas do nome
      const nameHeight = nameLines.length * 4;
      
      doc.text(product.quantity.toString(), 120, yPosition);
      doc.text(`R$ ${product.revenue.toFixed(2)}`, 160, yPosition);
      
      yPosition += Math.max(nameHeight, 6) + 2;
    });
  };

  const generateProductInventoryPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO DO INVENTÁRIO', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Produtos: ${data.totalProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos Ativos: ${data.activeProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos Inativos: ${data.inactiveProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos com Estoque Baixo: ${data.lowStockProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos Sem Estoque: ${data.outOfStockProducts}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Valor Total do Estoque: R$ ${data.inventoryValue.toFixed(2)}`, 20, yPosition);
    yPosition += 15;

    // Categorias
    doc.setFontSize(12);
    doc.text('INVENTÁRIO POR CATEGORIA', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    data.categoryData.forEach((category: any) => {
      doc.text(`${category.name}: ${category.count} produtos - R$ ${category.value.toFixed(2)}`, 25, yPosition);
      yPosition += 5;
    });
    yPosition += 10;

    // Lista de produtos
    doc.setFontSize(12);
    doc.text('LISTA DE PRODUTOS', 20, yPosition);
    yPosition += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Código', 20, yPosition);
    doc.text('Produto', 45, yPosition);
    doc.text('Categoria', 120, yPosition);
    doc.text('Preço', 160, yPosition);
    doc.text('Estoque', 180, yPosition);
    yPosition += 6;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 4;
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    data.products.filter((p: any) => p.ativo).slice(0, 30).forEach((product: any) => {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Cabeçalho da tabela na nova página
        doc.setFont('helvetica', 'bold');
        doc.text('Código', 20, yPosition);
        doc.text('Produto', 45, yPosition);
        doc.text('Categoria', 120, yPosition);
        doc.text('Preço', 160, yPosition);
        doc.text('Estoque', 180, yPosition);
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
      const nameLines = doc.splitTextToSize(product.nome, 70);
      nameLines.forEach((line: string, i: number) => {
        doc.text(line, 45, yPosition + (i * 4));
      });
      
      // Avançar posição Y baseado no número de linhas do nome
      const nameHeight = nameLines.length * 4;
      
      doc.text(product.categoria, 120, yPosition);
      doc.text(`R$ ${product.preco.toFixed(2)}`, 160, yPosition);
      
      // Destacar estoque baixo ou zerado
      if (product.estoque === 0) {
        doc.setTextColor(255, 0, 0); // Vermelho para sem estoque
      } else if (product.estoque <= product.estoqueMinimo) {
        doc.setTextColor(255, 165, 0); // Laranja para estoque baixo
      }
      
      doc.text(product.estoque.toString(), 180, yPosition);
      doc.setTextColor(0, 0, 0); // Resetar cor
      
      yPosition += Math.max(nameHeight, 6) + 2;
    });
  };

  const generateLowStockPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO DE ESTOQUE BAIXO', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Produtos com Estoque Baixo: ${data.totalLowStock}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos Sem Estoque: ${data.outOfStockProducts.length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos em Estado Crítico: ${data.criticalProducts.length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Produtos em Alerta: ${data.warningProducts.length}`, 20, yPosition);
    yPosition += 15;

    // Categorias
    doc.setFontSize(12);
    doc.text('ESTOQUE BAIXO POR CATEGORIA', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    data.categoryData.forEach((category: any) => {
      doc.text(`${category.name}: ${category.count} produtos`, 25, yPosition);
      yPosition += 5;
    });
    yPosition += 10;

    // Lista de produtos
    doc.setFontSize(12);
    doc.text('PRODUTOS COM ESTOQUE BAIXO', 20, yPosition);
    yPosition += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Código', 20, yPosition);
    doc.text('Produto', 45, yPosition);
    doc.text('Categoria', 120, yPosition);
    doc.text('Estoque', 160, yPosition);
    doc.text('Mínimo', 180, yPosition);
    yPosition += 6;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 4;
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    data.lowStockProducts.forEach((product: any) => {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Cabeçalho da tabela na nova página
        doc.setFont('helvetica', 'bold');
        doc.text('Código', 20, yPosition);
        doc.text('Produto', 45, yPosition);
        doc.text('Categoria', 120, yPosition);
        doc.text('Estoque', 160, yPosition);
        doc.text('Mínimo', 180, yPosition);
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
      const nameLines = doc.splitTextToSize(product.nome, 70);
      nameLines.forEach((line: string, i: number) => {
        doc.text(line, 45, yPosition + (i * 4));
      });
      
      // Avançar posição Y baseado no número de linhas do nome
      const nameHeight = nameLines.length * 4;
      
      doc.text(product.categoria, 120, yPosition);
      
      // Destacar estoque baixo ou zerado
      if (product.estoque === 0) {
        doc.setTextColor(255, 0, 0); // Vermelho para sem estoque
      } else if (product.estoque <= product.estoqueMinimo * 0.5) {
        doc.setTextColor(255, 165, 0); // Laranja para estoque crítico
      } else {
        doc.setTextColor(255, 140, 0); // Amarelo para estoque em alerta
      }
      
      doc.text(product.estoque.toString(), 160, yPosition);
      doc.setTextColor(0, 0, 0); // Resetar cor
      doc.text(product.estoqueMinimo.toString(), 180, yPosition);
      
      yPosition += Math.max(nameHeight, 6) + 2;
    });
  };

  const generateFinancialSummaryPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Entradas: R$ ${data.totalIncome.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total de Saídas: R$ ${data.totalExpenses.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Saldo Líquido: R$ ${data.netBalance.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total de Movimentações: ${data.totalMovements}`, 20, yPosition);
    yPosition += 15;

    // Categorias de Entrada
    doc.setFontSize(12);
    doc.text('ENTRADAS POR CATEGORIA', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    data.incomeData.forEach((category: any) => {
      doc.text(`${category.name}: R$ ${category.value.toFixed(2)}`, 25, yPosition);
      yPosition += 5;
    });
    yPosition += 10;

    // Categorias de Saída
    doc.setFontSize(12);
    doc.text('SAÍDAS POR CATEGORIA', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    data.expenseData.forEach((category: any) => {
      doc.text(`${category.name}: R$ ${category.value.toFixed(2)}`, 25, yPosition);
      yPosition += 5;
    });
  };

  const generateExpensesReportPDF = (doc: jsPDF, data: any, startY: number) => {
    let yPosition = startY;
    
    // Resumo
    doc.setFontSize(12);
    doc.text('RESUMO DE DESPESAS', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total de Despesas: R$ ${data.totalExpenses.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Despesas Pagas: R$ ${data.totalPaid.toFixed(2)} (${data.paidCount} itens)`, 20, yPosition);
    yPosition += 6;
    doc.text(`Despesas Pendentes: R$ ${data.totalPending.toFixed(2)} (${data.pendingCount} itens)`, 20, yPosition);
    yPosition += 15;

    // Categorias
    doc.setFontSize(12);
    doc.text('DESPESAS POR CATEGORIA', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    data.categoryData.forEach((category: any) => {
      doc.text(`${category.name}:`, 25, yPosition);
      yPosition += 5;
      doc.text(`  Pagas: R$ ${category.paid.toFixed(2)}`, 30, yPosition);
      yPosition += 5;
      doc.text(`  Pendentes: R$ ${category.pending.toFixed(2)}`, 30, yPosition);
      yPosition += 5;
      doc.text(`  Total: R$ ${category.total.toFixed(2)}`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Lista de despesas
    doc.setFontSize(12);
    doc.text('LISTA DE DESPESAS', 20, yPosition);
    yPosition += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 20, yPosition);
    doc.text('Vencimento', 100, yPosition);
    doc.text('Valor', 140, yPosition);
    doc.text('Status', 170, yPosition);
    yPosition += 6;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 4;
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    data.expenses.slice(0, 30).forEach((expense: any) => {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Cabeçalho da tabela na nova página
        doc.setFont('helvetica', 'bold');
        doc.text('Descrição', 20, yPosition);
        doc.text('Vencimento', 100, yPosition);
        doc.text('Valor', 140, yPosition);
        doc.text('Status', 170, yPosition);
        yPosition += 6;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 4;
        
        doc.setFont('helvetica', 'normal');
      }
      
      // Descrição (com quebra de linha se necessário)
      const descLines = doc.splitTextToSize(expense.descricao, 75);
      descLines.forEach((line: string, i: number) => {
        doc.text(line, 20, yPosition + (i * 4));
      });
      
      // Avançar posição Y baseado no número de linhas da descrição
      const descHeight = descLines.length * 4;
      
      doc.text(format(parseISO(expense.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }), 100, yPosition);
      doc.text(`R$ ${expense.valor.toFixed(2)}`, 140, yPosition);
      
      // Status
      if (expense.pago) {
        doc.setTextColor(0, 128, 0); // Verde para pago
        doc.text('PAGO', 170, yPosition);
      } else {
        const vencimento = parseISO(expense.dataVencimento);
        if (isPast(vencimento) && !isToday(vencimento)) {
          doc.setTextColor(255, 0, 0); // Vermelho para vencido
          doc.text('VENCIDO', 170, yPosition);
        } else {
          doc.setTextColor(255, 165, 0); // Laranja para pendente
          doc.text('PENDENTE', 170, yPosition);
        }
      }
      
      doc.setTextColor(0, 0, 0); // Resetar cor
      yPosition += Math.max(descHeight, 6) + 2;
    });
  };

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
                <FileText size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Relatórios</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Análise completa do seu negócio
                </p>
              </div>
            </div>
            
            {selectedReport && reportData && (
              <div className="flex gap-4">
                <button
                  onClick={() => window.print()}
                  className={`px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-3 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  } shadow-lg`}
                >
                  <Printer size={20} />
                  Imprimir
                </button>
                
                <button
                  onClick={generatePDF}
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
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da Esquerda - Lista de Relatórios */}
          <div>
            {/* Filtro de Busca */}
            <div className={`p-6 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="relative">
                <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar relatórios..."
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                  }`}
                />
              </div>
            </div>

            {/* Lista de Relatórios */}
            <div className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText size={24} className="text-primary" />
                  Relatórios Disponíveis
                </h3>
              </div>
              
              <div className="p-4">
                {/* Relatórios de Vendas */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleCategory('sales')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                        <ShoppingCart size={20} className="text-green-600" />
                      </div>
                      <span className="font-bold">Vendas</span>
                    </div>
                    {expandedCategories.includes('sales') ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  
                  {expandedCategories.includes('sales') && (
                    <div className="mt-2 space-y-2 pl-12">
                      {availableReports
                        .filter(report => report.category === 'sales')
                        .map(report => {
                          const Icon = report.icon;
                          return (
                            <button
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedReport?.id === report.id
                                  ? theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
                                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Icon size={18} />
                              <span>{report.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                {/* Relatórios Financeiros */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleCategory('financial')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                        <DollarSign size={20} className="text-purple-600" />
                      </div>
                      <span className="font-bold">Financeiro</span>
                    </div>
                    {expandedCategories.includes('financial') ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  
                  {expandedCategories.includes('financial') && (
                    <div className="mt-2 space-y-2 pl-12">
                      {availableReports
                        .filter(report => report.category === 'financial')
                        .map(report => {
                          const Icon = report.icon;
                          return (
                            <button
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedReport?.id === report.id
                                  ? theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
                                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Icon size={18} />
                              <span>{report.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                {/* Relatórios de Produtos */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleCategory('products')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                        <Package size={20} className="text-blue-600" />
                      </div>
                      <span className="font-bold">Produtos</span>
                    </div>
                    {expandedCategories.includes('products') ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  
                  {expandedCategories.includes('products') && (
                    <div className="mt-2 space-y-2 pl-12">
                      {availableReports
                        .filter(report => report.category === 'products')
                        .map(report => {
                          const Icon = report.icon;
                          return (
                            <button
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedReport?.id === report.id
                                  ? theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
                                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Icon size={18} />
                              <span>{report.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                {/* Relatórios de Usuários */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleCategory('users')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100">
                        <Users size={20} className="text-orange-600" />
                      </div>
                      <span className="font-bold">Usuários</span>
                    </div>
                    {expandedCategories.includes('users') ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  
                  {expandedCategories.includes('users') && (
                    <div className="mt-2 space-y-2 pl-12">
                      {availableReports
                        .filter(report => report.category === 'users')
                        .map(report => {
                          const Icon = report.icon;
                          return (
                            <button
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedReport?.id === report.id
                                  ? theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
                                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Icon size={18} />
                              <span>{report.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Conteúdo do Relatório */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <selectedReport.icon size={24} className="text-primary" />
                      {selectedReport.name}
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-gray-500" />
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value as any)}
                          className={`px-4 py-2 border rounded-xl ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        >
                          <option value="today">Hoje</option>
                          <option value="yesterday">Ontem</option>
                          <option value="week">Esta semana</option>
                          <option value="month">Este mês</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={generateReport}
                        className={`p-2 rounded-lg transition-all hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title="Atualizar"
                      >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {dateRange === 'custom' && (
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Data Inicial</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-xl ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Data Final</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-xl ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <RefreshCw size={48} className="animate-spin mb-4 text-primary" />
                      <p className="text-lg font-medium">Gerando relatório...</p>
                    </div>
                  ) : reportData ? (
                    <div>
                      {/* Conteúdo específico para cada tipo de relatório */}
                      {selectedReport.id === 'sales_summary' && (
                        <SalesSummaryReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'sales_by_product' && (
                        <SalesByProductReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'sales_by_category' && (
                        <SalesByCategoryReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'sales_by_hour' && (
                        <SalesByHourReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'financial_summary' && (
                        <FinancialSummaryReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'expenses_report' && (
                        <ExpensesReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'cash_flow' && (
                        <CashFlowReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'product_inventory' && (
                        <ProductInventoryReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'low_stock' && (
                        <LowStockReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'product_performance' && (
                        <ProductPerformanceReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'user_performance' && (
                        <UserPerformanceReport data={reportData} />
                      )}
                      
                      {selectedReport.id === 'supplier_report' && (
                        <SupplierReport data={reportData} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Selecione um período</p>
                      <p className="text-sm text-gray-500">
                        Escolha um período para gerar o relatório
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText size={24} className="text-primary" />
                    Selecione um Relatório
                  </h3>
                </div>
                
                <div className="p-12 text-center">
                  <FileText size={64} className="mx-auto mb-6 text-gray-400" />
                  <h3 className="text-2xl font-bold mb-4">Nenhum relatório selecionado</h3>
                  <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Escolha um relatório na lista ao lado para visualizar os dados
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Sistema de Relatórios • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componentes de Relatórios Específicos
const SalesSummaryReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Vendas</p>
              <p className="text-2xl font-bold text-primary">{data.totalSales}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <ShoppingCart size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Itens</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalItems}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.averageTicket)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Vendas por Dia */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Vendas por Dia</h4>
        
        <div className="h-64">
          {data.dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.dailySales}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="date" 
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
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Formas de Pagamento */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Formas de Pagamento</h4>
        
        <div className="h-64">
          {data.paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.paymentData.map((entry: any, index: number) => (
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SalesByProductReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Produtos Vendidos</p>
              <p className="text-2xl font-bold text-primary">{data.totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <Package size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quantidade Total</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalQuantity}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabela de Produtos */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Produtos Mais Vendidos</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Produto</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Quantidade</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Receita</th>
                <th className="px-6 py-3 text-right text-sm font-bold">% do Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.productData.slice(0, 20).map((product: any, index: number) => {
                const percentage = (product.revenue / data.totalRevenue) * 100;
                
                return (
                  <tr key={product.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{product.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SalesByCategoryReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Categorias</p>
              <p className="text-2xl font-bold text-primary">{data.totalCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <Tag size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quantidade Total</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalQuantity}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Pizza */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Vendas por Categoria</h4>
        
        <div className="h-80">
          {data.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.pieData.map((entry: any, index: number) => (
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Categorias */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Detalhamento por Categoria</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Categoria</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Quantidade</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Receita</th>
                <th className="px-6 py-3 text-right text-sm font-bold">% do Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.categoryData.map((category: any, index: number) => {
                const percentage = (category.revenue / data.totalRevenue) * 100;
                
                return (
                  <tr key={category.name} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{category.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(category.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SalesByHourReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Vendas</p>
              <p className="text-2xl font-bold text-primary">{data.totalSales}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <ShoppingCart size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hora de Pico</p>
              <p className="text-2xl font-bold text-blue-600">{data.peakHour?.hour || 'N/A'}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Vendas por Hora */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Vendas por Hora do Dia</h4>
        
        <div className="h-80">
          {data.chartData.some((item: any) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.chartData}
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
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Horas */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Detalhamento por Hora</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Hora</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Quantidade</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Receita</th>
                <th className="px-6 py-3 text-right text-sm font-bold">% do Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.hourData.map((hour: any) => {
                const percentage = data.totalRevenue > 0 ? (hour.revenue / data.totalRevenue) * 100 : 0;
                
                return (
                  <tr key={hour.hour} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium">{hour.hour}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{hour.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(hour.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinancialSummaryReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-green-600'}`}>Total de Entradas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <ArrowRight size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-red-600'}`}>Total de Saídas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <ArrowLeft size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : data.netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo Líquido</p>
              <p className={`text-2xl font-bold ${data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(data.netBalance)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign size={24} className={data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entradas por Categoria */}
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className="text-lg font-bold mb-4">Entradas por Categoria</h4>
          
          <div className="h-64">
            {data.incomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.incomeData.map((entry: any, index: number) => (
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Nenhuma entrada no período selecionado</p>
              </div>
            )}
          </div>
          
          {/* Lista de Categorias */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {data.incomeData.map((category: any, index: number) => (
              <div key={category.name} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium capitalize">{category.name}</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(category.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Saídas por Categoria */}
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className="text-lg font-bold mb-4">Saídas por Categoria</h4>
          
          <div className="h-64">
            {data.expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.expenseData.map((entry: any, index: number) => (
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Nenhuma saída no período selecionado</p>
              </div>
            )}
          </div>
          
          {/* Lista de Categorias */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {data.expenseData.map((category: any, index: number) => (
              <div key={category.name} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium capitalize">{category.name}</span>
                  </div>
                  <span className="font-bold text-red-600">{formatCurrency(category.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpensesReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Despesas</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.totalExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <DollarSign size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-green-600'}`}>Despesas Pagas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalPaid)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-orange-600'}`}>Despesas Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalPending)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
              <Clock size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Status */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Status das Despesas</h4>
        
        <div className="h-64">
          {data.chartData.some((item: any) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#22c55e" /> {/* Verde para pagas */}
                  <Cell fill="#f97316" /> {/* Laranja para pendentes */}
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma despesa no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Despesas */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Lista de Despesas</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Descrição</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Categoria</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Vencimento</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Valor</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.expenses.slice(0, 20).map((expense: any) => {
                const vencimento = parseISO(expense.dataVencimento);
                const vencido = isPast(vencimento) && !isToday(vencimento) && !expense.pago;
                const venceHoje = isToday(vencimento) && !expense.pago;
                
                return (
                  <tr key={expense.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium">{expense.descricao}</span>
                    </td>
                    <td className="px-6 py-4 capitalize">{expense.categoria}</td>
                    <td className="px-6 py-4">
                      {format(parseISO(expense.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatCurrency(expense.valor)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.pago 
                          ? 'bg-green-100 text-green-800' 
                          : vencido 
                            ? 'bg-red-100 text-red-800' 
                            : venceHoje 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.pago 
                          ? <CheckCircle size={12} className="mr-1" />
                          : vencido 
                            ? <AlertTriangle size={12} className="mr-1" />
                            : venceHoje 
                              ? <Clock size={12} className="mr-1" />
                              : <Calendar size={12} className="mr-1" />
                        }
                        {expense.pago 
                          ? 'Pago' 
                          : vencido 
                            ? 'Vencido' 
                            : venceHoje 
                              ? 'Vence hoje' 
                              : 'A vencer'
                        }
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CashFlowReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-green-600'}`}>Total de Entradas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <ArrowRight size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-red-600'}`}>Total de Saídas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpense)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <ArrowLeft size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : data.netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo Líquido</p>
              <p className={`text-2xl font-bold ${data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(data.netBalance)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign size={24} className={data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Fluxo de Caixa */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Fluxo de Caixa Diário</h4>
        
        <div className="h-80">
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="name" 
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
                <Legend />
                <Bar dataKey="income" name="Entradas" fill="#22c55e" />
                <Bar dataKey="expense" name="Saídas" fill="#ef4444" />
                <Bar dataKey="balance" name="Saldo" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhum dado no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Fluxo Diário */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Detalhamento Diário</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Data</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Entradas</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Saídas</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Saldo</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.flowData.map((day: any) => {
                const balance = day.income - day.expense;
                
                return (
                  <tr key={day.date} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4 font-medium">{day.date}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(day.income)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      {formatCurrency(day.expense)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      <span className={balance >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                        {formatCurrency(balance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductInventoryReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Produtos</p>
              <p className="text-2xl font-bold text-primary">{data.totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <Package size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Valor do Estoque</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.inventoryValue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-orange-600'}`}>Estoque Baixo</p>
              <p className="text-2xl font-bold text-orange-600">{data.lowStockProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Categorias */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Valor do Estoque por Categoria</h4>
        
        <div className="h-80">
          {data.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.pieData.map((entry: any, index: number) => (
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhum produto em estoque</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Produtos */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Lista de Produtos</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Produto</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Código</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Categoria</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Preço</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Estoque</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Valor Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.products.filter((p: any) => p.ativo).slice(0, 20).map((product: any) => {
                const totalValue = product.preco * product.estoque;
                
                return (
                  <tr key={product.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium">{product.nome}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">{product.codigo}</td>
                    <td className="px-6 py-4">{product.categoria}</td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(product.preco)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${
                        product.estoque === 0 
                          ? 'text-red-600' 
                          : product.estoque <= product.estoqueMinimo 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                      }`}>
                        {product.estoque}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LowStockReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-orange-600'}`}>Estoque Baixo</p>
              <p className="text-2xl font-bold text-orange-600">{data.totalLowStock}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-red-600'}`}>Sem Estoque</p>
              <p className="text-2xl font-bold text-red-600">{data.outOfStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-600'}`}>Estado Crítico</p>
              <p className="text-2xl font-bold text-yellow-600">{data.criticalProducts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Status */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Distribuição por Status</h4>
        
        <div className="h-64">
          {data.chartData.some((item: any) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#ef4444" /> {/* Vermelho para sem estoque */}
                  <Cell fill="#f97316" /> {/* Laranja para crítico */}
                  <Cell fill="#eab308" /> {/* Amarelo para alerta */}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value} produtos`}
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhum produto com estoque baixo</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Produtos */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Produtos com Estoque Baixo</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Produto</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Código</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Categoria</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Estoque</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Mínimo</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.lowStockProducts.slice(0, 20).map((product: any) => {
                const percentage = (product.estoque / product.estoqueMinimo) * 100;
                let status = '';
                let statusClass = '';
                
                if (product.estoque === 0) {
                  status = 'Sem Estoque';
                  statusClass = 'bg-red-100 text-red-800';
                } else if (product.estoque <= product.estoqueMinimo * 0.5) {
                  status = 'Crítico';
                  statusClass = 'bg-orange-100 text-orange-800';
                } else {
                  status = 'Alerta';
                  statusClass = 'bg-yellow-100 text-yellow-800';
                }
                
                return (
                  <tr key={product.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium">{product.nome}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">{product.codigo}</td>
                    <td className="px-6 py-4">{product.categoria}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${
                        product.estoque === 0 
                          ? 'text-red-600' 
                          : product.estoque <= product.estoqueMinimo * 0.5 
                            ? 'text-orange-600' 
                            : 'text-yellow-600'
                      }`}>
                        {product.estoque}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.estoqueMinimo}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                        {product.estoque === 0 
                          ? <XCircle size={12} className="mr-1" />
                          : <AlertTriangle size={12} className="mr-1" />
                        }
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductPerformanceReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Produtos Vendidos</p>
              <p className="text-2xl font-bold text-primary">{data.performanceData.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <Package size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quantidade Total</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalQuantity}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Top Produtos */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Top 10 Produtos por Receita</h4>
        
        <div className="h-80">
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  type="number"
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                  width={150}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#374151' : '#fff',
                    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Produtos */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Desempenho de Produtos</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Produto</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Categoria</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Quantidade</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Receita</th>
                <th className="px-6 py-3 text-right text-sm font-bold">% do Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.performanceData.slice(0, 20).map((product: any, index: number) => {
                const percentage = (product.revenue / data.totalRevenue) * 100;
                
                return (
                  <tr key={product.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4 text-center">{product.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const UserPerformanceReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Vendas</p>
              <p className="text-2xl font-bold text-primary">{data.totalSales}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <ShoppingCart size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Vendedores Ativos</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Desempenho */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Desempenho por Vendedor</h4>
        
        <div className="h-80">
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.chartData.map((entry: any, index: number) => (
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
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Vendedores */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Desempenho Detalhado</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Vendedor</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Vendas</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Itens</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Receita</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Ticket Médio</th>
                <th className="px-6 py-3 text-right text-sm font-bold">% do Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.performanceData.map((user: any, index: number) => {
                const percentage = (user.revenue / data.totalRevenue) * 100;
                
                return (
                  <tr key={user.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          <Users size={16} className="text-white" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{user.sales}</td>
                    <td className="px-6 py-4 text-center">{user.items}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(user.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(user.averageTicket)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SupplierReport: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Resumo em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fornecedores</p>
              <p className="text-2xl font-bold text-primary">{data.totalSuppliers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
              <Truck size={24} className="text-primary" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Produtos</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Valor do Estoque</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalStockValue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Fornecedores */}
      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className="text-lg font-bold mb-4">Top Fornecedores por Valor em Estoque</h4>
        
        <div className="h-80">
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  type="number"
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                  width={150}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#374151' : '#fff',
                    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhum fornecedor com produtos em estoque</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabela de Fornecedores */}
      <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="p-6 border-b border-gray-600">
          <h4 className="text-lg font-bold">Detalhamento por Fornecedor</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Fornecedor</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Produtos</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Estoque Baixo</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Sem Estoque</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Valor em Estoque</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-300'}`}>
              {data.supplierData.filter((s: any) => s.active).map((supplier: any) => (
                <tr key={supplier.id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Truck size={20} className="text-blue-600" />
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">{supplier.productCount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={supplier.lowStockCount > 0 ? 'text-orange-600 font-bold' : ''}>
                      {supplier.lowStockCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={supplier.outOfStockCount > 0 ? 'text-red-600 font-bold' : ''}>
                      {supplier.outOfStockCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {formatCurrency(supplier.stockValue)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.active 
                        ? <CheckCircle size={12} className="mr-1" />
                        : <XCircle size={12} className="mr-1" />
                      }
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default ReportsScreen;