<template>
  <div class="top-products-chart">
    <div class="sort-controls" role="group" aria-label="ランキングの並び替え">
      <button v-for="option in sortOptions" :key="option.key" type="button" :class="{ active: sortBy === option.key }" @click="sortBy = option.key">{{ option.label }}</button>
    </div>
    <div v-show="data.length" ref="canvasElement" class="chart-canvas" aria-label="売れ筋商品ランキング" />
    <div v-if="!data.length" class="empty-state">表示できる商品データはありません</div>
    <div ref="tooltipElement" class="tooltip" role="status" />
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export type TopProductDatum = {
  estimatedProfit: number;
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

type SortKey = 'quantitySold' | 'revenue' | 'estimatedProfit';

const props = defineProps<{ data: TopProductDatum[] }>();
const canvasElement = ref<HTMLDivElement>();
const tooltipElement = ref<HTMLDivElement>();
const sortBy = ref<SortKey>('quantitySold');
const height = 330;
const margin = { top: 14, right: 18, bottom: 28, left: 132 };
let resizeObserver: ResizeObserver | undefined;
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
let barsGroup: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let valueLabels: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let xAxis: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let yAxis: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'quantitySold', label: '販売数' }, { key: 'revenue', label: '売上高' }, { key: 'estimatedProfit', label: '利益' },
];

const sortedProducts = computed(() => [...props.data].sort((left, right) => right[sortBy.value] - left[sortBy.value]).slice(0, 10));

function formatValue(value: number): string {
  return sortBy.value === 'quantitySold' ? `${value.toLocaleString('ja-JP')}個` : new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}

function truncate(value: string, length = 17): string { return value.length > length ? `${value.slice(0, length)}…` : value; }
function initialise(): void {
  if (!canvasElement.value || svg) return;
  svg = d3.select(canvasElement.value).append('svg').attr('role', 'img').attr('aria-label', '売れ筋商品ランキング');
  barsGroup = svg.append('g').attr('class', 'bars'); valueLabels = svg.append('g').attr('class', 'values'); xAxis = svg.append('g'); yAxis = svg.append('g');
}

function showTooltip(event: MouseEvent, item: TopProductDatum): void {
  const tooltip = tooltipElement.value; const host = canvasElement.value; if (!tooltip || !host) return;
  tooltip.innerHTML = `<strong>${item.productName}</strong><span>販売数 <b>${item.quantitySold.toLocaleString('ja-JP')}個</b></span><span>売上高 <b>${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(item.revenue)}</b></span><span>利益 <b>${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(item.estimatedProfit)}</b></span>`;
  const [x, y] = d3.pointer(event, host); tooltip.style.left = `${Math.min(host.clientWidth - 208, Math.max(8, x + 12))}px`; tooltip.style.top = `${Math.max(8, y - 24)}px`; tooltip.classList.add('visible');
}

function hideTooltip(): void { tooltipElement.value?.classList.remove('visible'); }
function styleAxis(axis: d3.Selection<SVGGElement, unknown, null, undefined>, width = 0): void {
  axis.select('.domain').attr('stroke', 'rgba(129,177,216,.17)'); axis.selectAll<SVGTextElement, unknown>('text').attr('fill', '#9ab2c7').attr('font-size', 10); axis.selectAll<SVGLineElement, unknown>('line').attr('stroke', 'rgba(129,177,216,.13)').attr('y2', -height + margin.top + margin.bottom).attr('x2', width);
}

