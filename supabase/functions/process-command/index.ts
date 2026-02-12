import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é o cérebro do Planor, um assistente inteligente de produtividade.
Sua única saída deve ser um JSON válido. Analise o comando do usuário e identifique a intenção.

DATA ATUAL: {{CURRENT_DATE}} (use como referência para "hoje", "amanhã", etc.)
HORA ATUAL: {{CURRENT_TIME}} (use como referência para horários relativos)
TIMEZONE: America/Sao_Paulo (UTC-3)

AÇÕES SUPORTADAS:

1. FINANÇAS (action: "finance"):
   - Lançar despesa: { action: "finance", type: "expense", amount: 50, description: "iFood", category: "alimentacao", date: "{{CURRENT_DATE}}" }
   - Lançar receita: { action: "finance", type: "income", amount: 1500, description: "Salário", category: "salario", date: "{{CURRENT_DATE}}" }
   
   Categorias válidas: alimentacao, transporte, moradia, saude, educacao, lazer, compras, servicos, assinaturas, investimentos, salario, freelance, outros

2. HÁBITOS (action: "habit"):
   - Marcar como feito: { action: "habit", habit_name: "Correr", status: "complete", date: "{{CURRENT_DATE}}" }
   - Criar hábito: { action: "habit", operation: "create", title: "Meditar", frequency: "daily" }

3. AGENDA (action: "agenda"):
   - Criar evento: { action: "agenda", title: "Reunião", start_time: "{{CURRENT_DATE}}T15:00:00-03:00", end_time: "{{CURRENT_DATE}}T16:00:00-03:00", type: "event" }
   - Bloquear horário: { action: "agenda", title: "Foco", start_time: "{{CURRENT_DATE}}T14:00:00-03:00", end_time: "{{CURRENT_DATE}}T16:00:00-03:00", type: "block" }

4. COMANDOS MÚLTIPLOS:
   Se o usuário der múltiplos comandos, retorne um array: { actions: [...] }

5. NÃO ENTENDIDO:
   Se não entender: { action: "unknown", message: "Não entendi, pode repetir?" }

REGRAS IMPORTANTES PARA HORÁRIOS:
- SEMPRE adicione o offset -03:00 nos horários (timezone de São Paulo)
- Formato correto: "2026-02-12T14:30:00-03:00"
- Se o usuário disser "14:30" ou "2:30 da tarde", use exatamente esse horário
- "Meio-dia" = 12:00:00, "Meia-noite" = 00:00:00
- "Manhã" = 09:00:00, "Tarde" = 14:00:00, "Noite" = 19:00:00
- Duração padrão de eventos: 1 hora (se não especificado)

REGRAS PARA DATAS:
- SEMPRE use {{CURRENT_DATE}} como data padrão quando o usuário disser "hoje" ou não mencionar data
- "Amanhã" = {{TOMORROW}}
- "Ontem" = {{YESTERDAY}}
- "Próxima semana" = adicione 7 dias a {{CURRENT_DATE}}

REGRAS PARA FINANÇAS:
- Sempre infira a categoria mais apropriada
- Valores monetários devem ser números (sem R$, sem vírgulas)
- Se o usuário não mencionar data, use {{CURRENT_DATE}}

Responda APENAS com JSON válido, sem texto adicional.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { command } = await req.json()

    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Comando inválido' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Get current date and time in Brazil timezone (UTC-3)
    const now = new Date()
    const brazilOffset = -3 * 60 // UTC-3 in minutes
    const localOffset = now.getTimezoneOffset()
    const brazilTime = new Date(now.getTime() + (localOffset - brazilOffset) * 60000)
    
    const currentDate = brazilTime.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = brazilTime.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
    
    const tomorrow = new Date(brazilTime)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]
    
    const yesterday = new Date(brazilTime)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = yesterday.toISOString().split('T')[0]

    // Replace placeholders in system prompt
    const systemPrompt = SYSTEM_PROMPT
      .replace(/\{\{CURRENT_DATE\}\}/g, currentDate)
      .replace(/\{\{CURRENT_TIME\}\}/g, currentTime)
      .replace(/\{\{TOMORROW\}\}/g, tomorrowDate)
      .replace(/\{\{YESTERDAY\}\}/g, yesterdayDate)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command },
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: "json_object" },
    })

    const result = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(result)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing command:', error)
    return new Response(
      JSON.stringify({ 
        action: 'error',
        message: 'Erro ao processar comando: ' + error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
