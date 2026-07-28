import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MetricCard from '../src/components/dashboard/MetricCard.vue';

const props = { label: '総売上', value: '¥12,800', delta: 12.5, description: '前期と比較した売上高', loading: false, error: false };

describe('MetricCard', () => {
  it('renders its metric value and positive delta', () => {
    const wrapper = mount(MetricCard, { props });
    expect(wrapper.text()).toContain('総売上');
    expect(wrapper.text()).toContain('¥12,800');
    expect(wrapper.find('.delta').classes()).toContain('up');
  });

  it('renders a loading skeleton without metric content', () => {
    const wrapper = mount(MetricCard, { props: { ...props, loading: true } });
    expect(wrapper.find('.el-skeleton').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('¥12,800');
  });

  it('renders an error state', () => {
    const wrapper = mount(MetricCard, { props: { ...props, error: true } });
    expect(wrapper.find('.metric-error').text()).toContain('データを読み込めませんでした');
  });
});
