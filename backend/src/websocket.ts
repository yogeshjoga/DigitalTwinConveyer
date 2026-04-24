import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { sensorHistory, alerts } from './store/inMemory';

export function initWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');

    // Send latest sensor reading every 2s
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const latest = sensorHistory[sensorHistory.length - 1];
      const unreadAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 5);

      ws.send(
        JSON.stringify({
          type:    'live_update',
          sensor:  latest ?? null,
          alerts:  unreadAlerts,
          ts:      new Date().toISOString(),
        })
      );
    }, 2000);

    ws.on('close', () => {
      clearInterval(interval);
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });
  });

  console.log('[WS] WebSocket server ready at /ws');
}
