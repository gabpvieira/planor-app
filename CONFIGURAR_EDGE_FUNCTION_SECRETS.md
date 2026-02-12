# 🔐 Configurar Secrets da Edge Function

## ⚠️ Problema Identificado

A Edge Function `transcribe-audio` precisa da chave `OPENAI_API_KEY` configurada como secret no Supabase.

---

## 📋 Secrets Necessários

### 1. OPENAI_API_KEY (OBRIGATÓRIO)
Chave da API da OpenAI para usar o Whisper

**Como obter**:
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave (ou use uma existente)
3. Copie a chave (começa com `sk-...`)

---

## 🔧 Como Configurar via Dashboard

### Passo 1: Acessar o Dashboard do Supabase
```
https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/settings/functions
```

### Passo 2: Adicionar Secret
1. Clique em "Edge Functions" no menu lateral
2. Clique em "Manage secrets"
3. Clique em "Add new secret"
4. Preencha:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (sua chave da OpenAI)
5. Clique em "Save"

### Passo 3: Redeploy a Função
```bash
npx supabase functions deploy transcribe-audio
```

---

## 🔧 Como Configurar via CLI (Alternativa)

### Opção 1: Comando Direto
```bash
# Configurar OPENAI_API_KEY
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Verificar secrets configurados
npx supabase secrets list
```

### Opção 2: Via Arquivo .env
```bash
# 1. Criar arquivo com secrets
echo "OPENAI_API_KEY=sk-your-key-here" > .env.supabase

# 2. Aplicar secrets
npx supabase secrets set --env-file .env.supabase

# 3. Deletar arquivo (segurança)
rm .env.supabase
```

---

## ✅ Verificar Configuração

### 1. Listar Secrets
```bash
npx supabase secrets list
```

Deve mostrar:
```
┌─────────────────┬─────────────────────┐
│ NAME            │ DIGEST              │
├─────────────────┼─────────────────────┤
│ OPENAI_API_KEY  │ sha256:abc123...    │
└─────────────────┴─────────────────────┘
```

### 2. Testar Edge Function
```bash
# Via curl (substitua SEU_TOKEN pelo token de autenticação)
curl -X POST \
  https://qchuggfaogrkyurktwxg.supabase.co/functions/v1/transcribe-audio \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test-audio.webm"
```

### 3. Ver Logs
Acesse o Dashboard:
```
https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/functions/transcribe-audio/logs
```

---

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"
**Causa**: Secret não foi configurado

**Solução**:
1. Configure o secret via Dashboard ou CLI
2. Redeploy a função:
   ```bash
   npx supabase functions deploy transcribe-audio
   ```

### Erro: "Whisper API error: 401"
**Causa**: Chave da OpenAI inválida ou expirada

**Solução**:
1. Verifique a chave em: https://platform.openai.com/api-keys
2. Gere uma nova chave se necessário
3. Atualize o secret:
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-nova-chave
   npx supabase functions deploy transcribe-audio
   ```

### Erro: "Configuração inválida do servidor"
**Causa**: Variáveis de ambiente do Supabase não disponíveis

**Solução**:
- Isso é automático no Supabase
- Se persistir, entre em contato com o suporte

---

## 📊 Variáveis de Ambiente Disponíveis

### Automáticas (fornecidas pelo Supabase):
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_ANON_KEY` - Chave anônima
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço
- `SUPABASE_PROJECT_REF` - Referência do projeto

### Manuais (você precisa configurar):
- `OPENAI_API_KEY` - Chave da OpenAI (OBRIGATÓRIO)

---

## 🔒 Segurança

### ⚠️ NUNCA:
- ❌ Commitar secrets no Git
- ❌ Compartilhar chaves publicamente
- ❌ Usar chaves em código frontend
- ❌ Logar secrets no console

### ✅ SEMPRE:
- ✅ Usar secrets do Supabase
- ✅ Rotacionar chaves periodicamente
- ✅ Usar chaves diferentes para dev/prod
- ✅ Monitorar uso da API

---

## 📝 Comandos Úteis

```bash
# Listar secrets
npx supabase secrets list

# Adicionar secret
npx supabase secrets set NOME=valor

# Remover secret
npx supabase secrets unset NOME

# Deploy após configurar
npx supabase functions deploy transcribe-audio

# Ver logs
# (via Dashboard apenas)
```

---

## 🎯 Checklist de Configuração

- [ ] Obter chave da OpenAI
- [ ] Configurar `OPENAI_API_KEY` no Supabase
- [ ] Verificar secret com `npx supabase secrets list`
- [ ] Redeploy da função
- [ ] Testar transcrição no app
- [ ] Verificar logs no Dashboard

---

## 📞 Links Úteis

- **Dashboard Supabase**: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg
- **Edge Functions**: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/functions
- **Logs**: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/functions/transcribe-audio/logs
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Docs Supabase Secrets**: https://supabase.com/docs/guides/functions/secrets

---

**Próximo Passo**: Configure o `OPENAI_API_KEY` e teste novamente! 🚀
