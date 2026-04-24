import 'dotenv/config';
import http from 'http';
import app from './app';
import { initWebSocket } from './websocket';
import { startSimulator } from './simulator';

const PORT = parseInt(process.env.PORT ?? '8000', 10);

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[BeltGuard API] Running on http://localhost:${PORT}`);
  console.log(`[BeltGuard API] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  startSimulator(2000);
});
