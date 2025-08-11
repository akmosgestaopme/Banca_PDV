/*
  # Dados iniciais do sistema

  1. Usuários Padrão
    - Administrador, Gerente e Vendedor com senhas padrão

  2. Caixa Padrão
    - Caixa Principal para operações

  3. Fornecedores de Exemplo
    - Distribuidoras e fornecedores típicos de banca

  4. Produtos de Exemplo
    - Produtos comuns em bancas de jornal

  5. Categorias Padrão
    - Categorias típicas do segmento
*/

-- Inserir usuários padrão
INSERT INTO users (id, nome, usuario, senha, tipo, ativo) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrador do Sistema', 'admin', '123456', 'administrador', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Gerente da Loja', 'gerente', '123456', 'gerente', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Vendedor da Loja', 'vendedor', '123456', 'vendedor', true)
ON CONFLICT (usuario) DO NOTHING;

-- Inserir caixa padrão
INSERT INTO cash_registers (id, nome, descricao, ativo) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Caixa Principal', 'Caixa principal da loja', true)
ON CONFLICT DO NOTHING;

-- Inserir fornecedores de exemplo
INSERT INTO suppliers (id, nome, cnpj_cpf, telefone, email, endereco, website, observacoes, ativo) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', 'Distribuidora ABC Ltda', '12.345.678/0001-90', '(11) 99999-9999', 'contato@distribuidoraabc.com', 'Rua das Flores, 123 - Centro - São Paulo/SP', 'www.distribuidoraabc.com', 'Fornecedor principal de revistas e jornais', true),
  ('550e8400-e29b-41d4-a716-446655440021', 'Fornecedor XYZ', '98.765.432/0001-10', '(11) 88888-8888', 'vendas@fornecedorxyz.com', 'Av. Principal, 456 - Jardim - São Paulo/SP', 'www.fornecedorxyz.com.br', 'Fornecedor de produtos diversos', true),
  ('550e8400-e29b-41d4-a716-446655440022', 'Distribuidora de Bebidas Refrescante', '45.678.901/0001-23', '(11) 97777-7777', 'comercial@refrescante.com.br', 'Rua das Bebidas, 789 - Vila Industrial - São Paulo/SP', 'www.refrescante.com.br', 'Fornecedor de refrigerantes e água', true)
ON CONFLICT DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO products (id, nome, codigo, codigo_barras, preco, categoria, estoque, estoque_minimo, supplier_id, ativo) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', 'Jornal O Globo', '001', '7891234567890', 3.50, 'JORNAIS', 50, 10, '550e8400-e29b-41d4-a716-446655440020', true),
  ('550e8400-e29b-41d4-a716-446655440031', 'Revista Veja', '002', '7891234567891', 12.90, 'REVISTAS', 30, 5, '550e8400-e29b-41d4-a716-446655440020', true),
  ('550e8400-e29b-41d4-a716-446655440032', 'Chiclete Trident', '003', '7891234567892', 2.50, 'DOCES', 100, 20, '550e8400-e29b-41d4-a716-446655440021', true),
  ('550e8400-e29b-41d4-a716-446655440033', 'Água Mineral 500ml', '004', '7891234567893', 2.00, 'BEBIDAS', 80, 15, '550e8400-e29b-41d4-a716-446655440022', true),
  ('550e8400-e29b-41d4-a716-446655440034', 'Cigarro Marlboro', '005', '7891234567894', 8.50, 'CIGARROS', 40, 10, '550e8400-e29b-41d4-a716-446655440021', true),
  ('550e8400-e29b-41d4-a716-446655440035', 'Refrigerante Coca-Cola 350ml', '006', '7891234567895', 4.50, 'BEBIDAS', 60, 12, '550e8400-e29b-41d4-a716-446655440022', true),
  ('550e8400-e29b-41d4-a716-446655440036', 'Revista Época', '007', '7891234567896', 9.90, 'REVISTAS', 25, 5, '550e8400-e29b-41d4-a716-446655440020', true),
  ('550e8400-e29b-41d4-a716-446655440037', 'Bala Halls', '008', '7891234567897', 1.50, 'DOCES', 150, 30, '550e8400-e29b-41d4-a716-446655440021', true),
  ('550e8400-e29b-41d4-a716-446655440038', 'Jornal Folha de S.Paulo', '009', '7891234567898', 3.00, 'JORNAIS', 45, 10, '550e8400-e29b-41d4-a716-446655440020', true),
  ('550e8400-e29b-41d4-a716-446655440039', 'Energético Red Bull', '010', '7891234567899', 8.90, 'BEBIDAS', 35, 8, '550e8400-e29b-41d4-a716-446655440022', true)
ON CONFLICT (codigo) DO NOTHING;

-- Inserir despesas de exemplo
INSERT INTO expenses (id, descricao, categoria, valor, data_vencimento, pago, data_pagamento, recorrente, forma_pagamento, observacoes, user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', 'Aluguel da Loja', 'fixa', 1500.00, CURRENT_DATE + INTERVAL '5 days', true, CURRENT_DATE - INTERVAL '25 days', true, 'transferencia', 'Pagamento mensal do aluguel', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440041', 'Energia Elétrica', 'fixa', 250.00, CURRENT_DATE + INTERVAL '15 days', false, null, true, 'dinheiro', 'Conta de energia mensal', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440042', 'Fornecedor ABC', 'variavel', 850.00, CURRENT_DATE - INTERVAL '5 days', false, null, false, 'dinheiro', 'Pagamento de mercadorias', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440043', 'Internet', 'fixa', 120.00, CURRENT_DATE + INTERVAL '20 days', false, null, true, 'dinheiro', 'Internet fibra 200MB', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440044', 'Manutenção do Sistema', 'fixa', 99.90, CURRENT_DATE + INTERVAL '3 days', false, null, true, 'cartao_credito', 'Mensalidade do sistema PDV', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;