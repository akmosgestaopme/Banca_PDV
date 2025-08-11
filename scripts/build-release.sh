#!/bin/bash

echo "========================================"
echo "  PDV Banca de Jornal - CYBERPIU"
echo "  Script de Build para Release"
echo "========================================"
echo

echo "[1/4] Limpando arquivos antigos..."
rm -rf dist dist-electron

echo "[2/4] Instalando dependências..."
npm install

echo "[3/4] Gerando build de produção..."
npm run build

echo "[4/4] Gerando executável e instalador..."
npm run dist

echo
echo "========================================"
echo "  BUILD CONCLUÍDO COM SUCESSO!"
echo "========================================"
echo
echo "Arquivos gerados em: dist-electron/"
echo
echo "Instalador: PDV Banca de Jornal - CYBERPIU Setup 1.0.0.exe"
echo