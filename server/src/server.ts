import { createServer } from 'node:http';

import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { closeRealtime, initialiseRealtime } from './realtime/realtime.service.js';

const server = createServer(app);
initialiseRealtime(server);
let isShuttingDown = false;

server.listen(env.PORT, '127.0.0.1', () => {
  console.info(`API server listening on port ${env.PORT}`);
});

server.on('error', (error) => {
  console.error('HTTP server error', error);
  process.exitCode = 1;
});

async function shutDown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`${signal} received; closing HTTP server and database connections.`);

  server.close(async (serverError) => {
    try {
      await prisma.$disconnect();
      await closeRealtime();
      if (serverError) {
        console.error(serverError);
        process.exitCode = 1;
      }
    } finally {
      process.exit();
    }
  });
}

process.on('SIGINT', () => void shutDown('SIGINT'));
process.on('SIGTERM', () => void shutDown('SIGTERM'));
