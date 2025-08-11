# PDV Banca de Jornal - Aplicação Desktop

## 📋 Sobre o Projeto

Sistema PDV completo para banca de jornal desenvolvido pela CYBERPIU, agora como aplicação desktop (.exe) com banco de dados local SQLite.

## 🗄️ Banco de Dados Local

### Localização do Banco
O banco de dados SQLite é armazenado automaticamente em:
- **Windows**: `C:\Users\[Usuario]\AppData\Roaming\PDV Banca de Jornal\pdv_database.db`
- **macOS**: `~/Library/Application Support/PDV Banca de Jornal/pdv_database.db`
- **Linux**: `~/.config/PDV Banca de Jornal/pdv_database.db`

### Características do Banco
- **Formato**: SQLite (.db)
- **Tamanho**: Compacto e eficiente
- **Backup**: Fácil de copiar e restaurar
- **Portabilidade**: Pode ser movido entre computadores
- **Integridade**: Transações ACID garantem consistência dos dados

## 🚀 Como Executar

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (web)
npm run dev

# Executar versão Electron em desenvolvimento
npm run electron-dev
```

### Produção
```bash
# Gerar build para produção
npm run build

# Gerar executável (.exe)
npm run dist
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

### Gestão Financeira
- ✅ Controle de caixa
- ✅ Movimentações de entrada e saída
- ✅ Controle de despesas
- ✅ Relatórios financeiros

### Administração
- ✅ Gestão de usuários e permissões
- ✅ Cadastro de produtos e fornecedores
- ✅ Backup e restauração de dados
- ✅ Personalização de aparência

## 💾 Backup e Segurança

### Backup Automático
- O sistema gera backups automáticos do banco de dados
- Backups são salvos na mesma pasta do banco principal
- Recomenda-se fazer backup manual periodicamente

### Backup Manual
1. Acesse **Configurações > Backup**
2. Clique em **"Criar Backup"**
3. Salve o arquivo em local seguro
4. Para restaurar, use **"Restaurar Backup"**

### Localização dos Arquivos
```
📁 Pasta do Usuário/
├── 📁 AppData/Roaming/PDV Banca de Jornal/
│   ├── 📄 pdv_database.db (Banco principal)
│   ├── 📁 backups/
│   │   ├── 📄 backup_20241201_143022.db
│   │   └── 📄 backup_20241202_090015.db
│   └── 📁 logs/
│       └── 📄 app.log
```

## 🔒 Segurança

- **Controle de Acesso**: Sistema de usuários com diferentes níveis de permissão
- **Auditoria**: Todas as operações são registradas com usuário e timestamp
- **Integridade**: Banco SQLite com constraints e validações
- **Backup**: Sistema de backup automático e manual

## 📞 Suporte

**CYBERPIU - Tecnologia e Inovação**
- 📧 Email: suporte@cyberpiu.com.br
- 📱 Telefone: (11) 99999-9999
- 🌐 Site: www.cyberpiu.com.br

---

**Versão**: 1.0.0  
**Desenvolvido por**: CYBERPIU  
**Licença**: Comercial