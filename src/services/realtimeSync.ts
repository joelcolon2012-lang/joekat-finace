// Servicio de sincronizacion en tiempo real para JOEKAT FINACE
// Sincroniza instantaneamente movimientos entre los telefonos de Joel y Kat via SSE y HTTP

export interface SyncMutationPayload {
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'PUT' | 'SET';
  entity: 'transactions' | 'accounts' | 'fixedExpenses' | 'budgets' | 'savingGoals' | 'monthlySnapshots' | 'ALL';
  data: any;
  clientId: string;
  timestamp?: number;
}

export type SyncStatus = 'connected' | 'connecting' | 'disconnected';

// ID unico por sesion o telefono para evitar procesar los propios cambios optimistas
export const CLIENT_ID =
  'client-' +
  Math.random().toString(36).substring(2, 10) +
  '-' +
  Date.now().toString(36);

// URL permanente en la nube 24/7 (Render) y fallback para túnel o desarrollo
export const CLOUD_SERVER_URL = process.env.EXPO_PUBLIC_SYNC_URL || 'https://joekat-finace.onrender.com';
export const CLOUDFLARE_TUNNEL_URL = 'https://spouse-size-trained-creek.trycloudflare.com';

/**
 * Determina dinamicamente la URL base de sincronizacion
 */
export function getSyncBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
      return origin;
    }
  }
  return CLOUD_SERVER_URL;
}

let eventSource: EventSource | null = null;
let reconnectTimer: any = null;
let pollTimer: any = null;
let isIntentionalDisconnect = false;
let currentStatus: SyncStatus = 'disconnected';
let lastKnownUpdatedTimestamp: string = '';
const statusListeners = new Set<(status: SyncStatus) => void>();

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

function updateStatus(newStatus: SyncStatus) {
  if (currentStatus !== newStatus) {
    currentStatus = newStatus;
    for (const listener of statusListeners) {
      try {
        listener(newStatus);
      } catch {
        // Ignorar
      }
    }
  }
}

/**
 * Obtiene el estado maestro completo del servidor
 */
export async function fetchRemoteSyncState(): Promise<any | null> {
  try {
    const baseUrl = getSyncBaseUrl();
    const res = await fetch(`${baseUrl}/api/sync/state`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data && data.lastUpdated) {
      lastKnownUpdatedTimestamp = data.lastUpdated;
    }
    updateStatus('connected');
    return data;
  } catch (err) {
    console.warn('[JOEKAT-SYNC] Error obteniendo estado remoto:', err);
    return null;
  }
}

/**
 * Difunde una mutacion (gasto, ingreso, cuenta, meta) en tiempo real al servidor
 */
export async function broadcastMutation(
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'PUT' | 'SET',
  entity: 'transactions' | 'accounts' | 'fixedExpenses' | 'budgets' | 'savingGoals' | 'monthlySnapshots',
  data: any
): Promise<boolean> {
  try {
    const baseUrl = getSyncBaseUrl();
    const payload: SyncMutationPayload = {
      action,
      entity,
      data,
      clientId: CLIENT_ID,
    };

    const res = await fetch(`${baseUrl}/api/sync/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const respData = await res.json().catch(() => ({}));
      lastKnownUpdatedTimestamp = respData.lastUpdated || new Date().toISOString();
      updateStatus('connected');
    }

    return res.ok;
  } catch (err) {
    console.warn('[JOEKAT-SYNC] Error enviando mutacion en tiempo real:', err);
    return false;
  }
}

/**
 * Consulta de cambios delta ultrarrapida
 */
async function pollForChanges(onMutationReceived: (payload: SyncMutationPayload) => void) {
  if (isIntentionalDisconnect) return;
  try {
    const baseUrl = getSyncBaseUrl();
    const url = `${baseUrl}/api/sync/changes?since=${encodeURIComponent(lastKnownUpdatedTimestamp)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    updateStatus('connected');

    if (data.hasChanges && data.state) {
      lastKnownUpdatedTimestamp = data.lastUpdated || new Date().toISOString();
      console.log('[JOEKAT-SYNC] Actualizacion delta recibida en tiempo real');
      onMutationReceived({
        action: 'SET',
        entity: 'ALL',
        data: data.state,
        clientId: 'remote-server',
      });
    }
  } catch (err) {
    console.warn('[JOEKAT-SYNC] Error en polling delta:', err);
  }
}

/**
 * Inicia la conexion continua en tiempo real (Server-Sent Events + Fast Delta Polling)
 */
export function startRealtimeSyncConnection(
  onMutationReceived: (payload: SyncMutationPayload) => void
): () => void {
  isIntentionalDisconnect = false;

  // 1. Polling ultrarrapido continuo cada 2.5 segundos para iOS Safari
  pollForChanges(onMutationReceived);
  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    pollForChanges(onMutationReceived);
  }, 2500);

  // 2. Event listener al volver a la app o desbloquear el telefono
  const handleVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      pollForChanges(onMutationReceived);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleVisibilityOrFocus);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
  }

  // 3. Conexion Server-Sent Events continua si el navegador lo soporta
  const connectSSE = () => {
    if (isIntentionalDisconnect) return;
    if (typeof EventSource === 'undefined') return;

    try {
      const baseUrl = getSyncBaseUrl();
      const sseUrl = `${baseUrl}/api/sync/events`;

      if (eventSource) {
        try {
          eventSource.close();
        } catch {}
      }

      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        updateStatus('connected');
      };

      eventSource.addEventListener('CONNECTED', () => {
        updateStatus('connected');
      });

      eventSource.addEventListener('MUTATION', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as SyncMutationPayload;
          if (payload.clientId && payload.clientId === CLIENT_ID) {
            return;
          }
          if (payload.timestamp) {
            lastKnownUpdatedTimestamp = new Date(payload.timestamp).toISOString();
          }
          onMutationReceived(payload);
        } catch (err) {
          console.error('[JOEKAT-SYNC] Error procesando evento SSE:', err);
        }
      });

      eventSource.onerror = () => {
        if (eventSource) {
          try {
            eventSource.close();
          } catch {}
          eventSource = null;
        }
        if (!isIntentionalDisconnect) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSSE, 5000);
        }
      };
    } catch {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectSSE, 5000);
    }
  };

  connectSSE();

  return () => {
    isIntentionalDisconnect = true;
    clearInterval(pollTimer);
    clearTimeout(reconnectTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    }
    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
      eventSource = null;
    }
    updateStatus('disconnected');
  };
}
