@echo off
echo ========================================
echo   PDV Banca de Jornal - CYBERPIU
echo   Script de Build para Release
echo ========================================
echo.

echo [1/4] Limpando arquivos antigos...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron

echo [2/4] Instalando dependencias...
call npm install

echo [3/4] Gerando build de producao...
call npm run build

echo [4/4] Gerando executavel e instalador...
call npm run dist

echo.
echo ========================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Arquivos gerados em: dist-electron/
echo.
echo Instalador: PDV Banca de Jornal - CYBERPIU Setup 1.0.0.exe
echo.
pause