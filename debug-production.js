/**
 * Script de Debug para Produção - Planor
 * Execute no console do navegador (F12) na URL de produção
 */

console.log('🔍 Iniciando diagnóstico Planor...\n');

// 1. Verificar Variáveis de Ambiente
console.log('📋 1. VARIÁVEIS DE AMBIENTE:');
const envCheck = {
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || 'AUSENTE',
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY ? 'PRESENTE' : 'AUSENTE',
  MODE: import.meta.env?.MODE || 'unknown',
  PROD: import.meta.env?.PROD || false,
  DEV: import.meta.env?.DEV || false,
};
console.table(envCheck);

if (!import.meta.env?.VITE_SUPABASE_URL || !import.meta.env?.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente ausentes!');
  console.log('Solução: Configure no Vercel Dashboard:');
  console.log('  VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=sua-chave-anon');
}

// 2. Verificar DOM
console.log('\n📋 2. ESTRUTURA DOM:');
const domCheck = {
  'Root Element': !!document.getElementById('root'),
  'Root Has Children': document.getElementById('root')?.children.length || 0,
  'Body Classes': document.body.className || 'none',
  'HTML Classes': document.documentElement.className || 'none',
};
console.table(domCheck);

// 3. Verificar Scripts Carregados
console.log('\n📋 3. SCRIPTS CARREGADOS:');
const scripts = Array.from(document.scripts).map(s => ({
  src: s.src.split('/').pop() || 'inline',
  loaded: !s.error,
  type: s.type || 'text/javascript'
}));
console.table(scripts);

// 4. Verificar Erros de Console
console.log('\n📋 4. ERROS CAPTURADOS:');
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

// 5. Verificar LocalStorage
console.log('\n📋 5. LOCALSTORAGE:');
try {
  const storageKeys = Object.keys(localStorage);
  console.log('Keys:', storageKeys);
  console.table(
    storageKeys.reduce((acc, key) => {
      acc[key] = localStorage.getItem(key)?.substring(0, 50) + '...';
      return acc;
    }, {})
  );
} catch (e) {
  console.error('❌ Erro ao acessar localStorage:', e);
}

// 6. Verificar Network Requests
console.log('\n📋 6. NETWORK (últimos 10s):');
console.log('Abra F12 > Network para ver requisições em tempo real');
console.log('Procure por:');
console.log('  - 404 (Not Found)');
console.log('  - 500 (Server Error)');
console.log('  - CORS errors');
console.log('  - Failed requests');

// 7. Testar Supabase Connection
console.log('\n📋 7. TESTE SUPABASE:');
if (import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
  console.log('Testando conexão...');
  
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(({ createClient }) => {
      const testClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      return testClient.auth.getSession();
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Erro Supabase:', error);
      } else {
        console.log('✅ Supabase conectado:', data);
      }
    })
    .catch(err => {
      console.error('❌ Erro ao testar Supabase:', err);
    });
} else {
  console.error('❌ Não é possível testar: variáveis ausentes');
}

// 8. Verificar Service Worker
console.log('\n📋 8. SERVICE WORKER:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Registrations:', registrations.length);
    registrations.forEach((reg, i) => {
      console.log(`SW ${i + 1}:`, {
        scope: reg.scope,
        state: reg.active?.state,
        updateViaCache: reg.updateViaCache
      });
    });
  });
} else {
  console.log('Service Worker não suportado');
}

// 9. Resumo Final
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DO DIAGNÓSTICO');
  console.log('='.repeat(50));
  
  const issues = [];
  
  if (!import.meta.env?.VITE_SUPABASE_URL) {
    issues.push('❌ VITE_SUPABASE_URL ausente');
  }
  if (!import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    issues.push('❌ VITE_SUPABASE_ANON_KEY ausente');
  }
  if (!document.getElementById('root')?.children.length) {
    issues.push('❌ React não renderizou (root vazio)');
  }
  if (errors.length > 0) {
    issues.push(`❌ ${errors.length} erro(s) no console`);
  }
  
  if (issues.length === 0) {
    console.log('✅ Nenhum problema detectado!');
    console.log('Se ainda vê tela branca, limpe o cache (Ctrl+Shift+R)');
  } else {
    console.log('🔴 PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log('  ' + issue));
    console.log('\n📖 Consulte DIAGNOSTICO_TELA_BRANCA.md para soluções');
  }
  
  console.log('='.repeat(50));
}, 2000);

console.log('\n⏳ Aguarde 2 segundos para o resumo final...');
