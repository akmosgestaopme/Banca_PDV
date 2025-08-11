# PDV Banca de Jornal - Aplicação Web

## 📋 Sobre o Projeto

Sistema PDV completo para banca de jornal desenvolvido pela CYBERPIU, agora como aplicação web moderna com banco de dados Supabase na nuvem.

## 🌐 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Banco de Dados**: Supabase (PostgreSQL)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Relatórios**: jsPDF
- **Gráficos**: Recharts
- **Datas**: date-fns

## 🗄️ Banco de Dados na Nuvem

### Supabase
- **Tipo**: PostgreSQL na nuvem
- **Segurança**: Row Level Security (RLS)
- **Backup**: Automático pelo Supabase
- **Escalabilidade**: Automática
- **Disponibilidade**: 99.9% uptime

### Características do Banco
- **Formato**: PostgreSQL
- **Localização**: Nuvem Supabase
- **Backup**: Automático e contínuo
- **Sincronização**: Tempo real
- **Segurança**: Criptografia end-to-end
- **Acesso**: API REST + GraphQL

## 🚀 Como Executar

### Pré-requisitos
1. Node.js 18+ instalado
2. Conta no Supabase (gratuita)
3. Projeto Supabase configurado

### Configuração do Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta (gratuita)
3. Crie um novo projeto
4. Copie a URL e a chave anônima do projeto
5. Configure as variáveis de ambiente

### Instalação
```bash
# Clonar o repositório
git clone [url-do-repositorio]
cd pdv-banca-jornal

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase

# Executar migrações do banco
# (As migrações serão aplicadas automaticamente pelo Supabase)

# Executar em modo desenvolvimento
npm run dev
```

### Produção
```bash
# Gerar build para produção
npm run build

# Servir arquivos estáticos
npm run preview
```

## 📦 Estrutura do Banco de Dados

### Tabelas Principais:
- **users**: Usuários do sistema
- **products**: Catálogo de produtos
- **suppliers**: Fornecedores
- **sales**: Vendas realizadas
- **sale_items**: Itens das vendas
- **sale_payments**: Formas de pagamento
- **cash_registers**: Caixas cadastrados
- **cash_sessions**: Sessões de caixa
- **cash_movements**: Movimentações financeiras
- **expenses**: Despesas e contas a pagar

### Usuários Padrão:
- **admin** / **123456** (Administrador)
- **gerente** / **123456** (Gerente)
- **vendedor** / **123456** (Vendedor)

## 🔧 Funcionalidades

### Sistema PDV
- ✅ Vendas com múltiplas formas de pagamento
- ✅ Controle de estoque em tempo real
- ✅ Emissão de cupons não fiscais
- ✅ Leitura de código de barras
- ✅ Sincronização em tempo real

### Gestão Financeira
- ✅ Controle de caixa
- ✅ Movimentações de entrada e saída
- ✅ Controle de despesas
- ✅ Relatórios financeiros
- ✅ Dashboard em tempo real

### Administração
- ✅ Gestão de usuários e permissões
- ✅ Cadastro de produtos e fornecedores
- ✅ Backup automático na nuvem
- ✅ Personalização de aparência
- ✅ Multi-usuário simultâneo

## 🔒 Segurança

- **Autenticação**: Sistema próprio com validação
- **Autorização**: Row Level Security (RLS)
- **Criptografia**: HTTPS + TLS 1.3
- **Backup**: Automático e contínuo
- **Auditoria**: Logs completos de ações
- **Permissões**: Controle granular por usuário

## 🌐 Vantagens da Versão Web

### Acessibilidade
- ✅ Acesso de qualquer dispositivo
- ✅ Não requer instalação
- ✅ Atualizações automáticas
- ✅ Compatível com mobile

### Colaboração
- ✅ Múltiplos usuários simultâneos
- ✅ Sincronização em tempo real
- ✅ Dados sempre atualizados
- ✅ Trabalho remoto

### Manutenção
- ✅ Backup automático na nuvem
- ✅ Sem perda de dados
- ✅ Escalabilidade automática
- ✅ Suporte 24/7 do Supabase

## 📊 Configuração do Ambiente

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_NAME=PDV Banca de Jornal
VITE_APP_VERSION=1.0.0
VITE_COMPANY_NAME=CYBERPIU
```

### Configuração do Supabase
1. **Criar Projeto**: Acesse o painel do Supabase
2. **Configurar Banco**: As migrações são aplicadas automaticamente
3. **Configurar RLS**: Políticas de segurança já configuradas
4. **Obter Credenciais**: URL e chave anônima do projeto

## 🔄 Migrações do Banco

As migrações são aplicadas automaticamente pelo Supabase:

1. **create_initial_schema.sql**: Estrutura inicial das tabelas
2. **insert_default_data.sql**: Dados iniciais do sistema
3. **create_rpc_functions.sql**: Funções específicas do banco

## 📱 Responsividade

- ✅ Design responsivo completo
- ✅ Otimizado para desktop, tablet e mobile
- ✅ Interface adaptativa
- ✅ Touch-friendly

## 🚀 Deploy

### Netlify (Recomendado)
```bash
# Build da aplicação
npm run build

# Deploy automático via Git
# Configure as variáveis de ambiente no painel do Netlify
```

### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Outros Provedores
- Qualquer provedor que suporte aplicações React/Vite
- Configure as variáveis de ambiente do Supabase

## 📞 Suporte

**CYBERPIU - Tecnologia e Inovação**
- 📧 Email: suporte@cyberpiu.com.br
- 📱 Telefone: (11) 99999-9999
- 🌐 Site: www.cyberpiu.com.br
- 💬 Chat: Suporte 24/7

## 🔄 Migração de Dados

Se você possui dados da versão desktop:
1. Exporte os dados da versão desktop
2. Use a funcionalidade de importação na versão web
3. Os dados serão migrados automaticamente

## 📈 Monitoramento

- **Performance**: Monitoramento em tempo real
- **Uptime**: 99.9% de disponibilidade
- **Backup**: Contínuo e automático
- **Logs**: Auditoria completa
- **Métricas**: Dashboard de uso

---

**Versão**: 1.0.0 Web  
**Desenvolvido por**: CYBERPIU  
**Licença**: Comercial  
**Banco de Dados**: Supabase PostgreSQL