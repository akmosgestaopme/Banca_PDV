/*
  # Sistema de Logs de Backup

  1. New Tables
    - `backup_logs`
      - `id` (uuid, primary key)
      - `nome` (text) - nome do backup
      - `tipo` (text) - manual, automatico, agendado
      - `status` (text) - iniciado, concluido, erro
      - `tamanho` (bigint) - tamanho do backup em bytes
      - `arquivo_path` (text) - caminho do arquivo
      - `checksum` (text) - hash de verificação
      - `dados_incluidos` (text[]) - tipos de dados incluídos
      - `data_inicio` (timestamp) - início do backup
      - `data_fim` (timestamp) - fim do backup
      - `duracao` (interval) - duração do backup
      - `erro_mensagem` (text) - mensagem de erro se houver
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `backup_logs` table
    - Add policies for administrators to manage backup logs
*/

CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY(ARRAY['manual', 'automatico', 'agendado'])),
  status text DEFAULT 'iniciado' CHECK (status = ANY(ARRAY['iniciado', 'concluido', 'erro'])),
  tamanho bigint DEFAULT 0,
  arquivo_path text,
  checksum text,
  dados_incluidos text[],
  data_inicio timestamptz DEFAULT now(),
  data_fim timestamptz,
  duracao interval GENERATED ALWAYS AS (data_fim - data_inicio) STORED,
  erro_mensagem text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Administradores podem gerenciar logs de backup"
  ON backup_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = 'administrador'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_backup_logs_tipo ON backup_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_data_inicio ON backup_logs(data_inicio);
CREATE INDEX IF NOT EXISTS idx_backup_logs_user_id ON backup_logs(user_id);