# Planor - Sistema Completo de Organização Pessoal

Sistema unificado para gerenciar tarefas, agenda, hábitos, metas, finanças, treinos, nutrição e conhecimento.

## 🚀 Setup de Desenvolvimento

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Certifique-se de que o PostgreSQL está rodando e configure o `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/planor
NODE_ENV=development
PORT=5000
SESSION_SECRET=dev-secret-key-change-in-production
```

### 3. Criar Tabelas no Banco

```bash
npm run db:push
```

### 4. Criar Usuário de Desenvolvimento

```bash
npm run db:seed
```

Isso criará o usuário padrão:
- **Email:** `dev@teste.com`
- **Senha:** `123456`

### 5. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:5000`

## 📋 Estrutura de Rotas

### Rotas Públicas
- `/` - Landing Page
- `/login` - Página de Login

### Rotas Protegidas (requer autenticação)
- `/app` - Dashboard
- `/app/tasks` - Tarefas
- `/app/notes` - Notas
- `/app/agenda` - Agenda/Calendário
- `/app/workouts` - Treinos (Em Breve)
- `/app/nutrition` - Nutrição (Em Breve)
- `/app/habits` - Hábitos (Em Breve)
- `/app/goals` - Metas (Em Breve)
- `/app/finance` - Finanças (Em Breve)
- `/app/knowledge` - Conhecimento (Em Breve)

## 🔐 Autenticação

O sistema usa sessões com cookies HTTP-only para autenticação.

### API Endpoints

- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `GET /api/user` - Obter usuário atual
- `POST /api/register` - Registrar novo usuário

### Fluxo de Autenticação

1. Usuário acessa `/login`
2. Submete credenciais via `POST /api/login`
3. Backend valida e cria sessão
4. Frontend redireciona para `/app`
5. Todas as requisições subsequentes incluem cookie de sessão

## 🎨 Design System

O projeto segue o design system definido na Landing Page:
- Paleta de cores consistente
- Tipografia unificada
- Componentes shadcn/ui
- Estética minimalista e premium

## 🛠️ Tecnologias

### Frontend
- React 18
- TypeScript
- Wouter (routing)
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Framer Motion

### Backend
- Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- Express Session

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run check` - Verifica tipos TypeScript
- `npm run db:push` - Sincroniza schema com banco
- `npm run db:seed` - Cria usuário de desenvolvimento

## 🔧 Desenvolvimento

### Adicionar Nova Rota Protegida

1. Criar componente em `client/src/pages/`
2. Adicionar rota em `client/src/App.tsx`
3. Adicionar item no sidebar em `client/src/components/AppSidebar.tsx`

### Adicionar Nova API

1. Definir schema em `shared/schema.ts`
2. Adicionar métodos em `server/storage.ts`
3. Criar rotas em `server/routes.ts`
4. Criar hook customizado em `client/src/hooks/`

## 📝 Notas

- Em desenvolvimento, qualquer senha é aceita para o usuário `dev@teste.com`
- Em produção, implementar hash de senha adequado (bcrypt)
- Sessões são armazenadas em memória (usar Redis em produção)
- Todas as rotas de API requerem autenticação exceto login/register
