/*
  # Sistema de Promoções e Descontos

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `nome` (text) - nome da promoção
      - `descricao` (text) - descrição da promoção
      - `tipo` (text) - percentual, valor_fixo, leve_pague
      - `valor_desconto` (numeric) - valor ou percentual do desconto
      - `quantidade_minima` (integer) - quantidade mínima para aplicar
      - `valor_minimo` (numeric) - valor mínimo da compra
      - `data_inicio` (timestamp) - início da promoção
      - `data_fim` (timestamp) - fim da promoção
      - `ativo` (boolean) - se a promoção está ativa
      - `aplicavel_produtos` (text[]) - IDs dos produtos aplicáveis
      - `aplicavel_categorias` (text[]) - categorias aplicáveis
      - `limite_uso` (integer) - limite de uso por cliente
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `promotions` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY['percentual', 'valor_fixo', 'leve_pague'])),
  valor_desconto numeric(10,2) NOT NULL CHECK (valor_desconto >= 0),
  quantidade_minima integer DEFAULT 1 CHECK (quantidade_minima > 0),
  valor_minimo numeric(10,2) DEFAULT 0 CHECK (valor_minimo >= 0),
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,
  ativo boolean DEFAULT true,
  aplicavel_produtos text[],
  aplicavel_categorias text[],
  limite_uso integer,
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (data_fim > data_inicio)
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler promoções ativas"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (ativo = true AND now() BETWEEN data_inicio AND data_fim);

CREATE POLICY "Gerentes e administradores podem gerenciar promoções"
  ON promotions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_promotions_data_inicio ON promotions(data_inicio);
CREATE INDEX IF NOT EXISTS idx_promotions_data_fim ON promotions(data_fim);
CREATE INDEX IF NOT EXISTS idx_promotions_ativo ON promotions(ativo);
CREATE INDEX IF NOT EXISTS idx_promotions_tipo ON promotions(tipo);