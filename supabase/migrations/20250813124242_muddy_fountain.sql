/*
  # Sistema de Notificações

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users) - usuário destinatário
      - `titulo` (text) - título da notificação
      - `mensagem` (text) - conteúdo da notificação
      - `tipo` (text) - info, success, warning, error
      - `categoria` (text) - system, sales, stock, financial, users
      - `lida` (boolean) - se foi lida
      - `data_leitura` (timestamp) - quando foi lida
      - `link` (text) - link relacionado à notificação
      - `metadata` (jsonb) - dados adicionais
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to manage their own notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text DEFAULT 'info' CHECK (tipo = ANY(ARRAY['info', 'success', 'warning', 'error'])),
  categoria text DEFAULT 'system' CHECK (categoria = ANY(ARRAY['system', 'sales', 'stock', 'financial', 'users'])),
  lida boolean DEFAULT false,
  data_leitura timestamptz,
  link text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar suas próprias notificações"
  ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Administradores podem gerenciar todas as notificações"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = 'administrador'
    )
  );

-- Função para marcar como lida automaticamente
CREATE OR REPLACE FUNCTION mark_notification_as_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lida = true AND OLD.lida = false THEN
    NEW.data_leitura = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar data de leitura
CREATE TRIGGER trigger_mark_notification_read
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION mark_notification_as_read();

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lida ON notifications(lida);
CREATE INDEX IF NOT EXISTS idx_notifications_categoria ON notifications(categoria);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);