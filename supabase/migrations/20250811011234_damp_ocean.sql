/*
  # Schema inicial do PDV Banca de Jornal

  1. Novas Tabelas
    - `users` - Usuários do sistema
    - `products` - Catálogo de produtos
    - `suppliers` - Fornecedores
    - `cash_registers` - Caixas cadastrados
    - `cash_sessions` - Sessões de caixa
    - `cash_movements` - Movimentações financeiras
    - `sales` - Vendas realizadas
    - `sale_items` - Itens das vendas
    - `sale_payments` - Formas de pagamento das vendas
    - `expenses` - Despesas e contas a pagar

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas de acesso baseadas em autenticação
    - Controle de permissões por tipo de usuário

  3. Funcionalidades
    - Triggers para atualização automática de timestamps
    - Constraints para integridade dos dados
    - Índices para otimização de consultas
*/

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  usuario text UNIQUE NOT NULL,
  senha text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('administrador', 'gerente', 'vendedor')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj_cpf text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  endereco text,
  website text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE NOT NULL,
  codigo_barras text,
  preco decimal(10,2) NOT NULL,
  categoria text NOT NULL,
  estoque integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  supplier_id uuid REFERENCES suppliers(id),
  foto text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de caixas
CREATE TABLE IF NOT EXISTS cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de sessões de caixa
CREATE TABLE IF NOT EXISTS cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id uuid NOT NULL REFERENCES cash_registers(id),
  user_id uuid NOT NULL REFERENCES users(id),
  data_abertura timestamptz DEFAULT now(),
  data_fechamento timestamptz,
  valor_abertura decimal(10,2) NOT NULL DEFAULT 0,
  valor_fechamento decimal(10,2),
  total_vendas decimal(10,2) NOT NULL DEFAULT 0,
  total_entradas decimal(10,2) NOT NULL DEFAULT 0,
  total_saidas decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('aberto', 'fechado')) DEFAULT 'aberto',
  observacoes_abertura text,
  observacoes_fechamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de movimentações de caixa
CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id uuid NOT NULL REFERENCES cash_registers(id),
  cash_session_id uuid REFERENCES cash_sessions(id),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria text NOT NULL,
  subcategoria text,
  descricao text NOT NULL,
  valor decimal(10,2) NOT NULL,
  forma_pagamento text NOT NULL,
  sale_id uuid,
  user_id uuid NOT NULL REFERENCES users(id),
  data timestamptz DEFAULT now(),
  comprovante text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  desconto decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL,
  troco decimal(10,2) NOT NULL DEFAULT 0,
  vendedor_id uuid NOT NULL REFERENCES users(id),
  cliente_nome text,
  observacoes text,
  data_venda timestamptz DEFAULT now(),
  cancelada boolean NOT NULL DEFAULT false,
  cash_register_id uuid REFERENCES cash_registers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens de venda
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantidade integer NOT NULL,
  preco_unitario decimal(10,2) NOT NULL,
  desconto decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos das vendas
CREATE TABLE IF NOT EXISTS sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  valor decimal(10,2) NOT NULL,
  parcelas integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('fixa', 'variavel')),
  valor decimal(10,2) NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  pago boolean NOT NULL DEFAULT false,
  recorrente boolean NOT NULL DEFAULT false,
  forma_pagamento text,
  parcelas integer DEFAULT 1,
  observacoes text,
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler dados"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administradores podem gerenciar usuários"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tipo = 'administrador'
    )
  );

-- Políticas para fornecedores
CREATE POLICY "Usuários autenticados podem ler fornecedores"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar fornecedores"
  ON suppliers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
    )
  );

-- Políticas para produtos
CREATE POLICY "Usuários autenticados podem ler produtos"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar produtos"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
    )
  );

-- Políticas para caixas
CREATE POLICY "Usuários autenticados podem ler caixas"
  ON cash_registers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar caixas"
  ON cash_registers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
    )
  );

-- Políticas para sessões de caixa
CREATE POLICY "Usuários podem ver suas próprias sessões"
  ON cash_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
  ));

CREATE POLICY "Usuários podem criar sessões"
  ON cash_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias sessões"
  ON cash_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
  ));

-- Políticas para movimentações de caixa
CREATE POLICY "Usuários podem ver movimentações relacionadas"
  ON cash_movements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
  ));

CREATE POLICY "Usuários podem criar movimentações"
  ON cash_movements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Políticas para vendas
CREATE POLICY "Usuários podem ver vendas relacionadas"
  ON sales FOR SELECT
  TO authenticated
  USING (vendedor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
  ));

CREATE POLICY "Usuários podem criar vendas"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (vendedor_id = auth.uid());

-- Políticas para itens de venda
CREATE POLICY "Usuários autenticados podem ler itens de venda"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar itens de venda"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para pagamentos de venda
CREATE POLICY "Usuários autenticados podem ler pagamentos"
  ON sale_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar pagamentos"
  ON sale_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para despesas
CREATE POLICY "Usuários podem ver despesas relacionadas"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
  ));

CREATE POLICY "Gerentes e administradores podem gerenciar despesas"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tipo IN ('administrador', 'gerente')
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON cash_registers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_sessions_updated_at BEFORE UPDATE ON cash_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_movements_updated_at BEFORE UPDATE ON cash_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_products_codigo ON products (codigo);
CREATE INDEX IF NOT EXISTS idx_products_codigo_barras ON products (codigo_barras);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products (categoria);
CREATE INDEX IF NOT EXISTS idx_sales_data_venda ON sales (data_venda);
CREATE INDEX IF NOT EXISTS idx_sales_vendedor ON sales (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_data ON cash_movements (data);
CREATE INDEX IF NOT EXISTS idx_cash_movements_tipo ON cash_movements (tipo);
CREATE INDEX IF NOT EXISTS idx_expenses_data_vencimento ON expenses (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_expenses_pago ON expenses (pago);