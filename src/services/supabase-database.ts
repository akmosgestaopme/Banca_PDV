import { supabase } from '../lib/supabase';
import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession } from '../types';

class SupabaseDatabase {
  // Usuários
  async createUser(user: Omit<User, 'id' | 'criadoEm'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        nome: user.nome,
        usuario: user.usuario,
        senha: user.senha,
        tipo: user.tipo,
        ativo: user.ativo
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      nome: data.nome,
      usuario: data.usuario,
      senha: data.senha,
      tipo: data.tipo,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nome');

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      senha: user.senha,
      tipo: user.tipo,
      ativo: user.ativo,
      criadoEm: user.created_at
    }));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({
        nome: updates.nome,
        usuario: updates.usuario,
        senha: updates.senha,
        tipo: updates.tipo,
        ativo: updates.ativo
      })
      .eq('id', id);

    return !error;
  }

  async getUserByCredentials(usuario: string, senha: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('usuario', usuario)
      .eq('senha', senha)
      .eq('ativo', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nome: data.nome,
      usuario: data.usuario,
      senha: data.senha,
      tipo: data.tipo,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  // Produtos
  async createProduct(product: Omit<Product, 'id' | 'criadoEm'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        nome: product.nome,
        codigo: product.codigo,
        codigo_barras: product.codigoBarras,
        preco: product.preco,
        categoria: product.categoria,
        estoque: product.estoque,
        estoque_minimo: product.estoqueMinimo,
        supplier_id: product.fornecedorId,
        foto: product.foto,
        ativo: product.ativo
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      codigo: data.codigo,
      codigoBarras: data.codigo_barras,
      preco: data.preco,
      categoria: data.categoria,
      estoque: data.estoque,
      estoqueMinimo: data.estoque_minimo,
      fornecedorId: data.supplier_id,
      foto: data.foto,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('nome');

    if (error) throw error;

    return data.map(product => ({
      id: product.id,
      nome: product.nome,
      codigo: product.codigo,
      codigoBarras: product.codigo_barras,
      preco: product.preco,
      categoria: product.categoria,
      estoque: product.estoque,
      estoqueMinimo: product.estoque_minimo,
      fornecedorId: product.supplier_id,
      foto: product.foto,
      ativo: product.ativo,
      criadoEm: product.created_at
    }));
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .update({
        nome: updates.nome,
        codigo: updates.codigo,
        codigo_barras: updates.codigoBarras,
        preco: updates.preco,
        categoria: updates.categoria,
        estoque: updates.estoque,
        estoque_minimo: updates.estoqueMinimo,
        supplier_id: updates.fornecedorId,
        foto: updates.foto,
        ativo: updates.ativo
      })
      .eq('id', id);

    return !error;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`codigo.eq.${code},codigo_barras.eq.${code},nome.ilike.%${code}%`)
      .eq('ativo', true)
      .limit(1)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      nome: data.nome,
      codigo: data.codigo,
      codigoBarras: data.codigo_barras,
      preco: data.preco,
      categoria: data.categoria,
      estoque: data.estoque,
      estoqueMinimo: data.estoque_minimo,
      fornecedorId: data.supplier_id,
      foto: data.foto,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  // Fornecedores
  async createSupplier(supplier: Omit<Supplier, 'id' | 'criadoEm'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        nome: supplier.nome,
        cnpj_cpf: supplier.cnpjCpf,
        telefone: supplier.telefone,
        email: supplier.email,
        endereco: supplier.endereco,
        website: supplier.website,
        observacoes: supplier.observacoes,
        ativo: supplier.ativo
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      cnpjCpf: data.cnpj_cpf,
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      website: data.website,
      observacoes: data.observacoes,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('nome');

    if (error) throw error;

    return data.map(supplier => ({
      id: supplier.id,
      nome: supplier.nome,
      cnpjCpf: supplier.cnpj_cpf,
      telefone: supplier.telefone,
      email: supplier.email,
      endereco: supplier.endereco,
      website: supplier.website,
      observacoes: supplier.observacoes,
      ativo: supplier.ativo,
      criadoEm: supplier.created_at
    }));
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<boolean> {
    const { error } = await supabase
      .from('suppliers')
      .update({
        nome: updates.nome,
        cnpj_cpf: updates.cnpjCpf,
        telefone: updates.telefone,
        email: updates.email,
        endereco: updates.endereco,
        website: updates.website,
        observacoes: updates.observacoes,
        ativo: updates.ativo
      })
      .eq('id', id);

    return !error;
  }

  // Caixas
  async createCashRegister(register: Omit<CashRegister, 'id' | 'criadoEm'>): Promise<CashRegister> {
    const { data, error } = await supabase
      .from('cash_registers')
      .insert({
        nome: register.nome,
        descricao: register.descricao,
        ativo: register.ativo
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      ativo: data.ativo,
      criadoEm: data.created_at
    };
  }

  async getAllCashRegisters(): Promise<CashRegister[]> {
    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .order('nome');

    if (error) throw error;

    return data.map(register => ({
      id: register.id,
      nome: register.nome,
      descricao: register.descricao,
      ativo: register.ativo,
      criadoEm: register.created_at
    }));
  }

  async updateCashRegister(id: string, updates: Partial<CashRegister>): Promise<boolean> {
    const { error } = await supabase
      .from('cash_registers')
      .update({
        nome: updates.nome,
        descricao: updates.descricao,
        ativo: updates.ativo
      })
      .eq('id', id);

    return !error;
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

  // Backup
  async exportData(): Promise<string> {
    return await supabaseDb.exportData();
  }
}

export const db = new SupabaseDatabase();
export default db;