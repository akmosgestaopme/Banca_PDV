// Adaptador para usar SQLite em ambiente Electron ou localStorage em ambiente web
import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession } from '../types';

// Verificar se estamos em ambiente Electron
const isElectron = typeof window !== 'undefined' && window.process && window.process.type;

class DatabaseAdapter {
  private sqliteDb: any = null;
  private localStorageDb: any = null;

  constructor() {
    if (isElectron) {
      // Em ambiente Electron, usar SQLite
      import('./sqlite-database').then(module => {
        this.sqliteDb = module.sqliteDb;
      });
    } else {
      // Em ambiente web, usar localStorage
      import('./database').then(module => {
        this.localStorageDb = module.db;
      });
    }
  }

  private getDb() {
    return this.sqliteDb || this.localStorageDb;
  }

  // Métodos que delegam para o banco apropriado
  createUser(user: Omit<User, 'id' | 'criadoEm'>): User {
    return this.getDb().createUser(user);
  }

  getAllUsers(): User[] {
    return this.getDb().getAllUsers();
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    return this.getDb().updateUser(id, updates);
  }

  createProduct(product: Omit<Product, 'id' | 'criadoEm'>): Product {
    return this.getDb().createProduct(product);
  }

  getAllProducts(): Product[] {
    return this.getDb().getAllProducts();
  }

  updateProduct(id: string, updates: Partial<Product>): boolean {
    return this.getDb().updateProduct(id, updates);
  }

  getProductByCode(code: string): Product | undefined {
    return this.getDb().getProductByCode(code);
  }

  createSupplier(supplier: Omit<Supplier, 'id' | 'criadoEm'>): Supplier {
    return this.getDb().createSupplier(supplier);
  }

  getAllSuppliers(): Supplier[] {
    return this.getDb().getAllSuppliers();
  }

  updateSupplier(id: string, updates: Partial<Supplier>): boolean {
    return this.getDb().updateSupplier(id, updates);
  }

  createCashRegister(register: Omit<CashRegister, 'id' | 'criadoEm'>): CashRegister {
    return this.getDb().createCashRegister(register);
  }

  getAllCashRegisters(): CashRegister[] {
    return this.getDb().getAllCashRegisters();
  }

  updateCashRegister(id: string, updates: Partial<CashRegister>): boolean {
    return this.getDb().updateCashRegister(id, updates);
  }

  openCashSession(sessionData: any): CashSession {
    return this.getDb().openCashSession(sessionData);
  }

  closeCashSession(sessionId: string, valorFechamento: number, observacoes?: string): boolean {
    return this.getDb().closeCashSession(sessionId, valorFechamento, observacoes);
  }

  getAllCashSessions(): CashSession[] {
    return this.getDb().getAllCashSessions();
  }

  createCashMovement(movement: Omit<CashMovement, 'id' | 'data'>): CashMovement {
    return this.getDb().createCashMovement(movement);
  }

  getAllCashMovements(): CashMovement[] {
    return this.getDb().getAllCashMovements();
  }

  createSale(sale: Omit<Sale, 'id' | 'numero'>): Sale {
    return this.getDb().createSale(sale);
  }

  getAllSales(): Sale[] {
    return this.getDb().getAllSales();
  }

  createExpense(expense: Omit<Expense, 'id' | 'criadoEm'>): Expense {
    return this.getDb().createExpense(expense);
  }

  getAllExpenses(): Expense[] {
    return this.getDb().getAllExpenses();
  }

  updateExpense(id: string, updates: Partial<Expense>): boolean {
    return this.getDb().updateExpense(id, updates);
  }

  deleteExpense(id: string): boolean {
    return this.getDb().deleteExpense(id);
  }

  initializeData(): void {
    if (this.getDb()?.initializeData) {
      this.getDb().initializeData();
    }
  }

  exportData(): string {
    return this.getDb().exportData();
  }

  // Método específico para obter caminho do banco (apenas Electron)
  getDatabasePath(): string | null {
    if (this.sqliteDb) {
      return this.sqliteDb.getDatabasePath();
    }
    return null;
  }
}

export const dbAdapter = new DatabaseAdapter();