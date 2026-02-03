# Deploy do Planor na Vercel

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Projeto Supabase configurado
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## Passo 1: Importar Projeto

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu repositório Git
3. Selecione o repositório do Planor

## Passo 2: Configurar Variáveis de Ambiente

Na tela de configuração do projeto, adicione as seguintes variáveis:

### Variáveis Obrigatórias

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima (pública) | Supabase Dashboard → Settings → API |
| `SESSION_SECRET` | Chave secreta para sessões | Gere uma string aleatória de 32+ caracteres |

### Variáveis Opcionais (Server-side)

| Variável | Descrição | Uso |
|----------|-----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) | Apenas para operações server-side |
| `DATABASE_URL` | URL do PostgreSQL | Se usar DB direto (não recomendado) |

## Passo 3: Configurações de Build

O `vercel.json` já está configurado. Verifique:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Passo 4: Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse a URL gerada

## Ambientes

### Production
- Branch: `main` ou `master`
- Variáveis: Configuradas no dashboard
- URL: `seu-projeto.vercel.app`

### Preview
- Branches: Qualquer outra branch
- Variáveis: Mesmas de production (ou específicas)
- URL: `seu-projeto-branch.vercel.app`

## Integração Supabase via MCP

Se estiver usando MCP Supabase no desenvolvimento:

```bash
# As variáveis são carregadas automaticamente do ambiente Vercel
# Não é necessário configuração adicional
```

## Verificação Pós-Deploy

### Checklist

- [ ] Página inicial carrega corretamente
- [ ] Login/Logout funcionando
- [ ] Dados do Supabase sendo carregados
- [ ] PWA instalável (Chrome/Edge)
- [ ] Console sem erros de CORS

### Testar Variáveis

Abra o console do navegador e verifique:

```javascript
// Deve retornar a URL do Supabase (não undefined)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ Configurado' : '✗ Faltando');
```

## Troubleshooting

### Erro: "Supabase credentials missing"

1. Verifique se as variáveis estão configuradas na Vercel
2. Redeploy o projeto após adicionar variáveis
3. Certifique-se de usar o prefixo `VITE_` para variáveis client-side

### Erro: CORS

1. No Supabase Dashboard → Settings → API
2. Adicione a URL da Vercel em "Additional Redirect URLs"
3. Formato: `https://seu-projeto.vercel.app`

### Build Falha

1. Verifique os logs de build na Vercel
2. Teste localmente com `npm run build`
3. Certifique-se de que todas as dependências estão no `package.json`

## Segurança

⚠️ **IMPORTANTE**:

- Nunca commite o arquivo `.env`
- Use apenas `VITE_` para variáveis públicas
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no client
- Revise as variáveis antes de cada deploy

## Comandos Úteis

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# Ver logs
vercel logs

# Listar variáveis de ambiente
vercel env ls
```
