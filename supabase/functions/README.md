# Supabase Edge Functions - Planor

## Pré-requisitos

1. Instalar Supabase CLI:
```bash
npm install -g supabase
```

2. Login no Supabase:
```bash
supabase login
```

3. Link com seu projeto:
```bash
supabase link --project-ref qchuggfaogrkyurktwxg
```

## Deploy da Function `process-statement`

### 1. Configurar a variável de ambiente OPENAI_API_KEY

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Deploy da função

```bash
supabase functions deploy process-statement
```

### 3. Verificar o deploy

```bash
supabase functions list
```

## Testar localmente

```bash
# Iniciar Supabase local
supabase start

# Servir a função localmente
supabase functions serve process-statement --env-file .env

# Testar com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-statement' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"text":"10/02 COMPRA IFOOD 54.90"}'
```

## URL da função em produção

```
https://qchuggfaogrkyurktwxg.supabase.co/functions/v1/process-statement
```

## Permissões

A função é pública (não requer autenticação) mas você pode adicionar verificação de auth se necessário.

Para adicionar autenticação, descomente no código:

```typescript
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

## Logs

Ver logs em tempo real:
```bash
supabase functions logs process-statement
```

## Atualizar a função

Após fazer alterações no código:
```bash
supabase functions deploy process-statement
```
