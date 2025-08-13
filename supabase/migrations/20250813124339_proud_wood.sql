/*
  # Melhorias nas Tabelas Existentes

  1. Products Enhancements
    - Add category_id foreign key
    - Add promotion fields
    - Add inventory tracking

  2. Sales Enhancements
    - Add customer_id foreign key
    - Add promotion fields
    - Add loyalty points

  3. Users Enhancements
    - Add profile fields
    - Add last login tracking

  4. Additional Constraints and Indexes
*/

-- Melhorias na tabela products
DO $$
BEGIN
  -- Adicionar category_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id);
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  END IF;

  -- Adicionar campos de promoção se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promocao_ativa'
  ) THEN
    ALTER TABLE products ADD COLUMN promocao_ativa boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN promocao_desconto numeric(5,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN promocao_data_inicio date;
    ALTER TABLE products ADD COLUMN promocao_data_fim date;
  END IF;

  -- Adicionar campos de controle de estoque se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'localizacao'
  ) THEN
    ALTER TABLE products ADD COLUMN localizacao text;
    ALTER TABLE products ADD COLUMN peso numeric(8,3);
    ALTER TABLE products ADD COLUMN dimensoes text;
    ALTER TABLE products ADD COLUMN ncm text;
  END IF;
END $$;

-- Melhorias na tabela sales
DO $$
BEGIN
  -- Adicionar campos de fidelidade se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'pontos_fidelidade'
  ) THEN
    ALTER TABLE sales ADD COLUMN pontos_fidelidade integer DEFAULT 0;
    ALTER TABLE sales ADD COLUMN desconto_fidelidade numeric(10,2) DEFAULT 0;
  END IF;

  -- Adicionar campos de promoção se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'promocoes_aplicadas'
  ) THEN
    ALTER TABLE sales ADD COLUMN promocoes_aplicadas jsonb DEFAULT '[]';
    ALTER TABLE sales ADD COLUMN desconto_promocional numeric(10,2) DEFAULT 0;
  END IF;

  -- Adicionar campos de entrega se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'tipo_venda'
  ) THEN
    ALTER TABLE sales ADD COLUMN tipo_venda text DEFAULT 'balcao' CHECK (tipo_venda = ANY(ARRAY['balcao', 'delivery', 'retirada']));
    ALTER TABLE sales ADD COLUMN endereco_entrega text;
    ALTER TABLE sales ADD COLUMN taxa_entrega numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Melhorias na tabela users
DO $$
BEGIN
  -- Adicionar campos de perfil se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
    ALTER TABLE users ADD COLUMN telefone text;
    ALTER TABLE users ADD COLUMN avatar text;
    ALTER TABLE users ADD COLUMN data_nascimento date;
  END IF;

  -- Adicionar campos de controle de acesso se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ultimo_login'
  ) THEN
    ALTER TABLE users ADD COLUMN ultimo_login timestamptz;
    ALTER TABLE users ADD COLUMN tentativas_login integer DEFAULT 0;
    ALTER TABLE users ADD COLUMN bloqueado_ate timestamptz;
    ALTER TABLE users ADD COLUMN deve_trocar_senha boolean DEFAULT false;
  END IF;
END $$;

-- Melhorias na tabela suppliers
DO $$
BEGIN
  -- Adicionar campos adicionais se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'contato_nome'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN contato_nome text;
    ALTER TABLE suppliers ADD COLUMN contato_cargo text;
    ALTER TABLE suppliers ADD COLUMN prazo_pagamento integer DEFAULT 30;
    ALTER TABLE suppliers ADD COLUMN forma_pagamento_preferida text;
  END IF;
END $$;

-- Adicionar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_products_promocao_ativa ON products(promocao_ativa) WHERE promocao_ativa = true;
CREATE INDEX IF NOT EXISTS idx_sales_tipo_venda ON sales(tipo_venda);
CREATE INDEX IF NOT EXISTS idx_sales_pontos_fidelidade ON sales(pontos_fidelidade) WHERE pontos_fidelidade > 0;
CREATE INDEX IF NOT EXISTS idx_users_ultimo_login ON users(ultimo_login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);