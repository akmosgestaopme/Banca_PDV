/*
  # Sistema de Clientes

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `nome` (text) - nome do cliente
      - `cpf_cnpj` (text) - CPF ou CNPJ do cliente
      - `telefone` (text) - telefone de contato
      - `email` (text) - email do cliente
      - `endereco` (text) - endereço completo
      - `data_nascimento` (date) - data de nascimento
      - `observacoes` (text) - observações sobre o cliente
      - `credito_limite` (numeric) - limite de crédito
      - `credito_usado` (numeric) - crédito já utilizado
      - `ativo` (boolean) - se o cliente está ativo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `customers` table
    - Add policies for CRUD operations

  3. Changes
    - Add customer_id to sales table
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf_cnpj text,
  telefone text,
  email text,
  endereco text,
  data_nascimento date,
  observacoes text,
  credito_limite numeric(10,2) DEFAULT 0,
  credito_usado numeric(10,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler clientes"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar clientes"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

CREATE POLICY "Vendedores podem criar clientes"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_nome ON customers(nome);
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_customers_telefone ON customers(telefone);
CREATE INDEX IF NOT EXISTS idx_customers_ativo ON customers(ativo);

-- Adicionar customer_id à tabela sales se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN customer_id uuid REFERENCES customers(id);
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
  END IF;
END $$;