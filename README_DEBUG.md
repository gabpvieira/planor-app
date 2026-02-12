# 🔍 Guia de Debug - Tela Branca no Deploy

## 📁 Arquivos Criados

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| `SOLUCAO_RAPIDA.md` | ⚡ **COMECE AQUI** - Soluções rápidas para 90% dos casos | Primeira tentativa de debug |
| `DIAGNOSTICO_TELA_BRANCA.md` | 📊 Diagnóstico completo com 3 causas principais | Quando solução rápida não funcionar |
| `FIX_HYDRATION_ERRORS.md` | 🔧 Correções de código para erros de hidratação | Quando console mostra "Hydration failed" |
| `test-local-build.bat` | 🪟 Script de teste para Windows | Testar build localmente (Windows) |
| `test-local-build.sh` | 🐧 Script de teste para Linux/Mac | Testar build localmente (Unix) |
| `debug-production.js` | 🌐 Script para executar no console do navegador | Debug direto na URL de produção |

---

## 🚀 Início Rápido (3 minutos)

### 1️⃣ Teste Local (Windows)
```cmd
test-local-build.bat
```

### 1️⃣ Teste Local (Linux/Mac)
```bash
chmod +x test-local-build.sh
./test-local-build.sh
```

### 2️⃣ Debug Produção
1. Abra sua URL de produção no navegador
2. Pressione `F12` para abrir DevTools
3. Vá na aba `Console`
4. Copie e cole todo o conteúdo de `debug-production.js`
5. Pressione Enter
6. Aguarde 2 segundos e leia o resumo

### 3️⃣ Verificar Variáveis na Vercel
```bash
vercel env ls
```

Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` não aparecerem:
```bash
vercel env add VITE_SUPABASE_URL production
# Cole: https://seu-projeto.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: sua-chave-anon
```

---

## 🎯 Fluxograma de Decisão

```
Tela Branca no Deploy?
│
├─ Console mostra erro?
│  │
│  ├─ "Supabase credentials missing"
│  │  └─> Adicione variáveis na Vercel (SOLUCAO_RAPIDA.md)
│  │
│  ├─ "Hydration failed"
│  │  └─> Aplique FIX #1 (FIX_HYDRATION_ERRORS.md)
│  │
│  ├─ "navigator is not defined"
│  │  └─> Aplique FIX #4 (FIX_HYDRATION_ERRORS.md)
│  │
│  └─ Outro erro
│     └─> Leia DIAGNOSTICO_TELA_BRANCA.md
│
└─ Console limpo (sem erros)?
   │
   ├─ Root vazio? (document.getElementById('root').children.length === 0)
   │  └─> Problema no build - rode test-local-build
   │
   └─ Network mostra 404/500?
      └─> Problema de roteamento - verifique vercel.json
```

---

## 📊 Matriz de Sintomas vs Causas

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Tela branca + console limpo | Variáveis de ambiente ausentes | Adicionar vars na Vercel |
| "Hydration failed" no console | localStorage no render inicial | FIX #1 (theme-provider) |
| "navigator is not defined" | mic-recorder-to-mp3 no SSR | FIX #4 (lazy load) |
| Build falha localmente | Erro de TypeScript/sintaxe | Verificar logs de build |
| 404 em assets/*.js | Problema de build/deploy | Verificar vercel.json |
| CORS error | Configuração Supabase | Adicionar domínio no Supabase |

---

## 🔧 Ferramentas de Debug

### 1. Console do Navegador (F12)
```javascript
// Verificação rápida
console.log('Vars:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// Verificar React
console.log('Root:', document.getElementById('root')?.innerHTML);

// Limpar cache
localStorage.clear();
location.reload();
```

### 2. Vercel CLI
```bash
# Ver logs em tempo real
vercel logs --follow

# Listar variáveis
vercel env ls

# Adicionar variável
vercel env add NOME_VARIAVEL production

# Redeploy
vercel --prod
```

### 3. Build Local
```bash
# Build
npm run build

# Servir
npx serve dist/public -p 3000

# Abrir
# http://localhost:3000
```

---

## 📋 Checklist Completo

### Antes de Debugar
- [ ] Aplicação funciona em `localhost` (npm run dev)?
- [ ] Arquivo `.env` existe e está configurado?
- [ ] Supabase está acessível?

### Durante o Debug
- [ ] Executei `test-local-build`?
- [ ] Build local funciona?
- [ ] Executei `debug-production.js` no console?
- [ ] Verifiquei variáveis na Vercel?
- [ ] Console mostra erros?
- [ ] Network mostra 404/500?

### Após Correção
- [ ] Redeploy na Vercel
- [ ] Limpar cache (Ctrl+Shift+R)
- [ ] Testar em modo anônimo
- [ ] Testar em mobile
- [ ] Verificar console limpo

---

## 🎓 Entendendo os Erros

### Erro: "Supabase credentials missing"
**Causa**: Variáveis `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` não configuradas  
**Impacto**: Aplicação não inicia (tela branca)  
**Solução**: Adicionar variáveis na Vercel Dashboard

### Erro: "Hydration failed"
**Causa**: Diferença entre HTML do servidor e cliente (localStorage/window)  
**Impacto**: React não consegue hidratar, componentes não funcionam  
**Solução**: Mover acesso a localStorage para useEffect

### Erro: "navigator is not defined"
**Causa**: Biblioteca acessa API do navegador durante build  
**Impacto**: Build falha ou componente não renderiza  
**Solução**: Lazy load + client-side only rendering

---

## 🔥 Comandos Mais Usados

```bash
# 1. Teste local completo
npm run build && npx serve dist/public -p 3000

# 2. Ver logs da Vercel
vercel logs --follow

# 3. Adicionar variável de ambiente
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# 4. Redeploy
vercel --prod

# 5. Limpar cache local
rm -rf dist node_modules/.vite
npm run build
```

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir, reúna estas informações:

1. **Screenshot do console** (F12 > Console)
2. **Output do `debug-production.js`**
3. **Logs de build da Vercel**
4. **Lista de variáveis de ambiente** (sem valores sensíveis):
   ```bash
   vercel env ls
   ```
5. **Output do `test-local-build`**

---

## ✅ Sucesso!

Você saberá que está resolvido quando:

✅ Console limpo (sem erros)  
✅ Network sem 404/500  
✅ Aplicação carrega e é interativa  
✅ Funciona em modo anônimo  
✅ Funciona após limpar localStorage  
✅ Funciona em diferentes navegadores  

---

## 🎯 Próximos Passos

Após resolver o problema:

1. **Documente a solução** no seu README
2. **Atualize `.env.example`** com todas as variáveis necessárias
3. **Configure CI/CD** para validar variáveis antes do deploy
4. **Adicione testes** para prevenir regressões
5. **Configure monitoring** (Sentry, LogRocket) para detectar erros em produção

---

## 📚 Recursos Adicionais

- [Documentação Vercel - Environment Variables](https://vercel.com/docs/environment-variables)
- [Documentação Supabase - Auth](https://supabase.com/docs/guides/auth)
- [React Hydration Errors](https://react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Boa sorte com o debug! 🚀**
