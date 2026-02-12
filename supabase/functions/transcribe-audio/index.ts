import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('[Transcribe] Headers:', Object.fromEntries(req.headers.entries()))
    
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
      
      return new Response(
        JSON.stringify({ 
          error: `Erro na API Whisper: ${whisperResponse.statusText}`,
          details: errorText
        }), 
        {
          status: whisperResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const whisperData = await whisperResponse.json()
    console.log('[Transcribe] Transcription successful:', whisperData.text)

    return new Response(
      JSON.stringify({ 
        text: whisperData.text
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
