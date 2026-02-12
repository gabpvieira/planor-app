# Vercel Cache Fix - Tela Branca

## Problema
O app está mostrando tela branca com erro:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```

## Causa
Este erro geralmente ocorre quando:
1. O Vercel está servindo cache antigo
2. Os arquivos de build não foram atualizados corretamente
3. Há um problema de roteamento (SPA)

## Soluções

### 1. Limpar Cache do Vercel (Recomendado)
No painel do Vercel:
1. Vá em Settings > General
2. Role até "Build & Development Settings"
3. Clique em "Clear Cache"
4. Faça um novo deploy manual

### 2. Forçar Redeploy
```bash
# Já foi feito automaticamente com o commit anterior
git commit --allow-empty -m "chore: Force redeploy"
git push origin main
```

### 3. Verificar Configuração do Vercel
Certifique-se que:
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Install Command: `npm install`
- Framework Preset: Other

### 4. Limpar Cache do Navegador
No navegador:
1. Abra DevTools (F12)
2. Clique com botão direito no ícone de refresh
3. Selecione "Empty Cache and Hard Reload"

### 5. Verificar Logs do Vercel
1. Acesse o painel do Vercel
2. Vá em Deployments
3. Clique no último deploy
4. Verifique os logs de build

## Status Atual
✅ Build local funcionando corretamente
✅ Commit de trigger enviado
⏳ Aguardando redeploy do Vercel

## Próximos Passos
1. Aguardar o deploy completar no Vercel
2. Limpar cache do navegador
3. Testar novamente

Se o problema persistir, pode ser necessário:
- Verificar se todos os arquivos estão sendo copiados para dist/public
- Revisar o vercel.json para garantir que os rewrites estão corretos
- Verificar se há algum erro nos logs de build do Vercel
