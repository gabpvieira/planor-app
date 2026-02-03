# Setup Supabase - Guia Rápido

## 🚀 Início Rápido (5 minutos)

### Passo 1: Obter Credenciais Supabase

1. Acesse o painel do Supabase:
   ```
   https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/settings/api
   ```

2. Copie a **anon public** key (parece com isso):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Passo 2: Configurar Variáveis de Ambiente

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
VITE_SUPABASE_URL=https://qchuggfaogrkyurktwxg.supabase.co
VITE_SUPABASE_ANON_KEY=cole_sua_chave_aqui
```

### Passo 3: Reiniciar o Servidor

```bash
npm run dev
```

### Passo 4: Testar

Acesse as novas páginas:
- http://localhost:5000/app/habits
- http://localhost:5000/app/workouts
- http://localhost:5000/app/finance
- http://localhost:5000/app/goals

---

## ✅ Verificação

### Teste 1: Cliente Supabase

Abra o console do navegador e execute:

```javascript
import { supabase } from './client/src/lib/supabase';
console.log(supabase);
```

Deve retornar o objeto do cliente Supabase.

### Teste 2: Autenticação

Tente fazer login na aplicação. Se funcionar, a integração está OK.

### Teste 3: Criar Hábito

1. Acesse `/app/habits`
2. Clique em "Novo Hábito"
3. Preencha o formulário
4. Salve

Se aparecer na lista, está funcionando!

---

## 🔧 Troubleshooting

### Erro: "Invalid API key"

**Solução**: Verifique se copiou a chave correta do painel Supabase.

### Erro: "supabase is not defined"

**Solução**: Reinicie o servidor de desenvolvimento (`npm run dev`).

### Erro: "Row Level Security"

**Solução**: Faça login na aplicação antes de tentar acessar dados.

### Erro: "Network Error"

**Solução**: 
1. Verifique se o projeto Supabase está ativo
2. Confirme a URL no `.env`
3. Verifique sua conexão com internet

---

## 📊 Estrutura de Dados

### Usuário de Teste

Para testar, você pode criar um usuário no Supabase:

1. Acesse: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/auth/users
2. Clique em "Add user"
3. Crie um usuário de teste

Ou use a API de registro na aplicação.

---

## 🎯 Próximos Passos Após Setup

### 1. Testar Todas as Páginas

- [ ] Hábitos - Criar, listar, marcar
- [ ] Treinos - Criar com exercícios
- [ ] Finanças - Adicionar receitas/despesas
- [ ] Metas - Criar com objetivos

### 2. Migrar Páginas Existentes

Atualizar para usar hooks Supabase:

**TasksPage.tsx**:
```typescript
// Trocar
import { useTasks } from '@/hooks/use-tasks';
// Por
import { useSupabaseTasks } from '@/hooks/use-supabase-tasks';
```

**NotesPage.tsx**:
```typescript
// Trocar
import { useNotes } from '@/hooks/use-notes';
// Por
import { useSupabaseNotes } from '@/hooks/use-supabase-notes';
```

### 3. Implementar Páginas Faltantes

Criar páginas para:
- Alimentação (meals)
- Conhecimento (knowledge_items)

Use as páginas existentes como referência.

---

## 📚 Recursos Úteis

### Documentação
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Documentação do Projeto](./SUPABASE_INTEGRATION.md)

### Exemplos de Código
- Ver `HabitsPage.tsx` para exemplo completo
- Ver `use-supabase-habits.ts` para padrão de hook
- Ver `habits.service.ts` para padrão de serviço

---

## 🎉 Pronto!

Após seguir estes passos, sua aplicação Planor estará completamente integrada com Supabase e pronta para uso.

**Dúvidas?** Consulte `SUPABASE_INTEGRATION.md` para documentação detalhada.
