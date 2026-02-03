# Integração Supabase - Planor

## ✅ Status da Integração

Integração completa do Supabase com o frontend do Planor, incluindo:
- Cliente Supabase configurado
- Tipos TypeScript gerados
- Serviços para todas as entidades
- Hooks React Query customizados
- Autenticação integrada

---

## 📁 Estrutura Criada

```
client/src/
├── lib/
│   └── supabase.ts                    # Cliente Supabase configurado
├── types/
│   └── database.types.ts              # Tipos TypeScript do banco
├── services/
│   ├── supabase-auth.service.ts       # Autenticação
│   ├── tasks.service.ts               # Tarefas
│   ├── notes.service.ts               # Notas
│   ├── appointments.service.ts        # Agenda
│   ├── workouts.service.ts            # Treinos
│   ├── meals.service.ts               # Alimentação
│   ├── habits.service.ts              # Hábitos
│   ├── goals.service.ts               # Metas
│   ├── finance.service.ts             # Finanças
│   └── knowledge.service.ts           # Conhecimento
└── hooks/
    ├── use-supabase-auth.ts           # Hook de autenticação
    ├── use-supabase-tasks.ts          # Hook de tarefas
    ├── use-supabase-notes.ts          # Hook de notas
    ├── use-supabase-finance.ts        # Hook de finanças
    ├── use-supabase-habits.ts         # Hook de hábitos
    ├── use-supabase-workouts.ts       # Hook de treinos
    └── use-supabase-goals.ts          # Hook de metas
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
VITE_SUPABASE_URL=https://qchuggfaogrkyurktwxg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ IMPORTANTE**: Obtenha a `ANON_KEY` no painel do Supabase:
1. Acesse: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/settings/api
2. Copie a chave "anon public"
3. Cole no arquivo `.env`

### 2. Cliente Supabase

O cliente já está configurado em `client/src/lib/supabase.ts`:

```typescript
import { supabase } from '@/lib/supabase';
```

---

## 🎯 Como Usar

### Autenticação

```typescript
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    signIn, 
    signOut,
    isSigningIn 
  } = useSupabaseAuth();

  const handleLogin = () => {
    signIn({ 
      email: 'user@example.com', 
      password: 'password' 
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={() => signOut()}>Sair</button>
      ) : (
        <button onClick={handleLogin}>Entrar</button>
      )}
    </div>
  );
}
```

### Tarefas (Tasks)

```typescript
import { useSupabaseTasks } from '@/hooks/use-supabase-tasks';

function TasksPage() {
  const { 
    tasks, 
    isLoading, 
    createTask, 
    updateTask, 
    deleteTask,
    toggleComplete 
  } = useSupabaseTasks();

  const handleCreate = () => {
    createTask({
      title: 'Nova tarefa',
      description: 'Descrição',
      priority: 'high',
    });
  };

  const handleToggle = (id: number, completed: boolean) => {
    toggleComplete({ id, completed: !completed });
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <input 
            type="checkbox" 
            checked={task.completed}
            onChange={() => handleToggle(task.id, task.completed)}
          />
          <span>{task.title}</span>
          <button onClick={() => deleteTask(task.id)}>Excluir</button>
        </div>
      ))}
      <button onClick={handleCreate}>Nova Tarefa</button>
    </div>
  );
}
```

### Notas (Notes)

```typescript
import { useSupabaseNotes } from '@/hooks/use-supabase-notes';

