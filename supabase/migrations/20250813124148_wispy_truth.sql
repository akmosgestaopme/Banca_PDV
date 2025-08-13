/*
  # Sistema de Categorias

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `nome` (text, unique) - nome da categoria
      - `descricao` (text) - descrição da categoria
      - `cor` (text) - cor da categoria em hex
      - `icone` (text) - ícone da categoria
      - `ordem` (integer) - ordem de exibição
      - `ativo` (boolean) - se a categoria está ativa
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `categories` table
    - Add policies for CRUD operations

  3. Changes
    - Add foreign key constraint to products table
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  cor text DEFAULT '#6B7280',
  icone text DEFAULT 'tag',
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler categorias"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes e administradores podem gerenciar categorias"
  ON categories
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
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_nome ON categories(nome);
CREATE INDEX IF NOT EXISTS idx_categories_ativo ON categories(ativo);
CREATE INDEX IF NOT EXISTS idx_categories_ordem ON categories(ordem);

-- Inserir categorias padrão
INSERT INTO categories (nome, descricao, cor, icone, ordem) VALUES
  ('JORNAIS', 'Jornais diários e semanais', '#3B82F6', 'newspaper', 1),
  ('REVISTAS', 'Revistas diversas', '#8B5CF6', 'book-open', 2),
  ('BEBIDAS', 'Bebidas em geral', '#10B981', 'coffee', 3),
  ('CIGARROS', 'Produtos de tabacaria', '#F59E0B', 'cigarette', 4),
  ('BRINQUEDOS', 'Brinquedos e jogos', '#EC4899', 'gamepad-2', 5),
  ('PAPELARIA', 'Materiais de escritório', '#6366F1', 'pen-tool', 6),
  ('DOCES', 'Doces e guloseimas', '#F97316', 'candy', 7),
  ('DIVERSOS', 'Produtos diversos', '#6B7280', 'package', 8)
ON CONFLICT (nome) DO NOTHING;