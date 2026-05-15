import { createApp } from './app.js';
import { env } from './config/env.js';
import { startWebSocketServer } from './websocket.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`REST API listening on http://localhost:${env.PORT}`);
});

startWebSocketServer();
