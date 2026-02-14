import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um nutricionista digital especializado em alimentação brasileira.
O usuário enviará uma descrição de refeição em linguagem natural.

Sua resposta deve ser EXCLUSIVAMENTE um JSON válido contendo:
{
  "food_name": "nome do alimento/refeição",
  "calories": número inteiro de calorias,
  "protein": gramas de proteína (número),
  "carbs": gramas de carboidratos (número),
  "fat": gramas de gordura (número),
  "serving_size": "descrição da porção"
}

REGRAS IMPORTANTES:
1. Se a quantidade não for especificada, use uma porção média padrão brasileira
2. Para múltiplos alimentos, some os valores nutricionais
3. Use valores realistas baseados em tabelas nutricionais brasileiras (TACO)
4. Arredonde calorias para números inteiros
5. Arredonde macros para 1 casa decimal
6. O food_name deve ser uma descrição concisa do que foi consumido

EXEMPLOS DE PORÇÕES PADRÃO BRASILEIRAS:
- 1 ovo cozido: ~70 kcal, 6g proteína, 0.5g carbs, 5g gordura
- 1 banana média: ~90 kcal, 1g proteína, 23g carbs, 0.3g gordura
- 1 xícara de arroz branco: ~200 kcal, 4g proteína, 45g carbs, 0.4g gordura
- 1 concha de feijão: ~75 kcal, 5g proteína, 14g carbs, 0.5g gordura
- 100g de frango grelhado: ~165 kcal, 31g proteína, 0g carbs, 3.6g gordura
- 1 pão francês: ~140 kcal, 4g proteína, 28g carbs, 1g gordura

Responda APENAS com JSON válido, sem texto adicional.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Descrição do alimento é obrigatória' }), 
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" },
    })

    const result = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(result)

    // Validate and sanitize response
    const sanitized = {
      food_name: parsed.food_name || description,
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Math.round((Number(parsed.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(parsed.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(parsed.fat) || 0) * 10) / 10,
      serving_size: parsed.serving_size || 'porção média',
    }

    return new Response(JSON.stringify(sanitized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error analyzing food:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao analisar alimento: ' + error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
