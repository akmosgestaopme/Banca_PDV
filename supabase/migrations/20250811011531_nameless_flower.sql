/*
  # Funções RPC para operações específicas

  1. Funções de Estoque
    - update_product_stock: Atualizar estoque após venda
    - check_low_stock: Verificar produtos com estoque baixo

  2. Funções de Relatórios
    - get_sales_summary: Resumo de vendas por período
    - get_financial_summary: Resumo financeiro

  3. Funções de Caixa
    - update_session_totals: Atualizar totais da sessão
*/

-- Função para atualizar estoque do produto após venda
CREATE OR REPLACE FUNCTION update_product_stock(product_id uuid, quantity_sold integer)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET estoque = estoque - quantity_sold,
      updated_at = now()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar produtos com estoque baixo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE(
  id uuid,
  nome text,
  codigo text,
  estoque integer,
  estoque_minimo integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nome, p.codigo, p.estoque, p.estoque_minimo
  FROM products p
  WHERE p.estoque <= p.estoque_minimo AND p.ativo = true
  ORDER BY p.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter resumo de vendas por período
CREATE OR REPLACE FUNCTION get_sales_summary(
  start_date timestamptz,
  end_date timestamptz,
  vendedor_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  total_vendas bigint,
  valor_total numeric,
  ticket_medio numeric,
  produtos_vendidos bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(s.id)::bigint as total_vendas,
    COALESCE(SUM(s.total), 0) as valor_total,
    COALESCE(AVG(s.total), 0) as ticket_medio,
    COALESCE(SUM(si.quantidade), 0)::bigint as produtos_vendidos
  FROM sales s
  LEFT JOIN sale_items si ON s.id = si.sale_id
  WHERE s.data_venda >= start_date 
    AND s.data_venda <= end_date
    AND s.cancelada = false
    AND (vendedor_id_param IS NULL OR s.vendedor_id = vendedor_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter resumo financeiro
CREATE OR REPLACE FUNCTION get_financial_summary(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE(
  total_entradas numeric,
  total_saidas numeric,
  saldo_liquido numeric,
  total_vendas numeric,
  total_despesas numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN cm.tipo = 'entrada' THEN cm.valor ELSE 0 END), 0) as total_entradas,
    COALESCE(SUM(CASE WHEN cm.tipo = 'saida' THEN cm.valor ELSE 0 END), 0) as total_saidas,
    COALESCE(SUM(CASE WHEN cm.tipo = 'entrada' THEN cm.valor ELSE -cm.valor END), 0) as saldo_liquido,
    COALESCE((SELECT SUM(s.total) FROM sales s WHERE s.data_venda >= start_date AND s.data_venda <= end_date AND s.cancelada = false), 0) as total_vendas,
    COALESCE((SELECT SUM(e.valor) FROM expenses e WHERE e.data_vencimento >= start_date::date AND e.data_vencimento <= end_date::date AND e.pago = true), 0) as total_despesas
  FROM cash_movements cm
  WHERE cm.data >= start_date AND cm.data <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar totais da sessão de caixa
CREATE OR REPLACE FUNCTION update_session_totals(session_id uuid)
RETURNS void AS $$
DECLARE
  entradas numeric;
  saidas numeric;
  vendas numeric;
BEGIN
  -- Calcular totais das movimentações
  SELECT 
    COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN categoria = 'venda' THEN valor ELSE 0 END), 0)
  INTO entradas, saidas, vendas
  FROM cash_movements
  WHERE cash_session_id = session_id;

  -- Atualizar sessão
  UPDATE cash_sessions
  SET 
    total_entradas = entradas,
    total_saidas = saidas,
    total_vendas = vendas,
    updated_at = now()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar totais da sessão automaticamente
CREATE OR REPLACE FUNCTION trigger_update_session_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cash_session_id IS NOT NULL THEN
    PERFORM update_session_totals(NEW.cash_session_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas movimentações de caixa
DROP TRIGGER IF EXISTS update_session_totals_trigger ON cash_movements;
CREATE TRIGGER update_session_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_session_totals();