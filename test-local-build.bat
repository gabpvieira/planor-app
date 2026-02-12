@echo off
REM Script de Teste de Build Local - Planor (Windows)
REM Simula o ambiente de produção localmente

echo ========================================
echo Testando Build Local do Planor...
echo ========================================

REM 1. Verificar variáveis de ambiente
echo.
echo 1. Verificando variaveis de ambiente...
if not exist .env (
  echo [ERRO] Arquivo .env nao encontrado!
  echo Copie .env.example para .env e configure as variaveis
  exit /b 1
)

findstr /C:"VITE_SUPABASE_URL" .env >nul
if errorlevel 1 (
  echo [ERRO] VITE_SUPABASE_URL nao encontrada no .env
  exit /b 1
)

findstr /C:"VITE_SUPABASE_ANON_KEY" .env >nul
if errorlevel 1 (
  echo [ERRO] VITE_SUPABASE_ANON_KEY nao encontrada no .env
  exit /b 1
)

echo [OK] Variaveis de ambiente OK

REM 2. Limpar build anterior
echo.
echo 2. Limpando build anterior...
if exist dist rmdir /s /q dist
echo [OK] Build anterior removido

REM 3. Executar build
echo.
echo 3. Executando build...
call npm run build > build.log 2>&1

if errorlevel 1 (
  echo [ERRO] Build falhou! Verifique build.log
  type build.log
  exit /b 1
)

echo [OK] Build concluido com sucesso

REM 4. Verificar arquivos gerados
echo.
echo 4. Verificando arquivos gerados...

if not exist dist\public (
  echo [ERRO] Diretorio dist\public nao foi criado
  exit /b 1
)

if not exist dist\public\index.html (
  echo [ERRO] index.html nao foi gerado
  exit /b 1
)

echo [OK] Arquivos gerados corretamente

REM 5. Verificar conteúdo do index.html
echo.
echo 5. Verificando index.html...

findstr /C:"root" dist\public\index.html >nul
if errorlevel 1 (
  echo [ERRO] Elemento #root nao encontrado no index.html
  exit /b 1
)

findstr /C:"script" dist\public\index.html >nul
if errorlevel 1 (
  echo [ERRO] Nenhum script encontrado no index.html
  exit /b 1
)

echo [OK] index.html valido

REM 6. Iniciar servidor local
echo.
echo 6. Iniciando servidor local...
echo Servidor rodando em: http://localhost:3000
echo Pressione Ctrl+C para parar
echo.
echo Abra http://localhost:3000 no navegador
echo Abra F12 ^> Console para ver erros
echo Abra F12 ^> Network para ver requisicoes
echo.

REM Verificar se 'serve' está instalado
where serve >nul 2>nul
if errorlevel 1 (
  echo Instalando 'serve'...
  call npm install -g serve
)

serve dist\public -p 3000
