# 🔧 Correções para Erros de Hidratação - Planor

## Problema: localStorage/window acessados durante SSR

Estas correções eliminam erros de hidratação causados por acesso a APIs do navegador durante o render inicial.

---

## ✅ FIX #1: ThemeProvider (CRÍTICO)

### Arquivo: `client/src/components/theme-provider.tsx`

### Problema Atual (Linha 32):
```typescript
const [theme, setTheme] = useState<Theme>(
  () => (localStorage.getItem(storageKey) as Theme) || defaultTheme // ❌ SSR unsafe
);
```

### Solução:
```typescript
const [theme, setTheme] = useState<Theme>(defaultTheme);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  const stored = localStorage.getItem(storageKey) as Theme;
  if (stored && (stored === 'dark' || stored === 'light' || stored === 'system')) {
    setTheme(stored);
  }
}, [storageKey]);

// Previne flash durante hidratação
if (!mounted) {
  return <>{children}</>;
}
```

### Código Completo Corrigido:
```typescript
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "planor-theme",
  ...props
}: ThemeProviderProps) {
  // ✅ Inicializa com defaultTheme (sem localStorage)
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  // ✅ Carrega do localStorage apenas após montar
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as Theme;
    if (stored && (stored === 'dark' || stored === 'light' || stored === 'system')) {
      setTheme(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let effectiveTheme: "dark" | "light";

    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);
    setResolvedTheme(effectiveTheme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      const newTheme = e.matches ? "dark" : "light";
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    resolvedTheme,
  };

  // ✅ Previne flash durante hidratação
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
```

---

## ✅ FIX #2: App.tsx - Sidebar State (JÁ ESTÁ CORRETO)

### Arquivo: `client/src/App.tsx`

O código atual já está protegido com `typeof window !== "undefined"`:

```typescript
const [isCollapsed, setIsCollapsed] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  }
  return false; // ✅ Fallback seguro
});
```

**Nenhuma alteração necessária.**

---

## ✅ FIX #3: App.tsx - Inline Style com window.innerWidth

### Arquivo: `client/src/App.tsx` (Linha 47)

### Problema Atual:
```typescript
style={{ 
  marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 
    ? (isCollapsed ? 'var(--sidebar-width-collapsed, 72px)' : 'var(--sidebar-width-expanded, 240px)')
    : '0',
}}
```

### Solução: Usar CSS Media Queries
```typescript
// Remover o inline style e usar classes CSS

// No componente:
<main 
  className={`
    flex-1 bg-background transition-all
    ${isCollapsed ? 'md:ml-[72px] lg:ml-[72px]' : 'md:ml-[72px] lg:ml-[240px]'}
  `}
>
```

### Ou manter o inline style mas simplificar:
```typescript
<main 
  className="flex-1 bg-background transition-all"
  style={{ 
    marginLeft: isCollapsed 
      ? 'var(--sidebar-width-collapsed, 72px)' 
      : 'var(--sidebar-width-expanded, 240px)',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }}
>
```

**Recomendação**: Use a segunda opção (mais simples) e deixe o CSS media query do Tailwind lidar com mobile.

---

## ✅ FIX #4: CommandCenterPage - mic-recorder-to-mp3

### Arquivo: `client/src/pages/CommandCenterPage.tsx`

### Problema:
A biblioteca `mic-recorder-to-mp3` acessa `navigator.mediaDevices` que não existe durante SSR.

### Solução: Lazy Load + Client-Side Only

```typescript
import { lazy, Suspense, useEffect, useState } from 'react';

// ✅ Lazy load o componente de voz
const VoiceRecorder = lazy(() => import('@/components/voice/VoiceRecorder'));

function CommandCenterPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1>Command Center</h1>
      
      {/* ✅ Renderiza apenas no client-side */}
      {isClient && (
        <Suspense fallback={<div>Carregando gravador...</div>}>
          <VoiceRecorder />
        </Suspense>
      )}
    </div>
  );
}
```

---

## ✅ FIX #5: Supabase Client - Error Handling

### Arquivo: `client/src/lib/supabase.ts`

### Problema Atual:
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(errorMessage); // ❌ Quebra toda a aplicação
}
```

### Solução: Graceful Degradation
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Validação com fallback
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = import.meta.env.PROD
    ? 'Application configuration error. Please contact support.'
    : 'Supabase credentials missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\nCheck SETUP_SUPABASE.md for instructions.';
  
  console.error('[Supabase] Missing environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE
  });
  
  // ✅ Em produção, mostra erro na UI ao invés de quebrar
  if (import.meta.env.PROD) {
    // Cria um cliente "dummy" que sempre retorna erro
    const dummyClient = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: new Error(errorMessage) }),
        getUser: async () => ({ data: { user: null }, error: new Error(errorMessage) }),
        signIn: async () => ({ data: null, error: new Error(errorMessage) }),
        signUp: async () => ({ data: null, error: new Error(errorMessage) }),
        signOut: async () => ({ error: new Error(errorMessage) }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any;
    
    export const supabase = dummyClient;
  } else {
    throw new Error(errorMessage);
  }
} else {
  export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
```

---

## 📋 Checklist de Aplicação

Aplique as correções nesta ordem:

- [ ] **FIX #1**: ThemeProvider (MAIS IMPORTANTE)
- [ ] **FIX #5**: Supabase Client Error Handling
- [ ] **FIX #3**: App.tsx inline style (opcional)
- [ ] **FIX #4**: CommandCenterPage lazy load (se usar gravação de voz)

---

## 🧪 Como Testar

Após aplicar as correções:

```bash
# 1. Build local
npm run build

# 2. Servir localmente
npx serve dist/public -p 3000

# 3. Testar no navegador
# - Abra http://localhost:3000
# - Abra F12 > Console
# - Procure por "Hydration" errors
# - Deve estar limpo!

# 4. Testar com localStorage vazio
localStorage.clear();
location.reload();

# 5. Deploy
vercel --prod
```

---

## 🎯 Resultado Esperado

Após aplicar todas as correções:

✅ Sem erros de hidratação no console  
✅ Sem "localStorage is not defined"  
✅ Sem "window is not defined"  
✅ Aplicação carrega corretamente em produção  
✅ Tema persiste entre reloads  
✅ Sidebar state persiste  

---

## 📞 Próximos Passos

1. Aplique o **FIX #1** (ThemeProvider) primeiro
2. Teste localmente com `npm run build` + `npx serve`
3. Se funcionar, aplique os outros fixes
4. Deploy na Vercel
5. Teste em produção com o script `debug-production.js`
