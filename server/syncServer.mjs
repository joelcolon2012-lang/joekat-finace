// ====================================================================
// JOEKAT FINACE - SERVIDOR DE SINCRONIZACIÓN EN TIEMPO REAL
// Permite sincronización instantánea vía SSE/WebSockets entre Joel y Kat
// ====================================================================
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = '0.0.0.0';

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'joekat_sync_db.json');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cuentas Iniciales Limpias (Comienzan en RD$ 0.00)
const DEFAULT_ACCOUNTS = [
  { id: 'acc-1', household_id: 'hh-joel-kat-01', name: 'Cuenta Conjunta', type: 'conjunta', balance: 0.0, color: '#001D39', icon: 'people-outline', is_active: true },
  { id: 'acc-2', household_id: 'hh-joel-kat-01', name: 'Cuenta Joel', type: 'joel', balance: 0.0, color: '#0A4174', icon: 'person-outline', is_active: true },
  { id: 'acc-3', household_id: 'hh-joel-kat-01', name: 'Cuenta Kath', type: 'kath', balance: 0.0, color: '#8E3A62', icon: 'person-outline', is_active: true },
  { id: 'acc-4', household_id: 'hh-joel-kat-01', name: 'Efectivo', type: 'efectivo', balance: 0.0, color: '#4E8EA2', icon: 'cash-outline', is_active: true },
];

// Gastos Fijos Iniciales Vacíos
const DEFAULT_FIXED = [];

// Presupuestos Iniciales Vacíos
const DEFAULT_BUDGETS = [];

// Metas Iniciales Vacías
const DEFAULT_GOALS = [];

// Transacciones Iniciales Vacías (Balance $0.00)
const DEFAULT_TRANSACTIONS = [];

let masterState = {
  transactions: DEFAULT_TRANSACTIONS,
  accounts: DEFAULT_ACCOUNTS,
  fixedExpenses: DEFAULT_FIXED,
  budgets: DEFAULT_BUDGETS,
  savingGoals: DEFAULT_GOALS,
  monthlySnapshots: [],
  lastUpdated: new Date().toISOString(),
};

// Cargar estado inicial desde disco
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8').replace(/^\uFEFF/, '');
    masterState = JSON.parse(raw);
    console.log(`[JOEKAT-SYNC] Base de datos compartida cargada con éxito.`);
  } catch (err) {
    console.error('[JOEKAT-SYNC] Error leyendo base de datos:', err);
  }
} else {
  saveMasterStateToDisk();
}

function saveMasterStateToDisk() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(masterState, null, 2), 'utf8');
  } catch (err) {
    console.error('[JOEKAT-SYNC] Error guardando estado a disco:', err);
  }
}

// Clientes SSE activos (iPhone Joel, iPhone Kat, Web)
const sseClients = new Set();

