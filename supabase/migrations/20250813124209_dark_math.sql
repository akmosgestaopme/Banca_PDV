/*
  # Sistema de Pedidos de Compra

  1. New Tables
    - `purchase_orders`
      - `id` (uuid, primary key)
      - `numero` (serial, unique) - número sequencial do pedido
      - `supplier_id` (uuid, foreign key to suppliers)
      - `status` (text) - pendente, enviado, recebido, cancelado
      - `data_pedido` (timestamp)
      - `data_entrega_prevista` (date)
      - `data_entrega_real` (date)
      - `subtotal` (numeric)
      - `desconto` (numeric)
      - `frete` (numeric)
      - `total` (numeric)
      - `observacoes` (text)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `purchase_order_items`
      - `id` (uuid, primary key)
      - `purchase_order_id` (uuid, foreign key to purchase_orders)
      - `product_id` (uuid, foreign key to products)
      - `quantidade` (integer)
      - `preco_unitario` (numeric)
      - `desconto` (numeric)
      - `total` (numeric)
      - `quantidade_recebida` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Tabela de pedidos de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  status text DEFAULT 'pendente' CHECK (status = ANY(ARRAY['pendente', 'enviado', 'recebido', 'cancelado'])),
  data_pedido timestamptz DEFAULT now(),
  data_entrega_prevista date,
  data_entrega_real date,
  subtotal numeric(10,2) DEFAULT 0,
  desconto numeric(10,2) DEFAULT 0,
  frete numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  observacoes text,
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_unitario numeric(10,2) NOT NULL CHECK (preco_unitario >= 0),
  desconto numeric(10,2) DEFAULT 0 CHECK (desconto >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  quantidade_recebida integer DEFAULT 0 CHECK (quantidade_recebida >= 0),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para purchase_orders
CREATE POLICY "Usuários autenticados podem ler pedidos"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar pedidos"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

-- Políticas para purchase_order_items
CREATE POLICY "Usuários autenticados podem ler itens de pedidos"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar itens de pedidos"
  ON purchase_order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_data_pedido ON purchase_orders(data_pedido);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);