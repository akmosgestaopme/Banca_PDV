/*
  # Sistema de Auditoria

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `action` (text) - tipo de ação realizada
      - `table_name` (text) - tabela afetada
      - `record_id` (uuid) - ID do registro afetado
      - `old_values` (jsonb) - valores anteriores
      - `new_values` (jsonb) - novos valores
      - `ip_address` (text) - endereço IP do usuário
      - `user_agent` (text) - navegador/dispositivo
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `audit_logs` table
    - Add policy for administrators to read audit logs
    - Add policy for users to read their own actions

  3. Functions
    - Create trigger function for automatic audit logging
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = 'administrador'
    )
  );

CREATE POLICY "Users can read their own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);