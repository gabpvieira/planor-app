// ============================================
// PLANOR SERVICE WORKER
// Versão: 1.0.0
// Foco: Segurança para aplicação financeira
// ============================================

const CACHE_VERSION = 'planor-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Assets que devem ser cacheados (apenas estáticos)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Padrões que NUNCA devem ser cacheados (segurança)
const NO_CACHE_PATTERNS = [
  /\/api\//,           // Todas as rotas de API
  /\/auth\//,          // Rotas de autenticação
  /supabase/,          // Requests do Supabase
  /\.supabase\./,      // Domínios Supabase
  /token/i,            // Qualquer coisa com token
  /session/i,          // Sessões
  /login/i,            // Login
  /logout/i,           // Logout
  /password/i,         // Senhas
  /credential/i        // Credenciais
];

// ============================================
// INSTALL - Cache inicial dos assets estáticos
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Ativa imediatamente sem esperar
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ============================================
// ACTIVATE - Limpa caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove caches que não são da versão atual
              return cacheName.startsWith('planor-') && cacheName !== STATIC_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Assume controle de todas as páginas imediatamente
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH - Estratégia de cache segura
// ============================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // REGRA 1: Nunca cachear métodos diferentes de GET
  if (request.method !== 'GET') {
    return;
  }

  // REGRA 2: Nunca cachear requests sensíveis
  if (shouldNotCache(url.href)) {
    return;
  }

  // REGRA 3: Nunca cachear requests com credenciais/auth headers
  if (hasAuthHeaders(request)) {
    return;
  }

  // REGRA 4: Apenas cachear requests do mesmo origin ou CDNs confiáveis
  if (!isTrustedOrigin(url)) {
    return;
  }

  // Estratégia: Network First com fallback para cache
  // Garante dados sempre frescos, cache apenas como backup
  event.respondWith(
    networkFirstStrategy(request)
  );
});

// ============================================
// ESTRATÉGIA: Network First
// ============================================
async function networkFirstStrategy(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    // Se sucesso, atualiza o cache (apenas para assets estáticos)
    if (networkResponse.ok && isStaticAsset(request.url)) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Se falhar, tenta o cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não houver cache, retorna erro de rede
    throw error;
  }
}

// ============================================
// HELPERS DE SEGURANÇA
// ============================================

function shouldNotCache(url) {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function hasAuthHeaders(request) {
  // Verifica headers que indicam autenticação
  const authHeaders = ['authorization', 'x-auth-token', 'x-access-token'];
  
  for (const header of authHeaders) {
    if (request.headers.has(header)) {
      return true;
    }
  }
  
  return false;
}

function isTrustedOrigin(url) {
  const trustedOrigins = [
    self.location.origin,
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  return trustedOrigins.some(origin => url.href.startsWith(origin));
}

function isStaticAsset(url) {
  const staticExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    '.json'
  ];
  
  const urlPath = new URL(url).pathname;
  return staticExtensions.some(ext => urlPath.endsWith(ext)) ||
         urlPath === '/' ||
         urlPath === '/manifest.json';
}

// ============================================
// MESSAGE HANDLER - Para atualizações manuais
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

console.log('[SW] Planor Service Worker loaded - Version:', CACHE_VERSION);
