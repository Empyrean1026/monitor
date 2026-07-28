import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SalesTrendChart from '../src/components/charts/SalesTrendChart.vue';

describe('SalesTrendChart', () => {
  it('shows an empty state and does not throw for empty data', () => {
    const wrapper = mount(SalesTrendChart, { props: { data: [] } });
    expect(wrapper.text()).toContain('表示できる売上データはありません');
  });
});
