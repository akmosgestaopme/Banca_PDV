/*
  # Sistema de Widgets do Dashboard

  1. New Tables
    - `dashboard_widgets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tipo` (text) - vendas_hoje, estoque_baixo, despesas_vencendo, etc
      - `titulo` (text) - título do widget
      - `configuracao` (jsonb) - configurações específicas do widget
      - `posicao_x` (integer) - posição horizontal
      - `posicao_y` (integer) - posição vertical
      - `largura` (integer) - largura do widget
      - `altura` (integer) - altura do widget
      - `visivel` (boolean) - se o widget está visível
      - `ordem` (integer) - ordem de exibição
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `dashboard_widgets` table
    - Add policies for users to manage their own widgets
*/

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY[
    'vendas_hoje', 'vendas_mes', 'estoque_baixo', 'produtos_mais_vendidos',
    'despesas_vencendo', 'receita_mensal', 'clientes_novos', 'meta_vendas',
    'caixa_atual', 'produtos_sem_estoque', 'fornecedores_ativos', 'usuarios_online'
  ])),
  titulo text NOT NULL,
  configuracao jsonb DEFAULT '{}',
  posicao_x integer DEFAULT 0,
  posicao_y integer DEFAULT 0,
  largura integer DEFAULT 1 CHECK (largura BETWEEN 1 AND 12),
  altura integer DEFAULT 1 CHECK (altura BETWEEN 1 AND 6),
  visivel boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar seus próprios widgets"
  ON dashboard_widgets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_tipo ON dashboard_widgets(tipo);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_visivel ON dashboard_widgets(visivel);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_ordem ON dashboard_widgets(ordem);

-- Inserir widgets padrão para administradores
INSERT INTO dashboard_widgets (user_id, tipo, titulo, posicao_x, posicao_y, largura, altura, ordem)
SELECT 
  u.id,
  'vendas_hoje',
  'Vendas de Hoje',
  0, 0, 3, 2, 1
FROM users u 
WHERE u.tipo = 'administrador'
ON CONFLICT DO NOTHING;

INSERT INTO dashboard_widgets (user_id, tipo, titulo, posicao_x, posicao_y, largura, altura, ordem)
SELECT 
  u.id,
  'estoque_baixo',
  'Produtos com Estoque Baixo',
  3, 0, 3, 2, 2
FROM users u 
WHERE u.tipo = 'administrador'
ON CONFLICT DO NOTHING;

INSERT INTO dashboard_widgets (user_id, tipo, titulo, posicao_x, posicao_y, largura, altura, ordem)
SELECT 
  u.id,
  'receita_mensal',
  'Receita do Mês',
  6, 0, 3, 2, 3
FROM users u 
WHERE u.tipo = 'administrador'
ON CONFLICT DO NOTHING;