#!/bin/bash

# Script de Teste de Build Local - Planor
# Simula o ambiente de produção localmente

echo "🔨 Testando Build Local do Planor..."
echo "======================================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar variáveis de ambiente
echo -e "\n${YELLOW}1. Verificando variáveis de ambiente...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
  echo "Copie .env.example para .env e configure as variáveis"
  exit 1
fi

# Verificar se as variáveis críticas existem
if ! grep -q "VITE_SUPABASE_URL" .env; then
  echo -e "${RED}❌ VITE_SUPABASE_URL não encontrada no .env${NC}"
  exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
  echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY não encontrada no .env${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Variáveis de ambiente OK${NC}"

# 2. Limpar build anterior
echo -e "\n${YELLOW}2. Limpando build anterior...${NC}"
rm -rf dist
echo -e "${GREEN}✅ Build anterior removido${NC}"

# 3. Executar build
echo -e "\n${YELLOW}3. Executando build...${NC}"
npm run build 2>&1 | tee build.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}❌ Build falhou! Verifique build.log${NC}"
  echo -e "\nÚltimas linhas do erro:"
  tail -20 build.log
  exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso${NC}"

# 4. Verificar arquivos gerados
echo -e "\n${YELLOW}4. Verificando arquivos gerados...${NC}"

if [ ! -d "dist/public" ]; then
  echo -e "${RED}❌ Diretório dist/public não foi criado${NC}"
  exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
  echo -e "${RED}❌ index.html não foi gerado${NC}"
  exit 1
fi

# Contar arquivos JS e CSS
JS_COUNT=$(find dist/public -name "*.js" | wc -l)
CSS_COUNT=$(find dist/public -name "*.css" | wc -l)

echo "  - Arquivos JS: $JS_COUNT"
echo "  - Arquivos CSS: $CSS_COUNT"
echo "  - Tamanho total: $(du -sh dist/public | cut -f1)"

if [ $JS_COUNT -eq 0 ]; then
  echo -e "${RED}❌ Nenhum arquivo JS foi gerado${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Arquivos gerados corretamente${NC}"

# 5. Verificar conteúdo do index.html
echo -e "\n${YELLOW}5. Verificando index.html...${NC}"

if ! grep -q "root" dist/public/index.html; then
  echo -e "${RED}❌ Elemento #root não encontrado no index.html${NC}"
  exit 1
fi

if ! grep -q "script" dist/public/index.html; then
  echo -e "${RED}❌ Nenhum script encontrado no index.html${NC}"
  exit 1
fi

echo -e "${GREEN}✅ index.html válido${NC}"

# 6. Iniciar servidor local
echo -e "\n${YELLOW}6. Iniciando servidor local...${NC}"
echo -e "${GREEN}Servidor rodando em: http://localhost:3000${NC}"
echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
echo ""
echo "🔍 Abra http://localhost:3000 no navegador"
echo "📋 Abra F12 > Console para ver erros"
echo "🌐 Abra F12 > Network para ver requisições"
echo ""

# Verificar se 'serve' está instalado
if ! command -v serve &> /dev/null; then
  echo "Instalando 'serve'..."
  npm install -g serve
fi

serve dist/public -p 3000
