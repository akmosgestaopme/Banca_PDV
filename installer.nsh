; Configurações personalizadas do instalador NSIS
; Arquivo de configuração para o instalador do PDV Banca de Jornal - CYBERPIU

; Configurações de idioma
!define MUI_LANGDLL_ALLLANGUAGES
!insertmacro MUI_LANGUAGE "Portuguese"
!insertmacro MUI_LANGUAGE "PortugueseBR"

; Strings personalizadas em português
LangString welcome ${LANG_PORTUGUESE} "Bem-vindo ao Assistente de Instalação do PDV Banca de Jornal - CYBERPIU"
LangString finish ${LANG_PORTUGUESE} "A instalação foi concluída com sucesso!"
LangString installing ${LANG_PORTUGUESE} "Instalando o PDV Banca de Jornal..."
LangString completed ${LANG_PORTUGUESE} "Instalação concluída"

; Configurar strings do instalador
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao PDV Banca de Jornal - CYBERPIU"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá guiá-lo através da instalação do PDV Banca de Jornal.$\r$\n$\r$\nSistema completo de Ponto de Venda desenvolvido pela CYBERPIU.$\r$\n$\r$\nClique em Avançar para continuar."
!define MUI_FINISHPAGE_TITLE "Instalação Concluída"
!define MUI_FINISHPAGE_TEXT "O PDV Banca de Jornal foi instalado com sucesso em seu computador.$\r$\n$\r$\nClique em Concluir para fechar este assistente."
!define MUI_FINISHPAGE_RUN_TEXT "Executar PDV Banca de Jornal"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Mostrar arquivo Leia-me"

; Configurações do instalador
!macro customInstall
  ; Criar atalho na área de trabalho
  CreateShortCut "$DESKTOP\PDV Banca - CYBERPIU.lnk" "$INSTDIR\PDV Banca de Jornal - CYBERPIU.exe"
  
  ; Criar entrada no menu iniciar
  CreateDirectory "$SMPROGRAMS\CYBERPIU"
  CreateShortCut "$SMPROGRAMS\CYBERPIU\PDV Banca de Jornal.lnk" "$INSTDIR\PDV Banca de Jornal - CYBERPIU.exe"
  CreateShortCut "$SMPROGRAMS\CYBERPIU\Desinstalar PDV Banca.lnk" "$INSTDIR\Uninstall PDV Banca de Jornal - CYBERPIU.exe"
!macroend

!macro customUnInstall
  ; Remover atalhos
  Delete "$DESKTOP\PDV Banca - CYBERPIU.lnk"
  Delete "$SMPROGRAMS\CYBERPIU\PDV Banca de Jornal.lnk"
  Delete "$SMPROGRAMS\CYBERPIU\Desinstalar PDV Banca.lnk"
  RMDir "$SMPROGRAMS\CYBERPIU"
!macroend