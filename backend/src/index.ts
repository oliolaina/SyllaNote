import { createApp } from './app.js';
import { env } from './config/env.js';
import { startWebSocketServer } from './websocket.js';

const { SERVICE_MODE: mode } = env;

if (mode === 'api' || mode === 'all') {
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`REST API listening on port ${env.PORT} (mode=${mode})`);
  });
}

if (mode === 'ws' || mode === 'all') {
  const wsPort = mode === 'ws' ? env.PORT : env.WS_PORT;
  startWebSocketServer(wsPort);
}