function NotesPage() {
  const { 
    notes, 
    isLoading, 
    createNote, 
    updateNote, 
    deleteNote,
    togglePin 
  } = useSupabaseNotes();

  const handleCreate = () => {
    createNote({
      title: 'Nova nota',
      content: 'Conteúdo da nota',
    });
  };

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
          <button onClick={() => togglePin({ 
            id: note.id, 
            isPinned: !note.is_pinned 
          })}>
            {note.is_pinned ? 'Desafixar' : 'Fixar'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Finanças (Finance)

```typescript
import { useSupabaseFinance } from '@/hooks/use-supabase-finance';

function FinancePage() {
  const { 
    transactions, 
    summary, 
    createTransaction 
  } = useSupabaseFinance();

  const handleAddIncome = () => {
    createTransaction({
      type: 'income',
      amount: 1000,
      category: 'Salário',
      description: 'Salário mensal',
      date: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div>
        <h3>Resumo</h3>
        <p>Receitas: R$ {summary?.income}</p>
        <p>Despesas: R$ {summary?.expenses}</p>
        <p>Saldo: R$ {summary?.balance}</p>
      </div>
      
      <button onClick={handleAddIncome}>Adicionar Receita</button>
    </div>
  );
}
```

### Hábitos (Habits)

```typescript
import { useSupabaseHabits } from '@/hooks/use-supabase-habits';

function HabitsPage() {
  const { 
    habits, 
    createHabit, 
    logHabit 
  } = useSupabaseHabits();

  const handleLogToday = (habitId: number) => {
    logHabit({
      habit_id: habitId,
      date: new Date().toISOString().split('T')[0],
      count: 1,
      completed: true,
    });
  };

  return (
    <div>
      {habits.map(habit => (
        <div key={habit.id}>
          <h3>{habit.title}</h3>
          <button onClick={() => handleLogToday(habit.id)}>
            Marcar Hoje
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Treinos (Workouts)

```typescript
import { useSupabaseWorkouts } from '@/hooks/use-supabase-workouts';

function WorkoutsPage() {
  const { 
    workouts, 
    createWorkout, 
    toggleComplete 
  } = useSupabaseWorkouts();

  const handleCreate = () => {
    createWorkout({
      workout: {
        title: 'Treino A',
        description: 'Peito e Tríceps',
        date: new Date().toISOString(),
      },
      exercises: [
        {
          exercise_name: 'Supino Reto',
          sets: 4,
          reps: 12,
          weight: '80kg',
        },
        {
          exercise_name: 'Tríceps Testa',
          sets: 3,
          reps: 15,
          weight: '30kg',
        },
      ],
    });
  };

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>
          <h3>{workout.title}</h3>
          <p>{workout.workout_exercises.length} exercícios</p>
          <button onClick={() => toggleComplete({ 
            id: workout.id, 
            completed: !workout.completed 
          })}>
            {workout.completed ? 'Desmarcar' : 'Concluir'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Metas (Goals)

```typescript
import { useSupabaseGoals } from '@/hooks/use-supabase-goals';

function GoalsPage() {
  const currentYear = new Date().getFullYear();
  const { 
    goals, 
    createGoal, 
    toggleObjective 
  } = useSupabaseGoals(currentYear);

  const handleCreate = () => {
    createGoal({
      goal: {
        title: 'Aprender TypeScript',
        description: 'Dominar TypeScript em 2026',
        year: currentYear,
        status: 'in_progress',
      },
      objectives: [
        { title: 'Completar curso básico' },
        { title: 'Fazer 3 projetos' },
        { title: 'Contribuir em open source' },
      ],
    });
  };

  return (
    <div>
      {goals.map(goal => (
        <div key={goal.id}>
          <h3>{goal.title}</h3>
          <div>
            {goal.goal_objectives.map(obj => (
              <div key={obj.id}>
                <input 
                  type="checkbox"
                  checked={obj.completed}
                  onChange={() => toggleObjective({ 
                    id: obj.id, 
                    completed: !obj.completed 
                  })}
                />
                <span>{obj.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Segurança (RLS)

Todas as tabelas possuem Row Level Security (RLS) habilitado:

- ✅ Usuários só acessam seus próprios dados
- ✅ Políticas de CRUD completas
- ✅ Relacionamentos protegidos (exercises, logs, objectives)
- ✅ Autenticação via Supabase Auth

---

## 📊 Serviços Disponíveis

### Todos os Serviços Implementam:

- `list(userId)` - Listar registros do usuário
- `getById(id)` - Buscar por ID
- `create(data, userId)` - Criar novo registro
- `update(id, data)` - Atualizar registro
- `delete(id)` - Deletar registro

### Serviços Especiais:

**Finance Service**:
- `getSummary()` - Resumo financeiro (receitas, despesas, saldo)

**Habits Service**:
- `logHabit()` - Registrar execução de hábito
- `getLogsByDate()` - Buscar logs por período

**Goals Service**:
- `addObjective()` - Adicionar objetivo a meta
- `toggleObjective()` - Marcar/desmarcar objetivo

**Knowledge Service**:
- `getTopics()` - Listar tópicos únicos

---

## 🎨 Padrões de Código

### 1. Separação de Responsabilidades

```
Componente → Hook → Service → Supabase
```

- **Componentes**: Apenas UI e interação
- **Hooks**: Gerenciamento de estado e cache (React Query)
- **Services**: Lógica de negócio e comunicação com API
- **Supabase**: Camada de dados

### 2. Tratamento de Erros

```typescript
const { error } = useSupabaseTasks();

if (error) {
  return <div>Erro ao carregar tarefas: {error.message}</div>;
}
```

### 3. Estados de Loading

```typescript
const { isLoading, isCreating, isUpdating } = useSupabaseTasks();

if (isLoading) return <Loader />;
```

### 4. Otimistic Updates

React Query automaticamente gerencia cache e refetch após mutações.

---

## 🚀 Próximos Passos

### 1. Obter Credenciais Supabase

Acesse o painel do Supabase e copie:
- URL do projeto (já configurada)
- Anon Key (necessária)

### 2. Atualizar Páginas Existentes

Substituir hooks antigos pelos novos hooks Supabase:

**Antes**:
```typescript
import { useTasks } from '@/hooks/use-tasks';
```

**Depois**:
```typescript
import { useSupabaseTasks } from '@/hooks/use-supabase-tasks';
```

### 3. Criar Páginas Faltantes

Implementar páginas para:
- ✅ Tarefas (já existe)
- ✅ Notas (já existe)
- ✅ Agenda (já existe)
- ⏳ Treinos
- ⏳ Alimentação
- ⏳ Hábitos
- ⏳ Metas
- ⏳ Finanças
- ⏳ Conhecimento

### 4. Migrar Autenticação

Substituir autenticação atual por Supabase Auth:

```typescript
// Substituir use-auth.ts por use-supabase-auth.ts
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
```

---

## 📝 Observações Importantes

### Performance

- React Query gerencia cache automaticamente
- Queries são invalidadas após mutações
- Stale time configurado para 5 minutos

### TypeScript

- Tipos completos gerados do schema Supabase
- Type-safe em toda a aplicação
- Autocomplete em IDE

### Escalabilidade

- Arquitetura modular e extensível
- Fácil adicionar novas entidades
- Padrão consistente em todos os serviços

### Manutenção

- Código organizado por domínio
- Fácil localizar e modificar funcionalidades
- Testes facilitados pela separação de camadas

---

## 🐛 Troubleshooting

### Erro: "Invalid API key"

Verifique se a `VITE_SUPABASE_ANON_KEY` está correta no `.env`

### Erro: "Row Level Security"

Certifique-se de estar autenticado antes de fazer queries

### Erro: "Network Error"

Verifique se a URL do Supabase está correta e o projeto está ativo

---

## ✅ Checklist de Integração

- [x] Cliente Supabase configurado
- [x] Tipos TypeScript gerados
- [x] Serviços criados para todas as entidades
- [x] Hooks React Query implementados
- [x] Autenticação integrada
- [x] RLS configurado no banco
- [ ] Credenciais Supabase adicionadas ao .env
- [ ] Páginas atualizadas para usar novos hooks
- [ ] Testes de integração
- [ ] Deploy configurado

---

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
