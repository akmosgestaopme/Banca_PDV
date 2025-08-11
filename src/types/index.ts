export interface User {
  id: string;
  nome: string;
  usuario: string;
  senha: string;
  tipo: 'administrador' | 'gerente' | 'vendedor';
  ativo: boolean;
  criadoEm: string;
}

export interface Product {
  id: string;
  nome: string;
  codigo: string;
  codigoBarras?: string;
  preco: number;
  categoria: string;
  estoque: number;
  estoqueMinimo: number;
  fornecedorId?: string;
  foto?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Supplier {
  id: string;
  nome: string;
  cnpjCpf: string;
  telefone: string;
  email: string;
  endereco?: string;
  website?: string;
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface SaleItem {
  produtoId: string;
  produto: Product;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

export interface PaymentMethod {
  tipo: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'vale';
  valor: number;
  parcelas?: number;
}

export interface Sale {
  id: string;
  numero: number;
  itens: SaleItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos: PaymentMethod[];
  troco: number;
  vendedorId: string;
  vendedor: string;
  clienteNome?: string;
  observacoes?: string;
  dataVenda: string;
  cancelada: boolean;
  caixaId?: string;
}

export interface CashRegister {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CashSession {
  id: string;
  caixaId: string;
  caixa: string;
  usuarioId: string;
  usuario: string;
  dataAbertura: string;
  dataFechamento?: string;
  valorAbertura: number;
  valorFechamento?: number;
  totalVendas: number;
  totalEntradas: number;
  totalSaidas: number;
  status: 'aberto' | 'fechado';
  observacoesAbertura?: string;
  observacoesFechamento?: string;
}

export interface CashMovement {
  id: string;
  caixaId: string;
  sessaoId?: string;
  tipo: 'entrada' | 'saida';
  categoria: 'venda' | 'despesa' | 'receita' | 'sangria' | 'suprimento' | 'troco' | 'abertura' | 'fechamento';
  subcategoria?: string;
  descricao: string;
  valor: number;
  formaPagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'cheque' | 'transferencia';
  vendaId?: string;
  usuarioId: string;
  usuario: string;
  data: string;
  comprovante?: string;
  observacoes?: string;
}

export interface Expense {
  id: string;
  descricao: string;
  categoria: 'fixa' | 'variavel';
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  pago: boolean;
  recorrente: boolean;
  formaPagamento?: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'cheque' | 'transferencia';
  parcelas?: number;
  observacoes?: string;
  usuarioId: string;
  criadoEm: string;
}