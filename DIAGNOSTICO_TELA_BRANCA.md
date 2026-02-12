# 🔍 Diagnóstico: Tela Branca no Deploy - Planor

## 📊 Análise Realizada

Após análise do código, identifiquei **3 causas principais** que podem estar causando a tela em branco no deploy:

---

## 🎯 CAUSA #1: Variáveis de Ambiente Ausentes ou Incorretas (MAIS PROVÁVEL)

### Problema Identificado:
O arquivo `client/src/lib/supabase.ts` **lança um erro fatal** se as variáveis `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` não estiverem configuradas:

```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(errorMessage); // ❌ Isso quebra toda a aplicação
}
```

Este erro acontece **antes** do React renderizar qualquer componente, resultando em tela branca.

### Como Verificar:

#### 1. Console do Navegador (F12):
```javascript
// Abra o console e procure por:
// - "Supabase credentials missing"
// - "Application configuration error"
// - Erros de import.meta.env

// Verifique as variáveis:
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

#### 2. Vercel Dashboard:
```bash
# Acesse: https://vercel.com/[seu-usuario]/[seu-projeto]/settings/environment-variables

# Verifique se estas variáveis existem:
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY

# IMPORTANTE: Variáveis com prefixo VITE_ são expostas ao client-side
```

#### 3. Logs de Build da Vercel:
```bash
# No terminal local:
vercel logs [deployment-url] --follow

# Ou acesse: https://vercel.com/[seu-usuario]/[seu-projeto]/deployments
# Clique no deployment > "View Function Logs"
```

### ✅ Solução:
```bash
# 1. Adicione as variáveis no Vercel Dashboard:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# 2. Redeploy:
vercel --prod

# 3. Ou via CLI:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 🎯 CAUSA #2: Erros de Hidratação (localStorage/window no Render Inicial)

### Problema Identificado:
Encontrei **3 locais críticos** onde `localStorage` e `window` são acessados **fora de useEffect**:

#### 1. `client/src/components/theme-provider.tsx` (Linha 32):
```typescript
const [theme, setTheme] = useState<Theme>(
  () => (localStorage.getItem(storageKey) as Theme) || defaultTheme // ❌ SSR unsafe
);
```

#### 2. `client/src/App.tsx` (Linha 29):
```typescript
const [isCollapsed, setIsCollapsed] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"; // ⚠️ Parcialmente protegido
  }
  return false;
});
```

#### 3. `client/src/App.tsx` (Linha 47):
```typescript
style={{ 
  marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 // ⚠️ Pode causar mismatch
    ? (isCollapsed ? 'var(--sidebar-width-collapsed, 72px)' : 'var(--sidebar-width-expanded, 240px)')
    : '0',
}}
```

### Como Verificar:

#### Console do Navegador:
```javascript
// Procure por erros de hidratação:
// - "Hydration failed"
// - "Text content does not match"
// - "localStorage is not defined"
// - "window is not defined"

// Teste manualmente:
localStorage.clear();
location.reload();
```

### ✅ Solução:
```typescript
// FIX 1: theme-provider.tsx
const [theme, setTheme] = useState<Theme>(defaultTheme);

useEffect(() => {
  const stored = localStorage.getItem(storageKey) as Theme;
  if (stored) setTheme(stored);
}, []);

// FIX 2: App.tsx - já está correto com typeof window check

// FIX 3: Usar CSS media queries ao invés de window.innerWidth inline
```

---

## 🎯 CAUSA #3: Biblioteca mic-recorder-to-mp3 Incompatível com SSR

### Problema Identificado:
A biblioteca `mic-recorder-to-mp3` (usada no CommandCenterPage) pode estar tentando acessar APIs do navegador durante o build:

```json
// package.json
"mic-recorder-to-mp3": "^2.2.2"
```

Esta biblioteca acessa `navigator.mediaDevices` que **não existe** durante o build estático.

### Como Verificar:

#### 1. Logs de Build:
```bash
# Procure por:
# - "navigator is not defined"
# - "MediaRecorder is not defined"
# - Erros relacionados a "mic-recorder-to-mp3"

# No terminal:
npm run build 2>&1 | grep -i "error\|navigator\|mediadevices"
```

