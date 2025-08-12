# PDV Banca de Jornal - Aplicação Web

Sistema PDV completo para banca de jornal desenvolvido pela CYBERPIU como aplicação web moderna com banco de dados Supabase.

## 🌐 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Banco de Dados**: Supabase (PostgreSQL)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Relatórios**: jsPDF
- **Datas**: date-fns

## 🗄️ Banco de Dados

### Supabase PostgreSQL
- **Segurança**: Row Level Security (RLS)
- **Backup**: Automático
- **Escalabilidade**: Automática
- **Disponibilidade**: 99.9% uptime

## 🚀 Como Executar

### Pré-requisitos
1. Node.js 18+
2. Conta no Supabase (gratuita)

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Executar em desenvolvimento
npm run dev
```

### Produção
```bash
npm run build
npm run preview
```

## 📦 Estrutura do Banco

### Tabelas:
- **users**: Usuários do sistema
- **products**: Catálogo de produtos
- **suppliers**: Fornecedores
- **sales**: Vendas realizadas
- **sale_items**: Itens das vendas
- **sale_payments**: Formas de pagamento
- **cash_registers**: Caixas cadastrados
- **cash_sessions**: Sessões de caixa
- **cash_movements**: Movimentações financeiras
- **expenses**: Despesas

### Usuários Padrão:
- **admin** / **123456** (Administrador)
- **gerente** / **123456** (Gerente)
- **vendedor** / **123456** (Vendedor)

## 🔧 Funcionalidades

### Sistema PDV
- ✅ Vendas com múltiplas formas de pagamento
- ✅ Controle de estoque em tempo real
- ✅ Emissão de cupons não fiscais
- ✅ Sincronização em tempo real

### Gestão Financeira
- ✅ Controle de caixa
- ✅ Movimentações de entrada e saída
- ✅ Controle de despesas
- ✅ Relatórios financeiros

### Administração
- ✅ Gestão de usuários e permissões
- ✅ Cadastro de produtos e fornecedores
- ✅ Backup automático na nuvem
- ✅ Personalização de aparência

## 🔒 Segurança

- **Autenticação**: Sistema próprio com validação
- **Autorização**: Row Level Security (RLS)
- **Criptografia**: HTTPS + TLS 1.3
- **Backup**: Automático e contínuo

## 📊 Configuração

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 📞 Suporte

**CYBERPIU - Tecnologia e Inovação**
- 📧 Email: suporte@cyberpiu.com.br
- 📱 Telefone: (11) 99999-9999
- 🌐 Site: www.cyberpiu.com.br

---

**Versão**: 1.0.0 Web  
**Desenvolvido por**: CYBERPIU  
**Licença**: Comercial