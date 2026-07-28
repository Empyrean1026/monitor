import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWebSocket } from '../src/composables/useWebSocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readonly CONNECTING = FakeWebSocket.CONNECTING;
  readonly OPEN = FakeWebSocket.OPEN;
  readonly CLOSED = FakeWebSocket.CLOSED;
  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  constructor(_url: string) { FakeWebSocket.instances.push(this); }
  send(_value: string): void {}
  close(): void { this.readyState = FakeWebSocket.CLOSED; this.onclose?.(); }
  open(): void { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
}

const Harness = defineComponent({
  setup() { return { socket: useWebSocket() }; },
  template: '<div>{{ socket.status }}</div>',
});

describe('useWebSocket', () => {
  afterEach(() => { vi.useRealTimers(); FakeWebSocket.instances = []; });

  it('reconnects after an unexpected close', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const wrapper = mount(Harness);
    const first = FakeWebSocket.instances[0];
    first.open();
    await nextTick();
    expect(wrapper.text()).toBe('connected');

    first.onclose?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    wrapper.unmount();
  });
});
