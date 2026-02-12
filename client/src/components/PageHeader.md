# PageHeader Component

Componente reutilizável para headers de páginas que garante espaçamento adequado no mobile para não sobrepor com o menu hamburguer.

## Características

- **Padding automático no mobile**: Adiciona `pt-16` no mobile para evitar sobreposição com o botão hamburguer
- **Layout responsivo**: Adapta-se automaticamente entre mobile e desktop
- **Suporte a ações**: Permite adicionar botões ou outros elementos no header
- **Título e descrição**: Suporta título principal e descrição opcional

## Uso Básico

```tsx
import { PageHeader } from '@/components/PageHeader';

function MyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Minha Página"
        description="Descrição da página"
      />
      {/* Conteúdo da página */}
    </div>
  );
}
```

## Com Ações

```tsx
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function MyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Minha Página"
        description="Descrição da página"
        actions={
          <Button>
            <Plus className="size-4 mr-2" />
            Novo Item
          </Button>
        }
      />
      {/* Conteúdo da página */}
    </div>
  );
}
```

## Com Múltiplas Ações

```tsx
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

function MyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Minha Página"
        description="Descrição da página"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="size-4 mr-2" />
              Importar
            </Button>
            <Button>
              <Plus className="size-4 mr-2" />
              Novo
            </Button>
          </div>
        }
      />
      {/* Conteúdo da página */}
    </div>
  );
}
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `title` | `string` | Sim | Título principal da página |
| `description` | `string` | Não | Descrição ou subtítulo da página |
| `actions` | `ReactNode` | Não | Botões ou outros elementos de ação |
| `className` | `string` | Não | Classes CSS adicionais |

## Espaçamento Mobile

O componente adiciona automaticamente:
- `pt-16` no mobile (< 768px) para evitar sobreposição com o menu hamburguer
- `pt-0` no desktop (≥ 768px) para layout normal

## Exemplos de Páginas

### Dashboard
```tsx
<PageHeader
  title={`${greeting()}, ${userName}.`}
  description={`${formattedDate} — Veja o que está acontecendo hoje.`}
  actions={
    <div className="flex gap-2">
      <Button>Nova Tarefa</Button>
      <Button variant="outline">Importar</Button>
    </div>
  }
/>
```

### Finanças
```tsx
<PageHeader
  title="Finanças"
  description="Central de controle patrimonial"
  actions={
    <div className="flex gap-2">
      <Button variant="ghost" size="icon">
        <Eye className="size-4" />
      </Button>
      <Button variant="outline">Transferir</Button>
    </div>
  }
/>
```

### Tarefas
```tsx
<PageHeader
  title="Tarefas"
  description="Gerencie suas tarefas e projetos"
  actions={
    <Button>
      <Plus className="size-4 mr-2" />
      Nova Tarefa
    </Button>
  }
/>
```