function broadcastEvent(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Heartbeat cada 15 segundos para mantener conexiones móviles de iPhone siempre activas
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // CORS Headers universales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // 1. Healthcheck
  if (pathname === '/healthz' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // 2. SSE Endpoint en tiempo real: /api/sync/events
  if (pathname === '/api/sync/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    sseClients.add(res);
    console.log(`[JOEKAT-SYNC] Conexión en tiempo real abierta. Conectados: ${sseClients.size}`);

    // Enviar evento de conexión y estado actual inmediatamente
    // Padding de 2KB para forzar a proxies y Cloudflare a volcar el buffer SSE al instante
    res.write(`: ${'x'.repeat(2048)}\n\n`);
    res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientCount: sseClients.size, lastUpdated: masterState.lastUpdated })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
      console.log(`[JOEKAT-SYNC] Conexión cerrada. Restantes: ${sseClients.size}`);
    });
    return;
  }

  // 3. Estado completo: /api/sync/state
  if (pathname === '/api/sync/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(masterState));
    return;
  }

  // 3b. Detección rápida de cambios: /api/sync/changes?since=<ISOString>
  if (pathname === '/api/sync/changes' && req.method === 'GET') {
    const since = reqUrl.searchParams.get('since');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (since && masterState.lastUpdated && new Date(masterState.lastUpdated) <= new Date(since)) {
      res.end(JSON.stringify({ hasChanges: false, lastUpdated: masterState.lastUpdated }));
    } else {
      res.end(JSON.stringify({ hasChanges: true, lastUpdated: masterState.lastUpdated, state: masterState }));
    }
    return;
  }

  // 3c. Descarga de Copia de Seguridad JSON: /api/sync/backup
  if (pathname === '/api/sync/backup' && req.method === 'GET') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `joekat_backup_${timestamp}.json`;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(JSON.stringify(masterState, null, 2));
    return;
  }

  // 3d. Restauración manual de Copia de Seguridad: /api/sync/restore
  if (pathname === '/api/sync/restore' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.transactions)) masterState.transactions = parsed.transactions;
          if (Array.isArray(parsed.accounts)) masterState.accounts = parsed.accounts;
          if (Array.isArray(parsed.fixedExpenses)) masterState.fixedExpenses = parsed.fixedExpenses;
          if (Array.isArray(parsed.budgets)) masterState.budgets = parsed.budgets;
          if (Array.isArray(parsed.savingGoals)) masterState.savingGoals = parsed.savingGoals;
          if (Array.isArray(parsed.monthlySnapshots)) masterState.monthlySnapshots = parsed.monthlySnapshots;
          masterState.lastUpdated = new Date().toISOString();
          saveMasterStateToDisk();
          broadcastEvent('STATE_REPLACED', masterState);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Estado restaurado con éxito', lastUpdated: masterState.lastUpdated }));
          return;
        }
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Formato inválido de copia de seguridad' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. Mutación en tiempo real: /api/sync/mutate
  if (pathname === '/api/sync/mutate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { action, entity, data, clientId } = payload;

        masterState.lastUpdated = new Date().toISOString();

        if (entity === 'ALL' && action === 'SET' && data && typeof data === 'object') {
          // Reemplazo o auto-recuperación completa desde iPhone
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            masterState.transactions = data.transactions;
          }
          if (Array.isArray(data.accounts) && data.accounts.length > 0) {
            masterState.accounts = data.accounts;
          }
          if (Array.isArray(data.fixedExpenses)) {
            masterState.fixedExpenses = data.fixedExpenses;
          }
          if (Array.isArray(data.budgets)) {
            masterState.budgets = data.budgets;
          }
          if (Array.isArray(data.savingGoals) && data.savingGoals.length > 0) {
            masterState.savingGoals = data.savingGoals;
          }
          if (Array.isArray(data.monthlySnapshots)) {
            masterState.monthlySnapshots = data.monthlySnapshots;
          }
          saveMasterStateToDisk();
          broadcastEvent('STATE_REPLACED', masterState);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, lastUpdated: masterState.lastUpdated, timestamp: Date.now() }));
          return;
        }

        if (masterState[entity]) {
          const list = masterState[entity];

          if (action === 'ADD' || action === 'PUT' || action === 'UPDATE') {
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
              if (item && item.id) {
                const idx = list.findIndex((x) => x.id === item.id);
                if (idx >= 0) {
                  list[idx] = { ...list[idx], ...item };
                } else {
                  list.unshift(item); // Al inicio para que se vea primero
                }
              }
            }
          } else if (action === 'DELETE') {
            const idToDelete = typeof data === 'string' ? data : data?.id;
            if (idToDelete) {
              masterState[entity] = list.filter((x) => x.id !== idToDelete);
            }
          } else if (action === 'SET') {
            masterState[entity] = data;
          }
        }

        saveMasterStateToDisk();

        // Difundir inmediatamente a todos los iPhones y dispositivos conectados
        broadcastEvent('MUTATION', {
          action,
          entity,
          data,
          clientId,
          lastUpdated: masterState.lastUpdated,
          timestamp: Date.now(),
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lastUpdated: masterState.lastUpdated, timestamp: Date.now() }));
      } catch (err) {
        console.error('[JOEKAT-SYNC] Error procesando mutación:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Servir archivos estáticos de la aplicación móvil (Vite / Expo Web dist)
  let filePath = path.join(DIST_DIR, pathname);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('JOEKAT FINACE: No se encontró la carpeta dist.');
  }
});

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(`[JOEKAT FINACE] Servidor en Tiempo Real Activo en puerto ${PORT}`);
  console.log(`➜ Sincronización SSE y WebSockets para Joel y Kat habilitada`);
  console.log('================================================================');
});
