import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Tipos do banco de dados
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nome: string;
          usuario: string;
          senha: string;
          tipo: 'administrador' | 'gerente' | 'vendedor';
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          usuario: string;
          senha: string;
          tipo: 'administrador' | 'gerente' | 'vendedor';
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          usuario?: string;
          senha?: string;
          tipo?: 'administrador' | 'gerente' | 'vendedor';
          ativo?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          nome: string;
          codigo: string;
          codigo_barras: string | null;
          preco: number;
          categoria: string;
          estoque: number;
          estoque_minimo: number;
          supplier_id: string | null;
          foto: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          codigo: string;
          codigo_barras?: string | null;
          preco: number;
          categoria: string;
          estoque?: number;
          estoque_minimo?: number;
          supplier_id?: string | null;
          foto?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          codigo?: string;
          codigo_barras?: string | null;
          preco?: number;
          categoria?: string;
          estoque?: number;
          estoque_minimo?: number;
          supplier_id?: string | null;
          foto?: string | null;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          nome: string;
          cnpj_cpf: string;
          telefone: string;
          email: string;
          endereco: string | null;
          website: string | null;
          observacoes: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj_cpf: string;
          telefone: string;
          email: string;
          endereco?: string | null;
          website?: string | null;
          observacoes?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cnpj_cpf?: string;
          telefone?: string;
          email?: string;
          endereco?: string | null;
          website?: string | null;
          observacoes?: string | null;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      cash_registers: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      cash_sessions: {
        Row: {
          id: string;
          cash_register_id: string;
          user_id: string;
          data_abertura: string;
          data_fechamento: string | null;
          valor_abertura: number;
          valor_fechamento: number | null;
          total_vendas: number;
          total_entradas: number;
          total_saidas: number;
          status: 'aberto' | 'fechado';
          observacoes_abertura: string | null;
          observacoes_fechamento: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cash_register_id: string;
          user_id: string;
          data_abertura?: string;
          data_fechamento?: string | null;
          valor_abertura?: number;
          valor_fechamento?: number | null;
          total_vendas?: number;
          total_entradas?: number;
          total_saidas?: number;
          status?: 'aberto' | 'fechado';
          observacoes_abertura?: string | null;
          observacoes_fechamento?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cash_register_id?: string;
          user_id?: string;
          data_abertura?: string;
          data_fechamento?: string | null;
          valor_abertura?: number;
          valor_fechamento?: number | null;
          total_vendas?: number;
          total_entradas?: number;
          total_saidas?: number;
          status?: 'aberto' | 'fechado';
          observacoes_abertura?: string | null;
          observacoes_fechamento?: string | null;
          updated_at?: string;
        };
      };
      cash_movements: {
        Row: {
          id: string;
          cash_register_id: string;
          cash_session_id: string | null;
          tipo: 'entrada' | 'saida';
          categoria: string;
          subcategoria: string | null;
          descricao: string;
          valor: number;
          forma_pagamento: string;
          sale_id: string | null;
          user_id: string;
          data: string;
          comprovante: string | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cash_register_id: string;
          cash_session_id?: string | null;
          tipo: 'entrada' | 'saida';
          categoria: string;
          subcategoria?: string | null;
          descricao: string;
          valor: number;
          forma_pagamento: string;
          sale_id?: string | null;
          user_id: string;
          data?: string;
          comprovante?: string | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cash_register_id?: string;
          cash_session_id?: string | null;
          tipo?: 'entrada' | 'saida';
          categoria?: string;
          subcategoria?: string | null;
          descricao?: string;
          valor?: number;
          forma_pagamento?: string;
          sale_id?: string | null;
          user_id?: string;
          data?: string;
          comprovante?: string | null;
          observacoes?: string | null;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          numero: number;
          subtotal: number;
          desconto: number;
          total: number;
          troco: number;
          vendedor_id: string;
          cliente_nome: string | null;
          observacoes: string | null;
          data_venda: string;
          cancelada: boolean;
          cash_register_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero?: number;
          subtotal: number;
          desconto?: number;
          total: number;
          troco?: number;
          vendedor_id: string;
          cliente_nome?: string | null;
          observacoes?: string | null;
          data_venda?: string;
          cancelada?: boolean;
          cash_register_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero?: number;
          subtotal?: number;
          desconto?: number;
          total?: number;
          troco?: number;
          vendedor_id?: string;
          cliente_nome?: string | null;
          observacoes?: string | null;
          data_venda?: string;
          cancelada?: boolean;
          cash_register_id?: string | null;
          updated_at?: string;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantidade: number;
          preco_unitario: number;
          desconto: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantidade: number;
          preco_unitario: number;
          desconto?: number;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          quantidade?: number;
          preco_unitario?: number;
          desconto?: number;
          total?: number;
        };
      };
      sale_payments: {
        Row: {
          id: string;
          sale_id: string;
          tipo: string;
          valor: number;
          parcelas: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          tipo: string;
          valor: number;
          parcelas?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          tipo?: string;
          valor?: number;
          parcelas?: number;
        };
      };
      expenses: {
        Row: {
          id: string;
          descricao: string;
          categoria: 'fixa' | 'variavel';
          valor: number;
          data_vencimento: string;
          data_pagamento: string | null;
          pago: boolean;
          recorrente: boolean;
          forma_pagamento: string | null;
          parcelas: number;
          observacoes: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          descricao: string;
          categoria: 'fixa' | 'variavel';
          valor: number;
          data_vencimento: string;
          data_pagamento?: string | null;
          pago?: boolean;
          recorrente?: boolean;
          forma_pagamento?: string | null;
          parcelas?: number;
          observacoes?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          descricao?: string;
          categoria?: 'fixa' | 'variavel';
          valor?: number;
          data_vencimento?: string;
          data_pagamento?: string | null;
          pago?: boolean;
          recorrente?: boolean;
          forma_pagamento?: string | null;
          parcelas?: number;
          observacoes?: string | null;
          user_id?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};