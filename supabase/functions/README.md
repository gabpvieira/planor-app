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

## Funções Disponíveis

| Função | Descrição |
|--------|-----------|
| `process-statement` | Processa extratos bancários com IA |
| `process-command` | Processa comandos de voz/texto com IA |
| `transcribe-audio` | Transcreve áudio para texto |
| `analyze-food` | Analisa alimentos para nutrição |
| `generate-meal-plan` | Gera planos de refeição |
| `send-push-notification` | Envia notificações push via VAPID |

## Deploy de Todas as Funções

```bash
# Deploy individual
supabase functions deploy process-statement
supabase functions deploy process-command
supabase functions deploy transcribe-audio
supabase functions deploy analyze-food
supabase functions deploy generate-meal-plan
supabase functions deploy send-push-notification

# Ou deploy de todas
supabase functions deploy
```

## Configurar Secrets

### OpenAI (para IA)
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

### VAPID (para Push Notifications)
```bash
supabase secrets set VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
supabase secrets set VAPID_PRIVATE_KEY=your-vapid-private-key
supabase secrets set VAPID_SUBJECT=mailto:your-email@domain.com
```

### Verificar secrets configurados
```bash
supabase secrets list
```

---

## Deploy da Function `send-push-notification`

### 1. Gerar VAPID Keys (se ainda não tiver)

```bash
npx web-push generate-vapid-keys
```

### 2. Configurar secrets

```bash
supabase secrets set VITE_VAPID_PUBLIC_KEY=BEhZJIJKT1GIw8EcfnlLGxTUgaoxJSwMXFi2myMKzU5D-fRSaVbymd-S36CDJsZ_GEEWkIma1CQXeMdlzrRrd94
supabase secrets set VAPID_PRIVATE_KEY=vNcNzNZgaSJ5PAL3xNQCmDUMkRzEmVwPI5ErMRMdztQ
supabase secrets set VAPID_SUBJECT=mailto:admin@planor.app
```

### 3. Deploy

```bash
supabase functions deploy send-push-notification
```

### 4. Testar

```bash
curl -i --location --request POST 'https://qchuggfaogrkyurktwxg.supabase.co/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-id-here",
    "notification": {
      "title": "Teste",
      "body": "Notificação de teste"
    }
  }'
```

---

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
supabase functions logs send-push-notification
```

## Atualizar a função

Após fazer alterações no código:
```bash
supabase functions deploy process-statement
supabase functions deploy send-push-notification
```
