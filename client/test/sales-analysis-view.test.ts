import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getCustomerRegions: vi.fn().mockResolvedValue([]),
  getOverview: vi.fn().mockResolvedValue({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, revenueGrowth: 0, orderGrowth: 0, newCustomers: 0, customerGrowth: 0, conversionRate: 0 }),
  getSalesTrendByGranularity: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/api/dashboard', () => api);
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn().mockResolvedValue(undefined) }),
}));

import SalesAnalysisView from '../src/views/SalesAnalysisView.vue';

const stubs = {
  SalesTrendChart: { template: '<div />' },
  MetricLineChart: { template: '<div />' },
  'el-date-picker': { template: '<input />' },
  'el-button-group': { template: '<div><slot /></div>' },
  'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  'el-skeleton': { template: '<div><slot /></div>' },
  'el-table': { template: '<div><slot /></div>' },
  'el-table-column': { template: '<div><slot /></div>' },
};

describe('SalesAnalysisView', () => {
  it('requests fresh trend data when the granularity filter changes', async () => {
    const wrapper = mount(SalesAnalysisView, { global: { stubs } });
    await flushPromises();
    expect(api.getSalesTrendByGranularity).toHaveBeenLastCalledWith(expect.any(Object), 'day');

    const weeklyButton = wrapper.findAll('button').find((button) => button.text() === '週別');
    expect(weeklyButton).toBeDefined();
    await weeklyButton?.trigger('click');
    await flushPromises();

    expect(api.getSalesTrendByGranularity).toHaveBeenLastCalledWith(expect.any(Object), 'week');
    expect(api.getSalesTrendByGranularity).toHaveBeenCalledTimes(2);
  });
});
