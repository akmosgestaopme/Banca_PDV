/*
  # Sistema de Relatórios

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `nome` (text) - nome do relatório
      - `tipo` (text) - vendas, financeiro, estoque, produtos
      - `parametros` (jsonb) - parâmetros do relatório
      - `dados` (jsonb) - dados gerados do relatório
      - `formato` (text) - pdf, excel, json
      - `status` (text) - gerando, concluido, erro
      - `arquivo_url` (text) - URL do arquivo gerado
      - `tamanho_arquivo` (bigint) - tamanho do arquivo em bytes
      - `user_id` (uuid, foreign key to users)
      - `agendado` (boolean) - se é um relatório agendado
      - `frequencia` (text) - daily, weekly, monthly
      - `proximo_envio` (timestamp) - próxima execução agendada
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reports` table
    - Add policies for users to manage their own reports
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY['vendas', 'financeiro', 'estoque', 'produtos', 'clientes', 'auditoria'])),
  parametros jsonb DEFAULT '{}',
  dados jsonb,
  formato text DEFAULT 'pdf' CHECK (formato = ANY(ARRAY['pdf', 'excel', 'json', 'csv'])),
  status text DEFAULT 'gerando' CHECK (status = ANY(ARRAY['gerando', 'concluido', 'erro'])),
  arquivo_url text,
  tamanho_arquivo bigint DEFAULT 0,
  user_id uuid NOT NULL REFERENCES users(id),
  agendado boolean DEFAULT false,
  frequencia text CHECK (frequencia = ANY(ARRAY['daily', 'weekly', 'monthly'])),
  proximo_envio timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar seus próprios relatórios"
  ON reports
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gerentes e administradores podem ver todos os relatórios"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = ANY(ARRAY['administrador', 'gerente'])
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_tipo ON reports(tipo);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_agendado ON reports(agendado);
CREATE INDEX IF NOT EXISTS idx_reports_proximo_envio ON reports(proximo_envio);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);