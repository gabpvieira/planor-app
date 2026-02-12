import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Transcribe] Starting transcription request...')
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[Transcribe] Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Criar cliente Supabase para verificar o token
    // Usar variáveis de ambiente automáticas do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? `https://${Deno.env.get('SUPABASE_PROJECT_REF')}.supabase.co`
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Transcribe] Missing Supabase credentials')
      return new Response(
        JSON.stringify({ error: 'Configuração inválida do servidor' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verificar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Transcribe] Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Token inválido' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[Transcribe] User authenticated:', user.id)

    // Parse FormData
    const formData = await req.formData()
    const audioFile = formData.get('audio')

    if (!audioFile || !(audioFile instanceof File)) {
      console.error('[Transcribe] No audio file provided')
      return new Response(
        JSON.stringify({ error: 'Arquivo de áudio não fornecido' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[Transcribe] Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    })

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('[Transcribe] OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare FormData for OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'pt')
    whisperFormData.append('response_format', 'json')

    console.log('[Transcribe] Calling Whisper API...')

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: whisperFormData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('[Transcribe] Whisper API error:', {
        status: whisperResponse.status,
        statusText: whisperResponse.statusText,
        error: errorText
      })
      throw new Error(`Whisper API error: ${whisperResponse.statusText}`)
    }

    const whisperData = await whisperResponse.json()
    console.log('[Transcribe] Transcription successful:', whisperData.text)

    return new Response(
      JSON.stringify({ 
        text: whisperData.text,
        user_id: user.id 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[Transcribe] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao transcrever áudio: ' + (error as Error).message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
