import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um nutricionista especializado em criar planos alimentares personalizados para brasileiros.

Crie um plano alimentar de 7 dias baseado no perfil do usuário.

REGRAS:
1. Use alimentos típicos brasileiros e de fácil acesso
2. Respeite a meta calórica diária fornecida
3. Distribua os macronutrientes de forma equilibrada
4. Inclua variedade para evitar monotonia
5. Considere praticidade no preparo

ESTRUTURA DO JSON DE RESPOSTA:
{
  "title": "Título do plano (ex: Plano para Emagrecimento Saudável)",
  "plan": {
    "days": [
      {
        "day": 1,
        "dayName": "Segunda-feira",
        "meals": {
          "breakfast": [
            { "name": "Nome do alimento", "portion": "quantidade", "calories": 200, "protein": 10, "carbs": 25, "fat": 5 }
          ],
          "lunch": [...],
          "dinner": [...],
          "snacks": [...]
        },
        "totals": { "calories": 2000, "protein": 150, "carbs": 200, "fat": 65 }
      }
    ],
    "summary": {
      "avgCalories": 2000,
      "avgProtein": 150,
      "avgCarbs": 200,
      "avgFat": 65
    }
  }
}

ALIMENTOS BRASILEIROS SUGERIDOS:
- Café da manhã: pão francês, tapioca, ovos, frutas (banana, mamão, maçã), iogurte, granola, café com leite
- Almoço: arroz, feijão, frango, carne, peixe, salada, legumes refogados
- Jantar: sopas, omeletes, sanduíches naturais, saladas completas
- Lanches: frutas, castanhas, iogurte, queijo branco, torradas

Responda APENAS com JSON válido.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile } = await req.json()

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

    const goalText = {
      lose: 'perda de peso',
      maintain: 'manutenção de peso',
      gain: 'ganho de massa',
    }[profile.goal] || 'manutenção de peso'

    const userPrompt = `Crie um plano alimentar de 7 dias com as seguintes especificações:
- Meta calórica diária: ${profile.daily_calories_target || 2000} kcal
- Proteína alvo: ${profile.protein_target || 150}g
- Carboidratos alvo: ${profile.carbs_target || 250}g
- Gordura alvo: ${profile.fat_target || 65}g
- Objetivo: ${goalText}
${profile.weight ? `- Peso atual: ${profile.weight}kg` : ''}
${profile.activity_level ? `- Nível de atividade: ${profile.activity_level}` : ''}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    const result = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(result)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating meal plan:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar plano alimentar: ' + error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
