import { supabase } from '../lib/supabase';
import { User, Product, Supplier, Sale, CashMovement, Expense, CashRegister, CashSession, SaleItem, PaymentMethod } from '../types';

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
    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        cash_register_id: sessionData.caixaId,
        user_id: sessionData.usuarioId,
        valor_abertura: sessionData.valorAbertura,
        observacoes_abertura: sessionData.observacoesAbertura
      })
      .select(`
        *,
        cash_registers(nome),
        users(nome)
      `)
      .single();

    if (error) throw error;

    // Registrar movimentação de abertura se houver valor
    if (sessionData.valorAbertura > 0) {
      await this.createCashMovement({
        caixaId: sessionData.caixaId,
        sessaoId: data.id,
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

    return {
      id: data.id,
      caixaId: data.cash_register_id,
      caixa: data.cash_registers.nome,
      usuarioId: data.user_id,
      usuario: data.users.nome,
      dataAbertura: data.data_abertura,
      dataFechamento: data.data_fechamento,
      valorAbertura: data.valor_abertura,
      valorFechamento: data.valor_fechamento,
      totalVendas: data.total_vendas,
      totalEntradas: data.total_entradas,
      totalSaidas: data.total_saidas,
      status: data.status,
      observacoesAbertura: data.observacoes_abertura,
      observacoesFechamento: data.observacoes_fechamento
    };
  }

  async closeCashSession(sessionId: string, valorFechamento: number, observacoes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('cash_sessions')
      .update({
        data_fechamento: new Date().toISOString(),
        valor_fechamento: valorFechamento,
        observacoes_fechamento: observacoes,
        status: 'fechado'
      })
      .eq('id', sessionId);

    return !error;
  }

  async getAllCashSessions(): Promise<CashSession[]> {
    const { data, error } = await supabase
      .from('cash_sessions')
      .select(`
        *,
        cash_registers(nome),
        users(nome)
      `)
      .order('data_abertura', { ascending: false });

    if (error) throw error;

    return data.map(session => ({
      id: session.id,
      caixaId: session.cash_register_id,
      caixa: session.cash_registers.nome,
      usuarioId: session.user_id,
      usuario: session.users.nome,
      dataAbertura: session.data_abertura,
      dataFechamento: session.data_fechamento,
      valorAbertura: session.valor_abertura,
      valorFechamento: session.valor_fechamento,
      totalVendas: session.total_vendas,
      totalEntradas: session.total_entradas,
      totalSaidas: session.total_saidas,
      status: session.status,
      observacoesAbertura: session.observacoes_abertura,
      observacoesFechamento: session.observacoes_fechamento
    }));
  }

  // Movimentações de Caixa
  async createCashMovement(movement: Omit<CashMovement, 'id' | 'data'>): Promise<CashMovement> {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: movement.caixaId,
        cash_session_id: movement.sessaoId,
        tipo: movement.tipo,
        categoria: movement.categoria,
        subcategoria: movement.subcategoria,
        descricao: movement.descricao,
        valor: movement.valor,
        forma_pagamento: movement.formaPagamento,
        sale_id: movement.vendaId,
        user_id: movement.usuarioId,
        comprovante: movement.comprovante,
        observacoes: movement.observacoes
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      caixaId: data.cash_register_id,
      sessaoId: data.cash_session_id,
      tipo: data.tipo,
      categoria: data.categoria,
      subcategoria: data.subcategoria,
      descricao: data.descricao,
      valor: data.valor,
      formaPagamento: data.forma_pagamento,
      vendaId: data.sale_id,
      usuarioId: data.user_id,
      usuario: movement.usuario,
      data: data.data,
      comprovante: data.comprovante,
      observacoes: data.observacoes
    };
  }

  async getAllCashMovements(): Promise<CashMovement[]> {
    const { data, error } = await supabase
      .from('cash_movements')
      .select(`
        *,
        users(nome)
      `)
      .order('data', { ascending: false });

    if (error) throw error;

    return data.map(movement => ({
      id: movement.id,
      caixaId: movement.cash_register_id,
      sessaoId: movement.cash_session_id,
      tipo: movement.tipo,
      categoria: movement.categoria,
      subcategoria: movement.subcategoria,
      descricao: movement.descricao,
      valor: movement.valor,
      formaPagamento: movement.forma_pagamento,
      vendaId: movement.sale_id,
      usuarioId: movement.user_id,
      usuario: movement.users.nome,
      data: movement.data,
      comprovante: movement.comprovante,
      observacoes: movement.observacoes
    }));
  }

  // Vendas
  async createSale(sale: Omit<Sale, 'id' | 'numero'>): Promise<Sale> {
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        subtotal: sale.subtotal,
        desconto: sale.desconto,
        total: sale.total,
        troco: sale.troco,
        vendedor_id: sale.vendedorId,
        cliente_nome: sale.clienteNome,
        observacoes: sale.observacoes,
        cancelada: sale.cancelada,
        cash_register_id: sale.caixaId
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // Inserir itens da venda
    const saleItems = sale.itens.map(item => ({
      sale_id: saleData.id,
      product_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
      desconto: item.desconto,
      total: item.total
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // Inserir pagamentos
    const payments = sale.pagamentos.map(payment => ({
      sale_id: saleData.id,
      tipo: payment.tipo,
      valor: payment.valor,
      parcelas: payment.parcelas || 1
    }));

    const { error: paymentsError } = await supabase
      .from('sale_payments')
      .insert(payments);

    if (paymentsError) throw paymentsError;

    // Atualizar estoque dos produtos
    for (const item of sale.itens) {
      await supabase.rpc('update_product_stock', {
        product_id: item.produtoId,
        quantity_sold: item.quantidade
      });
    }

    // Registrar movimentações de caixa para cada pagamento
    if (!sale.cancelada) {
      for (const pagamento of sale.pagamentos) {
        await this.createCashMovement({
          caixaId: sale.caixaId || '',
          tipo: 'entrada',
          categoria: 'venda',
          descricao: `Venda #${saleData.numero}`,
          valor: pagamento.valor,
          formaPagamento: pagamento.tipo,
          vendaId: saleData.id,
          usuarioId: sale.vendedorId,
          usuario: sale.vendedor,
          observacoes: `Venda realizada via ${pagamento.tipo}`
        });
      }
    }

    return {
      id: saleData.id,
      numero: saleData.numero,
      itens: sale.itens,
      subtotal: saleData.subtotal,
      desconto: saleData.desconto,
      total: saleData.total,
      pagamentos: sale.pagamentos,
      troco: saleData.troco,
      vendedorId: saleData.vendedor_id,
      vendedor: sale.vendedor,
      clienteNome: saleData.cliente_nome,
      observacoes: saleData.observacoes,
      dataVenda: saleData.data_venda,
      cancelada: saleData.cancelada,
      caixaId: saleData.cash_register_id
    };
  }

  async getAllSales(): Promise<Sale[]> {
    const { data: salesData, error } = await supabase
      .from('sales')
      .select(`
        *,
        users(nome),
        sale_items(
          *,
          products(*)
        ),
        sale_payments(*)
      `)
      .order('data_venda', { ascending: false });

    if (error) throw error;

    return salesData.map(sale => ({
      id: sale.id,
      numero: sale.numero,
      itens: sale.sale_items.map((item: any) => ({
        produtoId: item.product_id,
        produto: {
          id: item.products.id,
          nome: item.products.nome,
          codigo: item.products.codigo,
          codigoBarras: item.products.codigo_barras,
          preco: item.products.preco,
          categoria: item.products.categoria,
          estoque: item.products.estoque,
          estoqueMinimo: item.products.estoque_minimo,
          fornecedorId: item.products.supplier_id,
          foto: item.products.foto,
          ativo: item.products.ativo,
          criadoEm: item.products.created_at
        },
        quantidade: item.quantidade,
        precoUnitario: item.preco_unitario,
        desconto: item.desconto,
        total: item.total
      })),
      subtotal: sale.subtotal,
      desconto: sale.desconto,
      total: sale.total,
      pagamentos: sale.sale_payments.map((payment: any) => ({
        tipo: payment.tipo,
        valor: payment.valor,
        parcelas: payment.parcelas
      })),
      troco: sale.troco,
      vendedorId: sale.vendedor_id,
      vendedor: sale.users.nome,
      clienteNome: sale.cliente_nome,
      observacoes: sale.observacoes,
      dataVenda: sale.data_venda,
      cancelada: sale.cancelada,
      caixaId: sale.cash_register_id
    }));
  }

  // Despesas
  async createExpense(expense: Omit<Expense, 'id' | 'criadoEm'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        descricao: expense.descricao,
        categoria: expense.categoria,
        valor: expense.valor,
        data_vencimento: expense.dataVencimento,
        data_pagamento: expense.dataPagamento,
        pago: expense.pago,
        recorrente: expense.recorrente,
        forma_pagamento: expense.formaPagamento,
        parcelas: expense.parcelas,
        observacoes: expense.observacoes,
        user_id: expense.usuarioId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      descricao: data.descricao,
      categoria: data.categoria,
      valor: data.valor,
      dataVencimento: data.data_vencimento,
      dataPagamento: data.data_pagamento,
      pago: data.pago,
      recorrente: data.recorrente,
      formaPagamento: data.forma_pagamento,
      parcelas: data.parcelas,
      observacoes: data.observacoes,
      usuarioId: data.user_id,
      criadoEm: data.created_at
    };
  }

  async getAllExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('data_vencimento', { ascending: false });

    if (error) throw error;

    return data.map(expense => ({
      id: expense.id,
      descricao: expense.descricao,
      categoria: expense.categoria,
      valor: expense.valor,
      dataVencimento: expense.data_vencimento,
      dataPagamento: expense.data_pagamento,
      pago: expense.pago,
      recorrente: expense.recorrente,
      formaPagamento: expense.forma_pagamento,
      parcelas: expense.parcelas,
      observacoes: expense.observacoes,
      usuarioId: expense.user_id,
      criadoEm: expense.created_at
    }));
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .update({
        descricao: updates.descricao,
        categoria: updates.categoria,
        valor: updates.valor,
        data_vencimento: updates.dataVencimento,
        data_pagamento: updates.dataPagamento,
        pago: updates.pago,
        recorrente: updates.recorrente,
        forma_pagamento: updates.formaPagamento,
        parcelas: updates.parcelas,
        observacoes: updates.observacoes
      })
      .eq('id', id);

    return !error;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Método para inicializar dados (não necessário com Supabase, dados são inseridos via migration)
  async initializeData(): Promise<void> {
    // Verificar se já existem usuários
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // Se não há usuários, os dados serão inseridos automaticamente pelas migrations
    console.log('Database initialized with Supabase');
  }

  // Backup (exportar dados)
  async exportData(): Promise<string> {
    const [users, products, suppliers, sales, cashMovements, expenses, cashRegisters, cashSessions] = await Promise.all([
      this.getAllUsers(),
      this.getAllProducts(),
      this.getAllSuppliers(),
      this.getAllSales(),
      this.getAllCashMovements(),
      this.getAllExpenses(),
      this.getAllCashRegisters(),
      this.getAllCashSessions()
    ]);

    const data = {
      users,
      products,
      suppliers,
      sales,
      cashMovements,
      expenses,
      cashRegisters,
      cashSessions,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }
}

export const supabaseDb = new SupabaseDatabase();