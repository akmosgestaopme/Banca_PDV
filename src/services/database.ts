import { db as supabaseDb } from './supabase-database';
import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession } from '../types';

class DatabaseService {
  // Usuários
  async createUser(user: Omit<User, 'id' | 'criadoEm'>): Promise<User> {
    return await supabaseDb.createUser(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await supabaseDb.getAllUsers();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    return await supabaseDb.updateUser(id, updates);
  }

  async getUserByCredentials(usuario: string, senha: string): Promise<User | null> {
    return await supabaseDb.getUserByCredentials(usuario, senha);
  }

  // Produtos
  async createProduct(product: Omit<Product, 'id' | 'criadoEm'>): Promise<Product> {
    return await supabaseDb.createProduct(product);
  }

  async getAllProducts(): Promise<Product[]> {
    return await supabaseDb.getAllProducts();
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    return await supabaseDb.updateProduct(id, updates);
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    return await supabaseDb.getProductByCode(code);
  }

  // Fornecedores
  async createSupplier(supplier: Omit<Supplier, 'id' | 'criadoEm'>): Promise<Supplier> {
    return await supabaseDb.createSupplier(supplier);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await supabaseDb.getAllSuppliers();
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<boolean> {
    return await supabaseDb.updateSupplier(id, updates);
  }

  // Caixas
  async createCashRegister(register: Omit<CashRegister, 'id' | 'criadoEm'>): Promise<CashRegister> {
    return await supabaseDb.createCashRegister(register);
  }

  async getAllCashRegisters(): Promise<CashRegister[]> {
    return await supabaseDb.getAllCashRegisters();
  }

  async updateCashRegister(id: string, updates: Partial<CashRegister>): Promise<boolean> {
    return await supabaseDb.updateCashRegister(id, updates);
  }

  // Sessões de Caixa
  async openCashSession(sessionData: any): Promise<CashSession> {
    return await supabaseDb.openCashSession(sessionData);
  }

  async closeCashSession(sessionId: string, valorFechamento: number, observacoes?: string): Promise<boolean> {
    return await supabaseDb.closeCashSession(sessionId, valorFechamento, observacoes);
  }

  async getAllCashSessions(): Promise<CashSession[]> {
    return await supabaseDb.getAllCashSessions();
  }

  // Movimentações de Caixa
  async createCashMovement(movement: Omit<CashMovement, 'id' | 'data'>): Promise<CashMovement> {
    return await supabaseDb.createCashMovement(movement);
  }

  async getAllCashMovements(): Promise<CashMovement[]> {
    return await supabaseDb.getAllCashMovements();
  }

  // Vendas
  async createSale(sale: Omit<Sale, 'id' | 'numero'>): Promise<Sale> {
    return await supabaseDb.createSale(sale);
  }

  async getAllSales(): Promise<Sale[]> {
    return await supabaseDb.getAllSales();
  }

  // Despesas
  async createExpense(expense: Omit<Expense, 'id' | 'criadoEm'>): Promise<Expense> {
    return await supabaseDb.createExpense(expense);
  }

  async getAllExpenses(): Promise<Expense[]> {
    return await supabaseDb.getAllExpenses();
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<boolean> {
    return await supabaseDb.updateExpense(id, updates);
  }

  async deleteExpense(id: string): Promise<boolean> {
    return await supabaseDb.deleteExpense(id);
  }

  // Inicialização
  async initializeData(): Promise<void> {
    console.log('Database service initialized');
  }

  // Backup
  async exportData(): Promise<string> {
    return await supabaseDb.exportData();
  }
}

export const db = new DatabaseService();
export default db;