function updateChart(): void {
  initialise(); if (!svg || !barsGroup || !valueLabels || !xAxis || !yAxis || !props.data.length) return;
  const width = Math.max(canvasElement.value?.clientWidth ?? 0, 320); const innerWidth = width - margin.left - margin.right; const innerHeight = height - margin.top - margin.bottom; const data = sortedProducts.value;
  const x = d3.scaleLinear().domain([0, Math.max(1, d3.max(data, (item) => item[sortBy.value]) ?? 1) * 1.12]).nice().range([0, innerWidth]);
  const y = d3.scaleBand<string>().domain(data.map((item) => item.productId)).range([0, innerHeight]).padding(.27);
  const byId = new Map(data.map((item) => [item.productId, item]));
  svg.attr('viewBox', `0 0 ${width} ${height}`); barsGroup.attr('transform', `translate(${margin.left},${margin.top})`); valueLabels.attr('transform', `translate(${margin.left},${margin.top})`); xAxis.attr('transform', `translate(${margin.left},${height - margin.bottom})`).call(d3.axisBottom(x).ticks(4).tickFormat((value) => sortBy.value === 'quantitySold' ? d3.format('.2s')(Number(value)) : `¥${d3.format('.2s')(Number(value))}`)); styleAxis(xAxis);
  yAxis.attr('transform', `translate(${margin.left},${margin.top})`).call(d3.axisLeft(y).tickFormat((id) => truncate(byId.get(id)?.productName ?? ''))).call((axis) => { axis.select('.domain').remove(); axis.selectAll('line').remove(); axis.selectAll<SVGTextElement, unknown>('text').attr('fill', '#b7cce0').attr('font-size', 11); });
  const bars = barsGroup.selectAll<SVGRectElement, TopProductDatum>('rect').data(data, (item) => item.productId);
  bars.exit().transition().duration(220).attr('width', 0).style('opacity', 0).remove();
  const entered = bars.enter().append('rect').attr('x', 0).attr('y', (item) => y(item.productId) ?? 0).attr('height', y.bandwidth()).attr('width', 0).attr('rx', 4).attr('fill', '#55cdf8').style('cursor', 'pointer');
  entered.merge(bars).on('mousemove', function (event, item) { d3.select(this).attr('fill', '#82ddfb'); showTooltip(event, item); }).on('mouseleave', function () { d3.select(this).attr('fill', '#55cdf8'); hideTooltip(); }).transition().duration(420).ease(d3.easeCubicOut).attr('y', (item) => y(item.productId) ?? 0).attr('height', y.bandwidth()).attr('width', (item) => x(item[sortBy.value]));
  const labels = valueLabels.selectAll<SVGTextElement, TopProductDatum>('text').data(data, (item) => item.productId);
  labels.exit().transition().duration(180).style('opacity', 0).remove();
  labels.enter().append('text').attr('dy', '0.35em').attr('fill', '#d8eafa').attr('font-size', 10).style('opacity', 0).merge(labels).text((item) => formatValue(item[sortBy.value])).transition().duration(420).ease(d3.easeCubicOut).attr('x', (item) => Math.min(innerWidth - 3, x(item[sortBy.value]) + 7)).attr('y', (item) => (y(item.productId) ?? 0) + y.bandwidth() / 2).style('opacity', 1);
}

onMounted(() => { initialise(); updateChart(); resizeObserver = new ResizeObserver(updateChart); if (canvasElement.value) resizeObserver.observe(canvasElement.value); });
onBeforeUnmount(() => { resizeObserver?.disconnect(); svg?.remove(); svg = undefined; });
watch(() => [props.data, sortBy.value], updateChart, { deep: true });
</script>

<style scoped>
.top-products-chart { position: relative; width: 100%; min-height: 330px; }.sort-controls { position: absolute; z-index: 2; top: -45px; right: 0; display: flex; gap: 4px; }.sort-controls button { border: 1px solid transparent; border-radius: 5px; padding: 4px 7px; color: #87a3bb; background: transparent; font-size: 10px; cursor: pointer; }.sort-controls button:hover { color: #c7dfef; background: rgba(84,172,229,.1); }.sort-controls button.active { border-color: rgba(83,204,248,.25); color: #c8efff; background: rgba(56,181,239,.13); }.chart-canvas { width: 100%; min-height: 330px; }.chart-canvas :deep(svg) { display: block; width: 100%; height: auto; overflow: visible; }.empty-state { display: grid; min-height: 260px; place-items: center; color: #7894ad; font-size: 13px; }.tooltip { position: absolute; z-index: 3; width: 200px; padding: 9px 10px; border: 1px solid rgba(124,185,229,.22); border-radius: 8px; color: #c8ddeb; background: rgba(8,22,40,.94); box-shadow: 0 12px 30px rgba(0,0,0,.28); font-size: 11px; opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity .12s ease, transform .12s ease; }.tooltip.visible { opacity: 1; transform: translateY(0); }.tooltip :deep(strong), .tooltip :deep(span) { display: block; }.tooltip :deep(strong) { margin-bottom: 6px; overflow: hidden; color: #e4f3ff; text-overflow: ellipsis; white-space: nowrap; }.tooltip :deep(span) { display: flex; justify-content: space-between; gap: 8px; color: #8faac1; }.tooltip :deep(b) { color: #dcecf8; font-weight: 500; }
@media (max-width: 540px) { .sort-controls { position: static; justify-content: flex-end; margin-bottom: 8px; }.top-products-chart { min-height: 310px; }.chart-canvas { min-height: 310px; } }
</style>
