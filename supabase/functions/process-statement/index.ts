import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"
import { decode } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um assistente financeiro especializado em extratos bancários brasileiros.
Analise o texto do extrato bancário e extraia TODAS as transações encontradas.

REGRAS IMPORTANTES:
1. Limpe e melhore as descrições:
   - "PGTO IFOOD *PEDIDO" -> "iFood"
   - "PIX RECEBIDO JOAO SILVA" -> "Recebimento Pix - João Silva"
   - Capitalize nomes próprios corretamente
   - Remova códigos bancários (DOC, TED, PIX códigos, números de referência)

2. Valores e tipos:
   - Para DESPESAS (expense): amount deve ser NEGATIVO (ex: -54.90)
   - Para RECEITAS (income): amount deve ser POSITIVO (ex: 150.00)
   - Identifique débitos/saídas como "expense"
   - Identifique créditos/entradas como "income"

3. Categorias (use exatamente estes nomes):
   - alimentacao, transporte, moradia, saude, educacao, lazer
   - compras, servicos, assinaturas, investimentos
   - salario, freelance, outros

4. Datas no formato YYYY-MM-DD

Responda APENAS com JSON válido no formato:
{
  "transactions": [
    {
      "date": "2026-02-10",
      "description": "iFood",
      "amount": -54.90,
      "category": "alimentacao",
      "type": "expense"
    },
    {
      "date": "2026-02-11",
      "description": "Recebimento Pix - João Silva",
      "amount": 150.00,
      "category": "outros",
      "type": "income"
    }
  ]
}`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client to verify the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { text, imageBase64, mimeType, pdfBase64 } = await req.json()

    if (!text && !imageBase64 && !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Nenhum texto, imagem ou PDF fornecido.' }), 
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

    let result: string

    // Process PDF with GPT-4 Vision (PDFs can be sent as base64)
    if (pdfBase64) {
      const imageResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia todas as transações deste PDF de extrato bancário:" },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:application/pdf;base64,${pdfBase64}` 
                } 
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      })

      const content = imageResponse.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? jsonMatch[0] : '{}'
    }
    // Process image with GPT-4 Vision
    else if (imageBase64) {
      const imageResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia todas as transações desta imagem de extrato bancário:" },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:${mimeType || 'image/png'};base64,${imageBase64}` 
                } 
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      })

      const content = imageResponse.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? jsonMatch[0] : '{}'
    } 
    // Process text with GPT-4o-mini
    else {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extraia as transações deste extrato bancário:\n\n${text.slice(0, 15000)}` },
        ],
        max_tokens: 4096,
        temperature: 0.1,
        response_format: { type: "json_object" },
      })

      result = response.choices[0]?.message?.content || '{}'
    }

    return new Response(result, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing statement:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar extrato' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
