/*
  # Sistema de Movimentação de Estoque

  1. New Tables
    - `inventory_movements`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `tipo` (text) - entrada, saida, ajuste, transferencia
      - `quantidade` (integer) - quantidade movimentada
      - `quantidade_anterior` (integer) - estoque anterior
      - `quantidade_atual` (integer) - estoque atual
      - `motivo` (text) - motivo da movimentação
      - `documento` (text) - número do documento
      - `user_id` (uuid, foreign key to users)
      - `sale_id` (uuid, foreign key to sales) - se for venda
      - `supplier_id` (uuid, foreign key to suppliers) - se for entrada
      - `observacoes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `inventory_movements` table
    - Add policies for CRUD operations

  3. Functions
    - Create function to update product stock automatically
*/

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY['entrada', 'saida', 'ajuste', 'transferencia'])),
  quantidade integer NOT NULL,
  quantidade_anterior integer NOT NULL,
  quantidade_atual integer NOT NULL,
  motivo text NOT NULL,
  documento text,
  user_id uuid NOT NULL REFERENCES users(id),
  sale_id uuid REFERENCES sales(id),
  supplier_id uuid REFERENCES suppliers(id),
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler movimentações"
  ON inventory_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar movimentações"
  ON inventory_movements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

CREATE POLICY "Usuários podem criar movimentações"
  ON inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tipo ON inventory_movements(tipo);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);

-- Função para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o estoque do produto
  UPDATE products 
  SET estoque = NEW.quantidade_atual,
      updated_at = now()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();