#### 2. Console do Navegador:
```javascript
// Verifique se o componente CommandCenter está carregando:
console.log('CommandCenter mounted:', document.querySelector('[data-command-center]'));

// Teste a biblioteca:
try {
  const MicRecorder = require('mic-recorder-to-mp3');
  console.log('MicRecorder loaded:', MicRecorder);
} catch (e) {
  console.error('MicRecorder error:', e);
}
```

### ✅ Solução:
```typescript
// client/src/pages/CommandCenterPage.tsx
import { lazy, Suspense } from 'react';

// Lazy load o componente de voz apenas no client-side
const VoiceRecorder = lazy(() => import('@/components/voice/VoiceRecorder'));

function CommandCenterPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      {typeof window !== 'undefined' && <VoiceRecorder />}
    </Suspense>
  );
}
```

---

## 🛠️ Comandos de Debug Completos

### 1. Debug Local (Simular Produção):
```bash
# Build local
npm run build

# Servir build localmente
npx serve dist/public -p 3000

# Abra: http://localhost:3000
# Verifique console (F12) para erros
```

### 2. Debug Vercel (Logs em Tempo Real):
```bash
# Instale Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs do último deploy
vercel logs --follow

# Ou logs de um deployment específico
vercel logs [deployment-url]
```

### 3. Debug Variáveis de Ambiente:
```bash
# Liste variáveis configuradas
vercel env ls

# Adicione variável faltante
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Verifique no build
vercel build --debug
```

### 4. Debug Console do Navegador (Produção):
```javascript
// Abra F12 > Console na URL de produção

// 1. Verifique variáveis de ambiente
console.log('ENV:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD
});

// 2. Verifique erros de carregamento
console.log('Scripts:', Array.from(document.scripts).map(s => ({
  src: s.src,
  loaded: !s.error
})));

// 3. Verifique React montado
console.log('Root:', document.getElementById('root'));
console.log('React:', window.React);

// 4. Teste Supabase manualmente
import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
  .then(({ createClient }) => {
    const client = createClient(
      'SUA_URL_AQUI',
      'SUA_KEY_AQUI'
    );
    return client.auth.getSession();
  })
  .then(console.log)
  .catch(console.error);
```

### 5. Debug Network (F12 > Network):
```javascript
// Verifique:
// ✅ index.html carregou (200)
// ✅ main.js carregou (200)
// ✅ assets/*.js carregaram (200)
// ❌ Algum 404 ou 500?
// ❌ CORS errors?

// Filtre por "Fetch/XHR" para ver chamadas API
// Procure por erros 401 (não autenticado) ou 403 (sem permissão)
```

---

## 📋 Checklist de Verificação

### Antes de Debugar:
- [ ] Aplicação funciona em `localhost`?
- [ ] Build local funciona (`npm run build` + `npx serve dist/public`)?
- [ ] Variáveis de ambiente estão no `.env.example`?

### Durante o Debug:
- [ ] Console do navegador mostra erros? (F12)
- [ ] Network tab mostra 404/500? (F12 > Network)
- [ ] Logs da Vercel mostram erros de build?
- [ ] Variáveis de ambiente estão configuradas na Vercel?

### Após Correção:
- [ ] Redeploy na Vercel
- [ ] Limpar cache do navegador (Ctrl+Shift+R)
- [ ] Testar em modo anônimo
- [ ] Testar em dispositivo mobile

---

## 🚀 Ordem de Investigação Recomendada

1. **PRIMEIRO**: Verifique variáveis de ambiente (Causa #1) - 80% dos casos
2. **SEGUNDO**: Verifique console do navegador para erros de hidratação (Causa #2)
3. **TERCEIRO**: Verifique logs de build para erros de bibliotecas (Causa #3)

---

## 📞 Próximos Passos

Execute os comandos acima e me envie:
1. Screenshot do console do navegador (F12)
2. Logs de build da Vercel
3. Lista de variáveis de ambiente configuradas (sem expor valores sensíveis)

Com essas informações, posso identificar a causa exata e fornecer a solução específica.
