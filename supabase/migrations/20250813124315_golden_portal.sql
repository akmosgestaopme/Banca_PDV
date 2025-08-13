/*
  # Sistema de Fidelidade

  1. New Tables
    - `loyalty_cards`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `numero` (text, unique) - número do cartão
      - `pontos_acumulados` (integer) - pontos acumulados
      - `pontos_utilizados` (integer) - pontos já utilizados
      - `pontos_disponiveis` (integer) - pontos disponíveis
      - `data_ultimo_uso` (timestamp) - última utilização
      - `ativo` (boolean) - se o cartão está ativo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `loyalty_transactions`
      - `id` (uuid, primary key)
      - `loyalty_card_id` (uuid, foreign key to loyalty_cards)
      - `sale_id` (uuid, foreign key to sales)
      - `tipo` (text) - acumulo, resgate
      - `pontos` (integer) - quantidade de pontos
      - `valor_compra` (numeric) - valor da compra (para acúmulo)
      - `valor_desconto` (numeric) - valor do desconto (para resgate)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations

  3. Functions
    - Create function to calculate points automatically
*/

-- Tabela de cartões fidelidade
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  numero text UNIQUE NOT NULL,
  pontos_acumulados integer DEFAULT 0 CHECK (pontos_acumulados >= 0),
  pontos_utilizados integer DEFAULT 0 CHECK (pontos_utilizados >= 0),
  pontos_disponiveis integer GENERATED ALWAYS AS (pontos_acumulados - pontos_utilizados) STORED,
  data_ultimo_uso timestamptz,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de transações de fidelidade
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_card_id uuid NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES sales(id),
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY['acumulo', 'resgate'])),
  pontos integer NOT NULL CHECK (pontos > 0),
  valor_compra numeric(10,2) DEFAULT 0,
  valor_desconto numeric(10,2) DEFAULT 0,
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para loyalty_cards
CREATE POLICY "Usuários autenticados podem ler cartões fidelidade"
  ON loyalty_cards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem gerenciar cartões fidelidade"
  ON loyalty_cards
  FOR ALL
  TO authenticated
  USING (true);

-- Políticas para loyalty_transactions
CREATE POLICY "Usuários autenticados podem ler transações fidelidade"
  ON loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar transações fidelidade"
  ON loyalty_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_loyalty_cards_updated_at
  BEFORE UPDATE ON loyalty_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar pontos do cartão
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar pontos acumulados ou utilizados
  IF NEW.tipo = 'acumulo' THEN
    UPDATE loyalty_cards 
    SET pontos_acumulados = pontos_acumulados + NEW.pontos,
        data_ultimo_uso = now(),
        updated_at = now()
    WHERE id = NEW.loyalty_card_id;
  ELSIF NEW.tipo = 'resgate' THEN
    UPDATE loyalty_cards 
    SET pontos_utilizados = pontos_utilizados + NEW.pontos,
        data_ultimo_uso = now(),
        updated_at = now()
    WHERE id = NEW.loyalty_card_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar pontos
CREATE TRIGGER trigger_update_loyalty_points
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points();

-- Índices
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer_id ON loyalty_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_numero ON loyalty_cards(numero);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_ativo ON loyalty_cards(ativo);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_card_id ON loyalty_transactions(loyalty_card_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_sale_id ON loyalty_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_tipo ON loyalty_transactions(tipo);