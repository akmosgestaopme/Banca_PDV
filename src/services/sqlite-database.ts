import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession } from '../types';

class SQLiteDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Definir caminho do banco de dados na pasta do usuário
    const userDataPath = app?.getPath('userData') || './data';
    this.dbPath = path.join(userDataPath, 'pdv_database.db');
    
    // Criar pasta se não existir
    const fs = require('fs');
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.initializeTables();
    this.initializeDefaultData();
  }

  private initializeTables(): void {
    // Tabela de usuários
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('administrador', 'gerente', 'vendedor')),
        ativo BOOLEAN NOT NULL DEFAULT 1,
        criadoEm TEXT NOT NULL
      )
    `);

    // Tabela de produtos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        codigoBarras TEXT,
        preco REAL NOT NULL,
        categoria TEXT NOT NULL,
        estoque INTEGER NOT NULL DEFAULT 0,
        estoqueMinimo INTEGER NOT NULL DEFAULT 0,
        fornecedorId TEXT,
        foto TEXT,
        ativo BOOLEAN NOT NULL DEFAULT 1,
        criadoEm TEXT NOT NULL,
        FOREIGN KEY (fornecedorId) REFERENCES suppliers (id)
      )
    `);

    // Tabela de fornecedores
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cnpjCpf TEXT NOT NULL,
        telefone TEXT NOT NULL,
        email TEXT NOT NULL,
        endereco TEXT,
        website TEXT,
        observacoes TEXT,
        ativo BOOLEAN NOT NULL DEFAULT 1,
        criadoEm TEXT NOT NULL
      )
    `);

    // Tabela de caixas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT,
        ativo BOOLEAN NOT NULL DEFAULT 1,
        criadoEm TEXT NOT NULL
      )
    `);

    // Tabela de sessões de caixa
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id TEXT PRIMARY KEY,
        caixaId TEXT NOT NULL,
        caixa TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        usuario TEXT NOT NULL,
        dataAbertura TEXT NOT NULL,
        dataFechamento TEXT,
        valorAbertura REAL NOT NULL DEFAULT 0,
        valorFechamento REAL,
        totalVendas REAL NOT NULL DEFAULT 0,
        totalEntradas REAL NOT NULL DEFAULT 0,
        totalSaidas REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK (status IN ('aberto', 'fechado')),
        observacoesAbertura TEXT,
        observacoesFechamento TEXT,
        FOREIGN KEY (caixaId) REFERENCES cash_registers (id),
        FOREIGN KEY (usuarioId) REFERENCES users (id)
      )
    `);

    // Tabela de movimentações de caixa
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_movements (
        id TEXT PRIMARY KEY,
        caixaId TEXT NOT NULL,
        sessaoId TEXT,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
        categoria TEXT NOT NULL,
        subcategoria TEXT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        formaPagamento TEXT NOT NULL,
        vendaId TEXT,
        usuarioId TEXT NOT NULL,
        usuario TEXT NOT NULL,
        data TEXT NOT NULL,
        comprovante TEXT,
        observacoes TEXT,
        FOREIGN KEY (caixaId) REFERENCES cash_registers (id),
        FOREIGN KEY (sessaoId) REFERENCES cash_sessions (id),
        FOREIGN KEY (usuarioId) REFERENCES users (id)
      )
    `);

    // Tabela de vendas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        subtotal REAL NOT NULL,
        desconto REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        troco REAL NOT NULL DEFAULT 0,
        vendedorId TEXT NOT NULL,
        vendedor TEXT NOT NULL,
        clienteNome TEXT,
        observacoes TEXT,
        dataVenda TEXT NOT NULL,
        cancelada BOOLEAN NOT NULL DEFAULT 0,
        caixaId TEXT,
        FOREIGN KEY (vendedorId) REFERENCES users (id),
        FOREIGN KEY (caixaId) REFERENCES cash_registers (id)
      )
    `);

    // Tabela de itens de venda
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        vendaId TEXT NOT NULL,
        produtoId TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        precoUnitario REAL NOT NULL,
        desconto REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        FOREIGN KEY (vendaId) REFERENCES sales (id),
        FOREIGN KEY (produtoId) REFERENCES products (id)
      )
    `);

    // Tabela de pagamentos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_payments (
        id TEXT PRIMARY KEY,
        vendaId TEXT NOT NULL,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        parcelas INTEGER DEFAULT 1,
        FOREIGN KEY (vendaId) REFERENCES sales (id)
      )
    `);

    // Tabela de despesas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        descricao TEXT NOT NULL,
        categoria TEXT NOT NULL CHECK (categoria IN ('fixa', 'variavel')),
        valor REAL NOT NULL,
        dataVencimento TEXT NOT NULL,
        dataPagamento TEXT,
        pago BOOLEAN NOT NULL DEFAULT 0,
        recorrente BOOLEAN NOT NULL DEFAULT 0,
        formaPagamento TEXT,
        parcelas INTEGER DEFAULT 1,
        observacoes TEXT,
        usuarioId TEXT NOT NULL,
        criadoEm TEXT NOT NULL,
        FOREIGN KEY (usuarioId) REFERENCES users (id)
      )
    `);

    // Criar índices para melhor performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_codigo ON products (codigo);
      CREATE INDEX IF NOT EXISTS idx_products_codigoBarras ON products (codigoBarras);
      CREATE INDEX IF NOT EXISTS idx_sales_dataVenda ON sales (dataVenda);
      CREATE INDEX IF NOT EXISTS idx_cash_movements_data ON cash_movements (data);
      CREATE INDEX IF NOT EXISTS idx_expenses_dataVencimento ON expenses (dataVencimento);
    `);
  }

  private initializeDefaultData(): void {
    // Verificar se já existem usuários
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      // Criar usuários padrão
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, nome, usuario, senha, tipo, ativo, criadoEm)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultUsers = [
        {
          id: 'admin-001',
          nome: 'Administrador do Sistema',
          usuario: 'admin',
          senha: '123456',
          tipo: 'administrador',
          ativo: true,
          criadoEm: new Date().toISOString()
        },
        {
          id: 'gerente-001',
          nome: 'Gerente da Loja',
          usuario: 'gerente',
          senha: '123456',
          tipo: 'gerente',
          ativo: true,
          criadoEm: new Date().toISOString()
        },
        {
          id: 'vendedor-001',
          nome: 'Vendedor da Loja',
          usuario: 'vendedor',
          senha: '123456',
          tipo: 'vendedor',
          ativo: true,
          criadoEm: new Date().toISOString()
        }
      ];

      defaultUsers.forEach(user => {
        insertUser.run(user.id, user.nome, user.usuario, user.senha, user.tipo, user.ativo, user.criadoEm);
      });

      // Criar caixa padrão
      this.db.prepare(`
        INSERT INTO cash_registers (id, nome, descricao, ativo, criadoEm)
        VALUES (?, ?, ?, ?, ?)
      `).run('caixa-001', 'Caixa Principal', 'Caixa principal da loja', true, new Date().toISOString());

      // Criar produtos de exemplo
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, nome, codigo, codigoBarras, preco, categoria, estoque, estoqueMinimo, ativo, criadoEm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const sampleProducts = [
        ['prod-001', 'Jornal O Globo', '001', '7891234567890', 3.50, 'JORNAIS', 50, 10, true, new Date().toISOString()],
        ['prod-002', 'Revista Veja', '002', '7891234567891', 12.90, 'REVISTAS', 30, 5, true, new Date().toISOString()],
        ['prod-003', 'Chiclete Trident', '003', '7891234567892', 2.50, 'DOCES', 100, 20, true, new Date().toISOString()],
        ['prod-004', 'Água Mineral 500ml', '004', '7891234567893', 2.00, 'BEBIDAS', 80, 15, true, new Date().toISOString()],
        ['prod-005', 'Cigarro Marlboro', '005', '7891234567894', 8.50, 'CIGARROS', 40, 10, true, new Date().toISOString()]
      ];

      sampleProducts.forEach(product => {
        insertProduct.run(...product);
      });
    }
  }

  // Métodos para usuários
  createUser(user: Omit<User, 'id' | 'criadoEm'>): User {
    const id = Math.random().toString(36).substr(2, 9);
    const criadoEm = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO users (id, nome, usuario, senha, tipo, ativo, criadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.nome, user.usuario, user.senha, user.tipo, user.ativo, criadoEm);

    return { ...user, id, criadoEm };
  }

  getAllUsers(): User[] {
    return this.db.prepare('SELECT * FROM users ORDER BY nome').all() as User[];
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = this.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }

  // Métodos para produtos
  createProduct(product: Omit<Product, 'id' | 'criadoEm'>): Product {
    const id = Math.random().toString(36).substr(2, 9);
    const criadoEm = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO products (id, nome, codigo, codigoBarras, preco, categoria, estoque, estoqueMinimo, fornecedorId, foto, ativo, criadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, product.nome, product.codigo, product.codigoBarras, product.preco, product.categoria, 
           product.estoque, product.estoqueMinimo, product.fornecedorId, product.foto, product.ativo, criadoEm);

    return { ...product, id, criadoEm };
  }

  getAllProducts(): Product[] {
    return this.db.prepare('SELECT * FROM products ORDER BY nome').all() as Product[];
  }

  updateProduct(id: string, updates: Partial<Product>): boolean {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = this.db.prepare(`UPDATE products SET ${fields} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }

  getProductByCode(code: string): Product | undefined {
    return this.db.prepare(`
      SELECT * FROM products 
      WHERE codigo = ? OR codigoBarras = ? OR nome LIKE ?
      LIMIT 1
    `).get(code, code, `%${code}%`) as Product | undefined;
  }

  // Métodos para fornecedores
  createSupplier(supplier: Omit<Supplier, 'id' | 'criadoEm'>): Supplier {
    const id = Math.random().toString(36).substr(2, 9);
    const criadoEm = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO suppliers (id, nome, cnpjCpf, telefone, email, endereco, website, observacoes, ativo, criadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, supplier.nome, supplier.cnpjCpf, supplier.telefone, supplier.email, 
           supplier.endereco, supplier.website, supplier.observacoes, supplier.ativo, criadoEm);

    return { ...supplier, id, criadoEm };
  }

  getAllSuppliers(): Supplier[] {
    return this.db.prepare('SELECT * FROM suppliers ORDER BY nome').all() as Supplier[];
  }

  updateSupplier(id: string, updates: Partial<Supplier>): boolean {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = this.db.prepare(`UPDATE suppliers SET ${fields} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }

  // Métodos para caixas
  createCashRegister(register: Omit<CashRegister, 'id' | 'criadoEm'>): CashRegister {
    const id = Math.random().toString(36).substr(2, 9);
    const criadoEm = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO cash_registers (id, nome, descricao, ativo, criadoEm)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, register.nome, register.descricao, register.ativo, criadoEm);

    return { ...register, id, criadoEm };
  }

  getAllCashRegisters(): CashRegister[] {
    return this.db.prepare('SELECT * FROM cash_registers ORDER BY nome').all() as CashRegister[];
  }

  updateCashRegister(id: string, updates: Partial<CashRegister>): boolean {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = this.db.prepare(`UPDATE cash_registers SET ${fields} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }

  // Métodos para sessões de caixa
  openCashSession(sessionData: Omit<CashSession, 'id' | 'dataAbertura' | 'status' | 'totalVendas' | 'totalEntradas' | 'totalSaidas'>): CashSession {
    const id = Math.random().toString(36).substr(2, 9);
    const dataAbertura = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO cash_sessions (id, caixaId, caixa, usuarioId, usuario, dataAbertura, valorAbertura, status, totalVendas, totalEntradas, totalSaidas, observacoesAbertura)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sessionData.caixaId, sessionData.caixa, sessionData.usuarioId, sessionData.usuario, 
           dataAbertura, sessionData.valorAbertura, 'aberto', 0, 0, 0, sessionData.observacoesAbertura);

    return {
      ...sessionData,
      id,
      dataAbertura,
      status: 'aberto',
      totalVendas: 0,
      totalEntradas: 0,
      totalSaidas: 0
    };
  }

  closeCashSession(sessionId: string, valorFechamento: number, observacoes?: string): boolean {
    const result = this.db.prepare(`
      UPDATE cash_sessions 
      SET dataFechamento = ?, valorFechamento = ?, observacoesFechamento = ?, status = ?
      WHERE id = ?
    `).run(new Date().toISOString(), valorFechamento, observacoes, 'fechado', sessionId);

    return result.changes > 0;
  }

  getAllCashSessions(): CashSession[] {
    return this.db.prepare('SELECT * FROM cash_sessions ORDER BY dataAbertura DESC').all() as CashSession[];
  }

  // Métodos para movimentações de caixa
  createCashMovement(movement: Omit<CashMovement, 'id' | 'data'>): CashMovement {
    const id = Math.random().toString(36).substr(2, 9);
    const data = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO cash_movements (id, caixaId, sessaoId, tipo, categoria, subcategoria, descricao, valor, formaPagamento, vendaId, usuarioId, usuario, data, comprovante, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, movement.caixaId, movement.sessaoId, movement.tipo, movement.categoria, movement.subcategoria,
           movement.descricao, movement.valor, movement.formaPagamento, movement.vendaId, movement.usuarioId,
           movement.usuario, data, movement.comprovante, movement.observacoes);

    return { ...movement, id, data };
  }

  getAllCashMovements(): CashMovement[] {
    return this.db.prepare('SELECT * FROM cash_movements ORDER BY data DESC').all() as CashMovement[];
  }

  // Métodos para vendas
  createSale(sale: Omit<Sale, 'id' | 'numero'>): Sale {
    const id = Math.random().toString(36).substr(2, 9);
    const numero = this.getNextSaleNumber();
    
    // Inserir venda
    this.db.prepare(`
      INSERT INTO sales (id, numero, subtotal, desconto, total, troco, vendedorId, vendedor, clienteNome, observacoes, dataVenda, cancelada, caixaId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, numero, sale.subtotal, sale.desconto, sale.total, sale.troco, sale.vendedorId,
           sale.vendedor, sale.clienteNome, sale.observacoes, sale.dataVenda, sale.cancelada, sale.caixaId);

    // Inserir itens da venda
    const insertItem = this.db.prepare(`
      INSERT INTO sale_items (id, vendaId, produtoId, quantidade, precoUnitario, desconto, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    sale.itens.forEach(item => {
      const itemId = Math.random().toString(36).substr(2, 9);
      insertItem.run(itemId, id, item.produtoId, item.quantidade, item.precoUnitario, item.desconto, item.total);
      
      // Atualizar estoque
      this.db.prepare('UPDATE products SET estoque = estoque - ? WHERE id = ?').run(item.quantidade, item.produtoId);
    });

    // Inserir pagamentos
    const insertPayment = this.db.prepare(`
      INSERT INTO sale_payments (id, vendaId, tipo, valor, parcelas)
      VALUES (?, ?, ?, ?, ?)
    `);

    sale.pagamentos.forEach(pagamento => {
      const paymentId = Math.random().toString(36).substr(2, 9);
      insertPayment.run(paymentId, id, pagamento.tipo, pagamento.valor, pagamento.parcelas);
    });

    return { ...sale, id, numero };
  }

  private getNextSaleNumber(): number {
    const result = this.db.prepare('SELECT MAX(numero) as maxNumber FROM sales').get() as { maxNumber: number | null };
    return (result.maxNumber || 0) + 1;
  }

  getAllSales(): Sale[] {
    const sales = this.db.prepare('SELECT * FROM sales ORDER BY dataVenda DESC').all() as Sale[];
    
    // Carregar itens e pagamentos para cada venda
    return sales.map(sale => {
      const itens = this.db.prepare(`
        SELECT si.*, p.nome, p.codigo, p.categoria, p.preco, p.estoque, p.estoqueMinimo, p.foto, p.ativo, p.criadoEm
        FROM sale_items si
        JOIN products p ON si.produtoId = p.id
        WHERE si.vendaId = ?
      `).all(sale.id) as any[];

      const pagamentos = this.db.prepare('SELECT tipo, valor, parcelas FROM sale_payments WHERE vendaId = ?').all(sale.id) as any[];

      return {
        ...sale,
        itens: itens.map(item => ({
          produtoId: item.produtoId,
          produto: {
            id: item.produtoId,
            nome: item.nome,
            codigo: item.codigo,
            preco: item.preco,
            categoria: item.categoria,
            estoque: item.estoque,
            estoqueMinimo: item.estoqueMinimo,
            foto: item.foto,
            ativo: item.ativo,
            criadoEm: item.criadoEm
          },
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto,
          total: item.total
        })),
        pagamentos
      };
    });
  }

  // Métodos para despesas
  createExpense(expense: Omit<Expense, 'id' | 'criadoEm'>): Expense {
    const id = Math.random().toString(36).substr(2, 9);
    const criadoEm = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO expenses (id, descricao, categoria, valor, dataVencimento, dataPagamento, pago, recorrente, formaPagamento, parcelas, observacoes, usuarioId, criadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, expense.descricao, expense.categoria, expense.valor, expense.dataVencimento, expense.dataPagamento,
           expense.pago, expense.recorrente, expense.formaPagamento, expense.parcelas, expense.observacoes, expense.usuarioId, criadoEm);

    return { ...expense, id, criadoEm };
  }

  getAllExpenses(): Expense[] {
    return this.db.prepare('SELECT * FROM expenses ORDER BY dataVencimento DESC').all() as Expense[];
  }

  updateExpense(id: string, updates: Partial<Expense>): boolean {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = this.db.prepare(`UPDATE expenses SET ${fields} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }

  deleteExpense(id: string): boolean {
    const result = this.db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Backup e restore
  exportData(): string {
    const data = {
      users: this.getAllUsers(),
      products: this.getAllProducts(),
      suppliers: this.getAllSuppliers(),
      sales: this.getAllSales(),
      cashMovements: this.getAllCashMovements(),
      expenses: this.getAllExpenses(),
      cashRegisters: this.getAllCashRegisters(),
      cashSessions: this.getAllCashSessions(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Método para obter caminho do banco
  getDatabasePath(): string {
    return this.dbPath;
  }

  // Método para fechar conexão
  close(): void {
    this.db.close();
  }
}

export const sqliteDb = new SQLiteDatabase();