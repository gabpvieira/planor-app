# Como Limpar Cache do Navegador - Desktop

O app está funcionando no mobile mas não no desktop devido ao cache antigo. Siga estas instruções:

## Chrome/Edge (Windows)

### Método 1: Hard Reload (Mais Rápido)
1. Abra o site
2. Abra DevTools (F12)
3. Clique com botão DIREITO no ícone de reload (ao lado da barra de endereço)
4. Selecione "Empty Cache and Hard Reload"

### Método 2: Limpar Cache Completo
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "All time" no período
3. Marque:
   - ✅ Cached images and files
   - ✅ Cookies and other site data (opcional, mas recomendado)
4. Clique em "Clear data"
5. Feche TODAS as abas do site
6. Reabra o site

### Método 3: Modo Anônimo (Teste Rápido)
1. Pressione `Ctrl + Shift + N`
2. Acesse o site
3. Se funcionar, o problema é cache

## Firefox (Windows)

### Hard Reload
1. Abra o site
2. Pressione `Ctrl + Shift + R`

### Limpar Cache
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Everything" no período
3. Marque "Cache"
4. Clique em "Clear Now"

## Safari (Mac)

### Hard Reload
1. Abra o site
2. Pressione `Cmd + Option + R`

### Limpar Cache
1. Safari > Preferences > Advanced
2. Marque "Show Develop menu"
3. Develop > Empty Caches
4. Ou pressione `Cmd + Option + E`

## Verificar se Funcionou

Após limpar o cache:
1. Feche TODAS as abas do site
2. Feche o navegador completamente
3. Reabra o navegador
4. Acesse o site novamente

## Se Ainda Não Funcionar

### Verificar Service Worker
1. Abra DevTools (F12)
2. Vá em Application > Service Workers
3. Clique em "Unregister" em todos os service workers
4. Recarregue a página

### Verificar Console
1. Abra DevTools (F12)
2. Vá na aba Console
3. Procure por erros em vermelho
4. Tire um print e envie se houver erros

### Última Opção: Limpar Dados do Site
Chrome/Edge:
1. Clique no ícone de cadeado/informação na barra de endereço
2. Clique em "Site settings"
3. Role até o final
4. Clique em "Clear data"
5. Confirme

## URLs para Testar

Teste estas URLs diretamente:
- https://planorapp.vercel.app/
- https://planorapp.vercel.app/dashboard
- https://planorapp.vercel.app/finance

Se uma funcionar e outra não, o problema é de roteamento.

## Informações Técnicas

O problema era:
- ❌ Vercel estava servindo HTML ao invés de JS (MIME type incorreto)
- ✅ Corrigido com headers explícitos de Content-Type
- ✅ Mobile funcionando (sem cache antigo)
- ⏳ Desktop precisa limpar cache

## Atalhos Rápidos

| Navegador | Hard Reload | Limpar Cache |
|-----------|-------------|--------------|
| Chrome/Edge (Win) | Ctrl+Shift+R | Ctrl+Shift+Delete |
| Firefox (Win) | Ctrl+Shift+R | Ctrl+Shift+Delete |
| Safari (Mac) | Cmd+Option+R | Cmd+Option+E |
| Chrome (Mac) | Cmd+Shift+R | Cmd+Shift+Delete |


---

## Erro de Refresh Token (AuthApiError: Invalid Refresh Token)

Se você está vendo o erro "Invalid Refresh Token: Refresh Token Not Found" no console:

### Solução Automática
A aplicação agora detecta automaticamente tokens inválidos e limpa a sessão. Basta recarregar a página.

### Solução Manual (se o erro persistir)

1. Abra DevTools (F12)
2. Vá em Application > Local Storage
3. Selecione o domínio do site
4. Delete todas as chaves que começam com `sb-` (são dados do Supabase)
5. Recarregue a página

### Via Console (Método Rápido)
1. Abra DevTools (F12)
2. Vá na aba Console
3. Cole e execute:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('sb-') || k.includes('supabase')).forEach(k => localStorage.removeItem(k));
location.reload();
```

### Por que isso acontece?
- O token de refresh expirou ou foi invalidado no servidor
- O navegador ainda tem o token antigo em cache
- A aplicação tenta usar o token inválido e recebe erro 400

### Prevenção
- A aplicação agora trata esse erro automaticamente
- Tokens inválidos são detectados e a sessão é limpa
- O usuário é redirecionado para a tela de login
