# Push Notifications Setup - Planor

Este documento descreve como configurar as notificações push com VAPID no Planor.

## 1. Gerar VAPID Keys

Execute o comando para gerar as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

Você receberá uma saída como:
```
=======================================

Public Key:
BEhZJIJKT1GIw8EcfnlLGxTUgaoxJSwMXFi2myMKzU5D-fRSaVbymd-S36CDJsZ_GEEWkIma1CQXeMdlzrRrd94

Private Key:
vNcNzNZgaSJ5PAL3xNQCmDUMkRzEmVwPI5ErMRMdztQ

=======================================
```

## 2. Configurar Variáveis de Ambiente

### Local (.env)

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# VAPID Keys para Push Notifications
VITE_VAPID_PUBLIC_KEY=BEhZJIJKT1GIw8EcfnlLGxTUgaoxJSwMXFi2myMKzU5D-fRSaVbymd-S36CDJsZ_GEEWkIma1CQXeMdlzrRrd94
VAPID_PRIVATE_KEY=vNcNzNZgaSJ5PAL3xNQCmDUMkRzEmVwPI5ErMRMdztQ
VAPID_SUBJECT=mailto:app@planorapp.vercel.app
```

### Vercel (Produção)

No dashboard da Vercel, adicione as mesmas variáveis em:
**Settings > Environment Variables**

- `VITE_VAPID_PUBLIC_KEY` - Chave pública (exposta ao cliente)
- `VAPID_PRIVATE_KEY` - Chave privada (apenas servidor)
- `VAPID_SUBJECT` - Email de contato (formato mailto:)

### Supabase Edge Functions

Configure os secrets nas Edge Functions:

```bash
supabase secrets set VITE_VAPID_PUBLIC_KEY=sua-chave-publica
supabase secrets set VAPID_PRIVATE_KEY=sua-chave-privada
supabase secrets set VAPID_SUBJECT=mailto:seu-email@dominio.com
```

## 3. Aplicar Migration do Banco de Dados

Execute a migration para criar a tabela de subscriptions:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no SQL Editor do Supabase Dashboard
# Cole o conteúdo de: supabase/migrations/20260213_push_subscriptions.sql
```

## 4. Deploy da Edge Function

Deploy da função de envio de notificações:

```bash
supabase functions deploy send-push-notification
```

## 5. Testar

1. Acesse `/app/settings/notifications` no navegador
2. Clique em "Ativar notificações"
3. Permita as notificações quando solicitado
4. Clique em "Testar notificação"
5. Você deve receber uma notificação de teste

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Supabase DB    │────▶│  Edge Function  │
│   (React)       │     │ push_subscriptions│     │ send-push-notif │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                │
        │                                                │
        ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│ Service Worker  │◀─────────────────────────────│  Push Service   │
│    (sw.js)      │                              │ (FCM/Mozilla)   │
└─────────────────┘                              └─────────────────┘
```

## Arquivos Criados/Modificados

### Frontend
- `client/src/services/push-notifications.service.ts` - Serviço de push
- `client/src/hooks/use-push-notifications.ts` - Hook React
- `client/src/pages/NotificationSettingsPage.tsx` - Página de configurações
- `client/src/pages/SettingsPage.tsx` - Atualizado com novo hook
- `client/public/sw.js` - Service Worker atualizado
- `client/public/manifest.json` - Adicionado gcm_sender_id

### Backend
- `supabase/functions/send-push-notification/index.ts` - Edge Function
- `supabase/migrations/20260213_push_subscriptions.sql` - Migration

### Configuração
- `.env.example` - Variáveis de ambiente documentadas

## Troubleshooting

### Notificações não aparecem
1. Verifique se está usando HTTPS (obrigatório)
2. Confirme que o Service Worker está registrado (DevTools > Application)
3. Verifique permissões do navegador

### Erro "VAPID key not configured"
1. Confirme que `VITE_VAPID_PUBLIC_KEY` está no `.env`
2. Reinicie o servidor de desenvolvimento

### Subscription não salva
1. Verifique se a migration foi aplicada
2. Confirme as políticas RLS no Supabase

### Edge Function falha
1. Verifique os secrets configurados
2. Consulte logs: `supabase functions logs send-push-notification`

## Requisitos

- HTTPS obrigatório (localhost funciona para desenvolvimento)
- Navegadores suportados: Chrome, Firefox, Edge, Safari (iOS 16.4+)
- Service Worker na raiz do projeto
- manifest.json com `gcm_sender_id: "103953800507"`
