/*
  # Configurações do Sistema

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `chave` (text, unique) - chave da configuração
      - `valor` (text) - valor da configuração
      - `tipo` (text) - string, number, boolean, json
      - `descricao` (text) - descrição da configuração
      - `categoria` (text) - categoria da configuração
      - `editavel` (boolean) - se pode ser editada pelo usuário
      - `user_id` (uuid, foreign key to users) - usuário que alterou
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `system_settings` table
    - Add policies for administrators to manage settings

  3. Default Settings
    - Insert default system configurations
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text,
  tipo text DEFAULT 'string' CHECK (tipo = ANY(ARRAY['string', 'number', 'boolean', 'json'])),
  descricao text,
  categoria text DEFAULT 'geral',
  editavel boolean DEFAULT true,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler configurações"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administradores podem gerenciar configurações"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo = 'administrador'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_settings_chave ON system_settings(chave);
CREATE INDEX IF NOT EXISTS idx_system_settings_categoria ON system_settings(categoria);

-- Inserir configurações padrão
INSERT INTO system_settings (chave, valor, tipo, descricao, categoria, editavel) VALUES
  ('empresa_nome', '', 'string', 'Nome da empresa', 'empresa', true),
  ('empresa_cnpj', '', 'string', 'CNPJ da empresa', 'empresa', true),
  ('empresa_endereco', '', 'string', 'Endereço da empresa', 'empresa', true),
  ('empresa_telefone', '', 'string', 'Telefone da empresa', 'empresa', true),
  ('empresa_email', '', 'string', 'Email da empresa', 'empresa', true),
  ('pdv_auto_print', 'false', 'boolean', 'Imprimir cupom automaticamente', 'pdv', true),
  ('pdv_sound_enabled', 'true', 'boolean', 'Sons do PDV habilitados', 'pdv', true),
  ('estoque_alerta_minimo', 'true', 'boolean', 'Alertas de estoque mínimo', 'estoque', true),
  ('backup_auto', 'true', 'boolean', 'Backup automático habilitado', 'sistema', true),
  ('backup_frequencia', 'daily', 'string', 'Frequência do backup automático', 'sistema', true),
  ('tema_padrao', 'light', 'string', 'Tema padrão do sistema', 'aparencia', true),
  ('cor_primaria', '#0d214f', 'string', 'Cor primária do sistema', 'aparencia', true),
  ('cor_secundaria', '#ea580c', 'string', 'Cor secundária do sistema', 'aparencia', true),
  ('moeda_simbolo', 'R$', 'string', 'Símbolo da moeda', 'financeiro', true),
  ('moeda_codigo', 'BRL', 'string', 'Código da moeda', 'financeiro', true),
  ('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário', 'sistema', true),
  ('idioma', 'pt-BR', 'string', 'Idioma do sistema', 'sistema', true)
ON CONFLICT (chave) DO NOTHING;