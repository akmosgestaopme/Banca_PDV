# 📦 Como Gerar o Instalador do PDV Banca de Jornal - CYBERPIU

## 🔧 Pré-requisitos

### 1. Node.js
- Instale o Node.js versão 18 ou superior
- Download: https://nodejs.org/

### 2. Ícones da Aplicação
Você precisa criar os ícones nos formatos:
- **Windows**: `public/icon.ico` (256x256 pixels)
- **macOS**: `public/icon.icns` 
- **Linux**: `public/icon.png` (512x512 pixels)

## 🚀 Passos para Gerar o Instalador

### 1. Instalar Dependências
```bash
npm install
```

### 2. Gerar Build de Produção
```bash
npm run build
```

### 3. Gerar o Executável e Instalador
```bash
npm run dist
```

## 📁 Arquivos Gerados

Após executar `npm run dist`, os arquivos serão criados na pasta `dist-electron/`:

### Windows:
- `PDV Banca de Jornal - CYBERPIU Setup 1.0.0.exe` (Instalador)
- `PDV Banca de Jornal - CYBERPIU 1.0.0.exe` (Executável)

### Estrutura de Pastas:
```
📁 dist-electron/
├── 📄 PDV Banca de Jornal - CYBERPIU Setup 1.0.0.exe (INSTALADOR)
├── 📄 PDV Banca de Jornal - CYBERPIU 1.0.0.exe (EXECUTÁVEL)
├── 📁 win-unpacked/ (Arquivos descompactados)
└── 📄 latest.yml (Metadados)
```

## 🎯 Arquivo Principal

O arquivo que você deve distribuir é:
**`PDV Banca de Jornal - CYBERPIU Setup 1.0.0.exe`**

Este é o instalador que:
- ✅ Instala a aplicação no computador
- ✅ Cria atalhos na área de trabalho
- ✅ Adiciona ao menu iniciar
- ✅ Configura desinstalador
- ✅ Permite escolher pasta de instalação

## 💾 Localização do Banco de Dados

Após a instalação, o banco de dados SQLite será criado em:
```
C:\Users\[NomeUsuario]\AppData\Roaming\PDV Banca de Jornal - CYBERPIU\pdv_database.db
```

## 🔄 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Executar em modo web
npm run electron-dev        # Executar versão Electron

# Produção
npm run build              # Build da aplicação web
npm run build-electron     # Build + Electron
npm run dist              # Gerar instalador final

# Limpeza
rm -rf dist dist-electron node_modules
npm install               # Reinstalar dependências
```

## ⚠️ Observações Importantes

1. **Ícones**: Certifique-se de ter os ícones corretos em `public/`
2. **Antivírus**: Alguns antivírus podem bloquear o executável inicialmente
3. **Certificado**: Para distribuição comercial, considere assinar o executável
4. **Tamanho**: O instalador terá aproximadamente 150-200MB
5. **Compatibilidade**: Funciona no Windows 7, 8, 10 e 11

## 🎨 Personalização

Para personalizar o instalador, edite:
- `electron-builder.yml` - Configurações gerais
- `installer.nsh` - Configurações específicas do NSIS
- `package.json` - Metadados da aplicação

---

**Desenvolvido por CYBERPIU**  
**Versão**: 1.0.0