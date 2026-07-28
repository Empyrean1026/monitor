import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

import { app } from '../src/app.js';
import { closeRealtime, initialiseRealtime } from '../src/realtime/realtime.service.js';

let httpServer: ReturnType<typeof createServer> | undefined;

afterEach(async () => {
  await closeRealtime();
  if (httpServer?.listening) await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
  httpServer = undefined;
});

describe('WebSocket protocol', () => {
  it('sends a correctly shaped connection-established event', async () => {
    httpServer = createServer(app);
    initialiseRealtime(httpServer);
    httpServer.listen(0, '127.0.0.1');
    await once(httpServer, 'listening');
    const { port } = httpServer.address() as AddressInfo;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const [payload] = await once(socket, 'message');
    const message = JSON.parse(payload.toString()) as { type: string; timestamp: string; data: { message: string } };

    expect(message).toMatchObject({ type: 'CONNECTION_ESTABLISHED', data: { message: expect.any(String) } });
    expect(Number.isNaN(Date.parse(message.timestamp))).toBe(false);
    socket.close();
  });
});
