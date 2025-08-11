import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession } from '../types';

class DatabaseService {
  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem('pdv_users') || '[]');
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem('pdv_users', JSON.stringify(users));
  }

  private getProducts(): Product[] {
    return JSON.parse(localStorage.getItem('pdv_products') || '[]');
  }

  private saveProducts(products: Product[]): void {
    localStorage.setItem('pdv_products', JSON.stringify(products));
  }

  private getSuppliers(): Supplier[] {
    return JSON.parse(localStorage.getItem('pdv_suppliers') || '[]');
  }

  private saveSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem('pdv_suppliers', JSON.stringify(suppliers));
  }

  private getSales(): Sale[] {
    return JSON.parse(localStorage.getItem('pdv_sales') || '[]');
  }

  private saveSales(sales: Sale[]): void {
    localStorage.setItem('pdv_sales', JSON.stringify(sales));
  }

  private getCashMovements(): CashMovement[] {
    return JSON.parse(localStorage.getItem('pdv_cash_movements') || '[]');
  }

  private saveCashMovements(movements: CashMovement[]): void {
    localStorage.setItem('pdv_cash_movements', JSON.stringify(movements));
  }

  private getExpenses(): Expense[] {
    return JSON.parse(localStorage.getItem('pdv_expenses') || '[]');
  }

  private saveExpenses(expenses: Expense[]): void {
    localStorage.setItem('pdv_expenses', JSON.stringify(expenses));
  }

  private getCashRegisters(): CashRegister[] {
    return JSON.parse(localStorage.getItem('pdv_cash_registers') || '[]');
  }

  private saveCashRegisters(registers: CashRegister[]): void {
    localStorage.setItem('pdv_cash_registers', JSON.stringify(registers));
  }

  private getCashSessions(): CashSession[] {
    return JSON.parse(localStorage.getItem('pdv_cash_sessions') || '[]');
  }

  private saveCashSessions(sessions: CashSession[]): void {
    localStorage.setItem('pdv_cash_sessions', JSON.stringify(sessions));
  }

  // Usuários
  createUser(user: Omit<User, 'id' | 'criadoEm'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return true;
  }

  getAllUsers(): User[] {
    return this.getUsers();
  }

  // Produtos
  createProduct(product: Omit<Product, 'id' | 'criadoEm'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString()
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    products[index] = { ...products[index], ...updates };
    this.saveProducts(products);
    return true;
  }

  getAllProducts(): Product[] {
    return this.getProducts();
  }

  getProductByCode(code: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => 
      p.codigo === code || 
      p.codigoBarras === code ||
      p.nome.toLowerCase().includes(code.toLowerCase())
    );
  }

  // Fornecedores
  createSupplier(supplier: Omit<Supplier, 'id' | 'criadoEm'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    this.saveSuppliers(suppliers);
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): boolean {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    suppliers[index] = { ...suppliers[index], ...updates };
    this.saveSuppliers(suppliers);
    return true;
  }

  getAllSuppliers(): Supplier[] {
    return this.getSuppliers();
  }

  // Vendas
  createSale(sale: Omit<Sale, 'id' | 'numero'>): Sale {
    const sales = this.getSales();
    const newSale: Sale = {
      ...sale,
      id: Math.random().toString(36).substr(2, 9),
      numero: sales.length + 1
    };
    sales.push(newSale);
    this.saveSales(sales);

    // Atualizar estoque
    sale.itens.forEach(item => {
      const products = this.getProducts();
      const productIndex = products.findIndex(p => p.id === item.produtoId);
      if (productIndex !== -1) {
        products[productIndex].estoque -= item.quantidade;
        this.saveProducts(products);
      }
    });

    // Registrar movimentação de caixa para cada forma de pagamento
    if (!sale.cancelada) {
      sale.pagamentos.forEach(pagamento => {
        const movement: Omit<CashMovement, 'id' | 'data'> = {
          caixaId: sale.caixaId || '',
          tipo: 'entrada',
          categoria: 'venda',
          descricao: `Venda #${newSale.numero}`,
          valor: pagamento.valor,
          formaPagamento: pagamento.tipo,
          vendaId: newSale.id,
          usuarioId: sale.vendedorId,
          usuario: sale.vendedor,
          observacoes: `Venda realizada via ${pagamento.tipo}`
        };
        this.createCashMovement(movement);
      });
    }

    return newSale;
  }

  getAllSales(): Sale[] {
    return this.getSales();
  }

  // Caixas
  createCashRegister(register: Omit<CashRegister, 'id' | 'criadoEm'>): CashRegister {
    const registers = this.getCashRegisters();
    const newRegister: CashRegister = {
      ...register,
      id: Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString()
    };
    registers.push(newRegister);
    this.saveCashRegisters(registers);
    return newRegister;
  }

  updateCashRegister(id: string, updates: Partial<CashRegister>): boolean {
    const registers = this.getCashRegisters();
    const index = registers.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    registers[index] = { ...registers[index], ...updates };
    this.saveCashRegisters(registers);
    return true;
  }

  getAllCashRegisters(): CashRegister[] {
    return this.getCashRegisters();
  }

  // Sessões de Caixa
  openCashSession(sessionData: Omit<CashSession, 'id' | 'dataAbertura' | 'status' | 'totalVendas' | 'totalEntradas' | 'totalSaidas'>): CashSession {
    const sessions = this.getCashSessions();
    const newSession: CashSession = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9),
      dataAbertura: new Date().toISOString(),
      status: 'aberto',
      totalVendas: 0,
      totalEntradas: 0,
      totalSaidas: 0
    };
    sessions.push(newSession);
    this.saveCashSessions(sessions);

    // Registrar movimentação de abertura
    if (sessionData.valorAbertura > 0) {
      this.createCashMovement({
        caixaId: sessionData.caixaId,
        sessaoId: newSession.id,
        tipo: 'entrada',
        categoria: 'abertura',
        descricao: 'Abertura de caixa',
        valor: sessionData.valorAbertura,
        formaPagamento: 'dinheiro',
        usuarioId: sessionData.usuarioId,
        usuario: sessionData.usuario,
        observacoes: sessionData.observacoesAbertura
      });
    }

    return newSession;
  }

  closeCashSession(sessionId: string, valorFechamento: number, observacoes?: string): boolean {
    const sessions = this.getCashSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;

    const session = sessions[index];
    sessions[index] = {
      ...session,
      dataFechamento: new Date().toISOString(),
      valorFechamento,
      observacoesFechamento: observacoes,
      status: 'fechado'
    };
    this.saveCashSessions(sessions);

    // Registrar movimentação de fechamento se necessário
    if (valorFechamento > 0) {
      this.createCashMovement({
        caixaId: session.caixaId,
        sessaoId: sessionId,
        tipo: 'saida',
        categoria: 'fechamento',
        descricao: 'Fechamento de caixa',
        valor: valorFechamento,
        formaPagamento: 'dinheiro',
        usuarioId: session.usuarioId,
        usuario: session.usuario,
        observacoes
      });
    }

    return true;
  }

  getCurrentCashSession(userId: string): CashSession | null {
    const sessions = this.getCashSessions();
    return sessions.find(s => s.usuarioId === userId && s.status === 'aberto') || null;
  }

  getAllCashSessions(): CashSession[] {
    return this.getCashSessions();
  }

  // Movimentação de Caixa
  createCashMovement(movement: Omit<CashMovement, 'id' | 'data'>): CashMovement {
    const movements = this.getCashMovements();
    const newMovement: CashMovement = {
      ...movement,
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toISOString()
    };
    movements.push(newMovement);
    this.saveCashMovements(movements);

    // Atualizar totais da sessão se houver
    if (movement.sessaoId) {
      this.updateSessionTotals(movement.sessaoId);
    }

    return newMovement;
  }

  private updateSessionTotals(sessionId: string): void {
    const sessions = this.getCashSessions();
    const movements = this.getCashMovements();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const sessionMovements = movements.filter(m => m.sessaoId === sessionId);
      const totalEntradas = sessionMovements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
      const totalSaidas = sessionMovements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
      const totalVendas = sessionMovements.filter(m => m.categoria === 'venda').reduce((sum, m) => sum + m.valor, 0);

      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        totalEntradas,
        totalSaidas,
        totalVendas
      };
      this.saveCashSessions(sessions);
    }
  }

  getAllCashMovements(): CashMovement[] {
    return this.getCashMovements();
  }

  // Despesas
  createExpense(expense: Omit<Expense, 'id' | 'criadoEm'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString()
    };
    expenses.push(newExpense);
    this.saveExpenses(expenses);
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>): boolean {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    expenses[index] = { ...expenses[index], ...updates };
    this.saveExpenses(expenses);
    return true;
  }

  deleteExpense(id: string): boolean {
    const expenses = this.getExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    if (filteredExpenses.length === expenses.length) return false;
    
    this.saveExpenses(filteredExpenses);
    return true;
  }

  getAllExpenses(): Expense[] {
    return this.getExpenses();
  }

  // Inicialização
  initializeData(): void {
    const users = this.getUsers();
    
    // Sempre recriar usuários padrão se não existirem
    const adminExists = users.find(u => u.usuario === 'admin');
    const gerenteExists = users.find(u => u.usuario === 'gerente');
    const vendedorExists = users.find(u => u.usuario === 'vendedor');
    
    if (!adminExists) {
      this.createUser({
        nome: 'Administrador do Sistema',
        usuario: 'admin',
        senha: '123456',
        tipo: 'administrador',
        ativo: true
      });
    }
    
    if (!gerenteExists) {
      this.createUser({
        nome: 'Gerente da Loja',
        usuario: 'gerente',
        senha: '123456',
        tipo: 'gerente',
        ativo: true
      });
    }
    
    if (!vendedorExists) {
      this.createUser({
        nome: 'Vendedor da Loja',
        usuario: 'vendedor',
        senha: '123456',
        tipo: 'vendedor',
        ativo: true
      });
    }
    
    if (users.length === 0) {
      // Criar caixa padrão
      this.createCashRegister({
        nome: 'Caixa Principal',
        descricao: 'Caixa principal da loja',
        ativo: true
      });

      // Criar fornecedores de exemplo
      const sampleSuppliers = [
        {
          nome: 'Distribuidora ABC Ltda',
          cnpjCpf: '12.345.678/0001-90',
          telefone: '(11) 99999-9999',
          email: 'contato@distribuidoraabc.com',
          endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP',
          website: 'www.distribuidoraabc.com',
          observacoes: 'Fornecedor principal de revistas e jornais',
          ativo: true
        },
        {
          nome: 'Fornecedor XYZ',
          cnpjCpf: '98.765.432/0001-10',
          telefone: '(11) 88888-8888',
          email: 'vendas@fornecedorxyz.com',
          endereco: 'Av. Principal, 456 - Jardim - São Paulo/SP',
          website: 'www.fornecedorxyz.com.br',
          observacoes: 'Fornecedor de produtos diversos',
          ativo: true
        },
        {
          nome: 'Distribuidora de Bebidas Refrescante',
          cnpjCpf: '45.678.901/0001-23',
          telefone: '(11) 97777-7777',
          email: 'comercial@refrescante.com.br',
          endereco: 'Rua das Bebidas, 789 - Vila Industrial - São Paulo/SP',
          website: 'www.refrescante.com.br',
          observacoes: 'Fornecedor de refrigerantes e água',
          ativo: true
        }
      ];

      sampleSuppliers.forEach(supplier => this.createSupplier(supplier));

      // Criar produtos de exemplo
      const sampleProducts = [
        {
          nome: 'Jornal O Globo',
          codigo: '001',
          codigoBarras: '7891234567890',
          preco: 3.50,
          categoria: 'JORNAIS',
          estoque: 50,
          estoqueMinimo: 10,
          ativo: true
        },
        {
          nome: 'Revista Veja',
          codigo: '002',
          codigoBarras: '7891234567891',
          preco: 12.90,
          categoria: 'REVISTAS',
          estoque: 30,
          estoqueMinimo: 5,
          ativo: true
        },
        {
          nome: 'Chiclete Trident',
          codigo: '003',
          codigoBarras: '7891234567892',
          preco: 2.50,
          categoria: 'DOCES',
          estoque: 100,
          estoqueMinimo: 20,
          ativo: true
        },
        {
          nome: 'Água Mineral 500ml',
          codigo: '004',
          codigoBarras: '7891234567893',
          preco: 2.00,
          categoria: 'BEBIDAS',
          estoque: 80,
          estoqueMinimo: 15,
          ativo: true
        },
        {
          nome: 'Cigarro Marlboro',
          codigo: '005',
          codigoBarras: '7891234567894',
          preco: 8.50,
          categoria: 'CIGARROS',
          estoque: 40,
          estoqueMinimo: 10,
          ativo: true
        }
      ];

      sampleProducts.forEach(product => this.createProduct(product));

      // Criar despesas de exemplo
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const sampleExpenses = [
        {
          descricao: 'Aluguel da Loja',
          categoria: 'fixa' as const,
          valor: 1500.00,
          dataVencimento: new Date().toISOString().split('T')[0],
          pago: true,
          dataPagamento: lastMonth.toISOString().split('T')[0],
          recorrente: true,
          formaPagamento: 'transferencia' as const,
          parcelas: 1,
          observacoes: 'Pagamento mensal do aluguel',
          usuarioId: 'admin'
        },
        {
          descricao: 'Energia Elétrica',
          categoria: 'fixa' as const,
          valor: 250.00,
          dataVencimento: nextMonth.toISOString().split('T')[0],
          pago: false,
          recorrente: true,
          formaPagamento: 'dinheiro' as const,
          parcelas: 1,
          observacoes: 'Conta de energia mensal',
          usuarioId: 'admin'
        },
        {
          descricao: 'Fornecedor ABC',
          categoria: 'variavel' as const,
          valor: 850.00,
          dataVencimento: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pago: false,
          recorrente: false,
          formaPagamento: 'dinheiro' as const,
          parcelas: 1,
          observacoes: 'Pagamento de mercadorias',
          usuarioId: 'admin'
        },
        {
          descricao: 'Internet',
          categoria: 'fixa' as const,
          valor: 120.00,
          dataVencimento: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pago: false,
          recorrente: true,
          formaPagamento: 'dinheiro' as const,
          parcelas: 1,
          observacoes: 'Internet fibra 200MB',
          usuarioId: 'admin'
        },
        {
          descricao: 'Manutenção do Sistema',
          categoria: 'fixa' as const,
          valor: 99.90,
          dataVencimento: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pago: false,
          recorrente: true,
          formaPagamento: 'cartao_credito' as const,
          parcelas: 1,
          observacoes: 'Mensalidade do sistema PDV',
          usuarioId: 'admin'
        }
      ];

      sampleExpenses.forEach(expense => this.createExpense(expense));
    }
  }

  // Método para resetar usuários padrão
  resetDefaultUsers(): void {
    // Remover usuários existentes
    const users = this.getUsers();
    const filteredUsers = users.filter(u => !['admin', 'gerente', 'vendedor'].includes(u.usuario));
    
    // Adicionar usuários padrão
    const defaultUsers = [
      {
        nome: 'Administrador do Sistema',
        usuario: 'admin',
        senha: '123456',
        tipo: 'administrador' as const,
        ativo: true
      },
      {
        nome: 'Gerente da Loja',
        usuario: 'gerente',
        senha: '123456',
        tipo: 'gerente' as const,
        ativo: true
      },
      {
        nome: 'Vendedor da Loja',
        usuario: 'vendedor',
        senha: '123456',
        tipo: 'vendedor' as const,
        ativo: true
      }
    ];
    
    defaultUsers.forEach(userData => {
      const newUser = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
        criadoEm: new Date().toISOString()
      };
      filteredUsers.push(newUser);
    });
    
    this.saveUsers(filteredUsers);
  }

  // Backup
  exportData(): string {
    const data = {
      users: this.getUsers(),
      products: this.getProducts(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      cashMovements: this.getCashMovements(),
      expenses: this.getExpenses(),
      cashRegisters: this.getCashRegisters(),
      cashSessions: this.getCashSessions(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.users) localStorage.setItem('pdv_users', JSON.stringify(data.users));
      if (data.products) localStorage.setItem('pdv_products', JSON.stringify(data.products));
      if (data.suppliers) localStorage.setItem('pdv_suppliers', JSON.stringify(data.suppliers));
      if (data.sales) localStorage.setItem('pdv_sales', JSON.stringify(data.sales));
      if (data.cashMovements) localStorage.setItem('pdv_cash_movements', JSON.stringify(data.cashMovements));
      if (data.expenses) localStorage.setItem('pdv_expenses', JSON.stringify(data.expenses));
      if (data.cashRegisters) localStorage.setItem('pdv_cash_registers', JSON.stringify(data.cashRegisters));
      if (data.cashSessions) localStorage.setItem('pdv_cash_sessions', JSON.stringify(data.cashSessions));
      return true;
    } catch {
      return false;
    }
  }
}

export const db = new DatabaseService();

// Para compatibilidade, manter a exportação original
export default db;