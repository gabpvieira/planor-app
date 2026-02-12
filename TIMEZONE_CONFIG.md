# Configuração de Timezone - Horário de Brasília (UTC-3)

## Visão Geral

O Planor está configurado para usar o timezone de Brasília (America/Sao_Paulo, UTC-3) em todo o sistema, garantindo consistência entre cliente, servidor e banco de dados.

## Configuração

### 1. Variável de Ambiente

Adicione ao seu arquivo `.env`:

```env
TZ=America/Sao_Paulo
```

### 2. Utilitários de Timezone

O arquivo `shared/utils/timezone.ts` fornece funções para trabalhar com datas no timezone de Brasília:

#### Funções Principais

- `getBrasiliaDate()` - Retorna a data/hora atual em Brasília
- `toBrasiliaDate(date)` - Converte qualquer data para o timezone de Brasília
- `getBrasiliaDateString()` - Retorna a data atual em formato YYYY-MM-DD
- `toBrasiliaISOString(date)` - Formata data para ISO string em Brasília
- `getBrasiliaStartOfDay(date)` - Retorna início do dia (00:00:00)
- `getBrasiliaEndOfDay(date)` - Retorna fim do dia (23:59:59)
- `formatBrasilianDate(date)` - Formata data no padrão brasileiro (dd/mm/yyyy)
- `formatBrasilianDateTime(date)` - Formata data e hora no padrão brasileiro

#### Exemplo de Uso

```typescript
import { getBrasiliaDate, getBrasiliaDateString, formatBrasilianDate } from '@shared/utils/timezone';

// Obter data atual em Brasília
const now = getBrasiliaDate();

// Obter string de data para queries
const today = getBrasiliaDateString(); // "2024-02-11"

// Formatar para exibição
const formatted = formatBrasilianDate(new Date()); // "11/02/2024"
```

## Implementação

### Servidor (Node.js)

O servidor usa as funções de timezone em:

- `server/storage.ts` - Ao atualizar registros com timestamps
- `server/routes.ts` - Ao processar datas de query parameters
- `server/index.ts` - Logs formatados no horário de Brasília

### Cliente (React)

Os serviços do cliente usam as funções de timezone em:

- `client/src/services/tasks.service.ts` - Timestamps de atualização
- `client/src/services/habits.service.ts` - Cálculo de streaks e logs
- `client/src/services/meals.service.ts` - Filtros de data
- `client/src/services/goals.service.ts` - Cálculo de prazos

### Banco de Dados (Supabase/PostgreSQL)

O PostgreSQL armazena timestamps em UTC internamente, mas as conversões são feitas na aplicação usando as funções de timezone.

## Boas Práticas

1. **Sempre use as funções de timezone** ao invés de `new Date()` diretamente
2. **Para timestamps**: Use `getBrasiliaDate()` ou `toBrasiliaISOString()`
3. **Para datas (YYYY-MM-DD)**: Use `getBrasiliaDateString()`
4. **Para exibição**: Use `formatBrasilianDate()` ou `formatBrasilianDateTime()`
5. **Para início/fim do dia**: Use `getBrasiliaStartOfDay()` e `getBrasiliaEndOfDay()`

## Verificação

Para verificar se o timezone está configurado corretamente:

```bash
# No servidor
node -e "console.log(new Date().toString())"
# Deve mostrar GMT-0300 (Brasilia Standard Time)

# Verificar variável de ambiente
echo $TZ
# Deve retornar: America/Sao_Paulo
```

## Horário de Verão

O timezone `America/Sao_Paulo` automaticamente lida com mudanças de horário de verão (quando aplicável), seguindo as regras oficiais do Brasil.

## Troubleshooting

### Problema: Datas aparecem com 1 dia de diferença

**Solução**: Certifique-se de usar `getBrasiliaDate()` ao invés de `new Date()`

### Problema: Horários inconsistentes entre cliente e servidor

**Solução**: Verifique se a variável `TZ=America/Sao_Paulo` está definida no `.env`

### Problema: Logs do servidor em horário errado

**Solução**: Reinicie o servidor após adicionar a variável `TZ` ao `.env`
