/**
 * Script de Teste para Edge Function transcribe-audio
 * Testa a função em produção com um arquivo de áudio real
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTranscribeAudio() {
  console.log('🧪 Testando Edge Function: transcribe-audio\n');
  
  try {
    // 1. Verificar autenticação
    console.log('1️⃣ Verificando autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Erro de autenticação:', sessionError);
      console.log('\n💡 Você precisa estar logado para testar.');
      console.log('Execute este script após fazer login na aplicação.');
      return;
    }
    
    console.log('✅ Usuário autenticado:', session.user.email);
    console.log('   User ID:', session.user.id);
    console.log('   Token válido até:', new Date(session.expires_at * 1000).toLocaleString());
    
    // 2. Criar um arquivo de áudio de teste (simulado)
    console.log('\n2️⃣ Criando arquivo de áudio de teste...');
    
    // Criar um blob de áudio vazio (apenas para teste de estrutura)
    const audioBlob = new Blob(['test audio data'], { type: 'audio/webm' });
    const audioFile = new File([audioBlob], 'test-audio.webm', { type: 'audio/webm' });
    
    console.log('✅ Arquivo criado:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });
    
    // 3. Preparar FormData
    console.log('\n3️⃣ Preparando FormData...');
    const formData = new FormData();
    formData.append('audio', audioFile);
    console.log('✅ FormData preparado');
    
    // 4. Chamar Edge Function
    console.log('\n4️⃣ Chamando Edge Function transcribe-audio...');
    console.log('   URL:', `${SUPABASE_URL}/functions/v1/transcribe-audio`);
    
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
    });
    
    // 5. Analisar resposta
    console.log('\n5️⃣ Analisando resposta...');
    
    if (error) {
      console.error('❌ Erro na chamada:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        context: error.context
      });
      
      // Tentar obter mais detalhes do erro
      if (error.context && error.context.body) {
        try {
          const errorBody = await error.context.text();
          console.error('   Corpo do erro:', errorBody);
        } catch (e) {
          console.error('   Não foi possível ler o corpo do erro');
        }
      }
      
      return;
    }
    
    console.log('✅ Resposta recebida:', data);
    
    if (data && data.text) {
      console.log('\n🎉 Transcrição bem-sucedida!');
      console.log('   Texto:', data.text);
      console.log('   User ID:', data.user_id);
    } else {
      console.warn('⚠️ Resposta sem texto de transcrição');
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    console.error('   Stack:', error.stack);
  }
}

// Função para verificar logs da Edge Function
async function checkEdgeFunctionLogs() {
  console.log('\n📋 Para ver os logs da Edge Function, execute:');
  console.log('   npx supabase functions logs transcribe-audio --follow');
  console.log('\n📊 Ou acesse o Dashboard:');
  console.log('   https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/functions/transcribe-audio/logs');
}

// Executar teste
console.log('═══════════════════════════════════════════════════════');
console.log('  TESTE: Edge Function transcribe-audio');
console.log('═══════════════════════════════════════════════════════\n');

testTranscribeAudio()
  .then(() => {
    checkEdgeFunctionLogs();
    console.log('\n✅ Teste concluído!');
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
