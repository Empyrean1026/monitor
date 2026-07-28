import { config } from '@vue/test-utils';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserverMock, writable: true });
config.global.stubs = {
  'el-skeleton': { template: '<div class="el-skeleton"><slot /></div>' },
  'el-skeleton-item': { template: '<span />' },
};
