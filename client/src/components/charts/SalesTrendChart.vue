<template>
  <div class="trend-chart">
    <div class="metric-toggles" role="group" aria-label="表示する指標">
      <label><input v-model="showRevenue" type="checkbox" /><i class="revenue-dot" />売上高</label>
      <label><input v-model="showOrders" type="checkbox" /><i class="orders-dot" />注文数</label>
    </div>
    <div v-show="data.length" ref="canvasElement" class="chart-canvas" />
    <div v-if="!data.length" class="empty-state">表示できる売上データはありません</div>
    <div ref="tooltipElement" class="tooltip" role="status" />
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

export type SalesTrendDatum = {
  date: string;
  orderCount: number;
  revenue: number;
};

const props = defineProps<{ data: SalesTrendDatum[] }>();

const canvasElement = ref<HTMLDivElement>();
const tooltipElement = ref<HTMLDivElement>();
const showRevenue = ref(true);
const showOrders = ref(true);
const height = 270;
const margin = { top: 18, right: 58, bottom: 34, left: 64 };
const gradientId = `revenue-gradient-${Math.random().toString(36).slice(2)}`;
let resizeObserver: ResizeObserver | undefined;
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
let plot: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let xAxis: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let revenueAxis: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let ordersAxis: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let revenueArea: d3.Selection<SVGPathElement, unknown, null, undefined> | undefined;
let revenueLine: d3.Selection<SVGPathElement, unknown, null, undefined> | undefined;
let ordersLine: d3.Selection<SVGPathElement, unknown, null, undefined> | undefined;
let interactionLayer: d3.Selection<SVGRectElement, unknown, null, undefined> | undefined;

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function styleAxis(axis: d3.Selection<SVGGElement, unknown, null, undefined>, gridWidth = 0): void {
  axis.select('.domain').attr('stroke', 'rgba(129,177,216,.18)');
  axis.selectAll<SVGTextElement, unknown>('text').attr('fill', '#7894ad').attr('font-size', 10);
  axis.selectAll<SVGLineElement, unknown>('line').attr('stroke', gridWidth ? 'rgba(129,177,216,.14)' : 'rgba(129,177,216,.18)').attr('x2', gridWidth);
}

function initialise(): void {
  if (!canvasElement.value || svg) return;
  svg = d3.select(canvasElement.value).append('svg').attr('role', 'img').attr('aria-label', '売上高と注文数の推移');
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient').attr('id', gradientId).attr('x1', '0').attr('x2', '0').attr('y1', '0').attr('y2', '1');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4ccdf7').attr('stop-opacity', .27);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#4ccdf7').attr('stop-opacity', 0);
  plot = svg.append('g');
  revenueArea = plot.append('path').attr('fill', `url(#${gradientId})`);
  revenueLine = plot.append('path').attr('fill', 'none').attr('stroke', '#54d1fb').attr('stroke-width', 2.5);
  ordersLine = plot.append('path').attr('fill', 'none').attr('stroke', '#817cff').attr('stroke-width', 2.5);
  revenueAxis = svg.append('g'); ordersAxis = svg.append('g'); xAxis = svg.append('g');
  interactionLayer = plot.append('rect').attr('fill', 'transparent').style('cursor', 'crosshair').on('mousemove', showTooltip).on('mouseleave', hideTooltip);
}

function hideTooltip(): void {
  tooltipElement.value?.classList.remove('visible');
}

function showTooltip(event: MouseEvent): void {
  if (!interactionLayer || !tooltipElement.value || !props.data.length) return;
  const [pointerX] = d3.pointer(event, interactionLayer.node());
  const innerWidth = Math.max(1, (canvasElement.value?.clientWidth ?? 1) - margin.left - margin.right);
  const dates = props.data.map((item) => new Date(`${item.date}T00:00:00Z`).getTime());
  const target = dates[0] + (pointerX / innerWidth) * (dates[dates.length - 1] - dates[0]);
  const index = d3.leastIndex(dates, (value) => Math.abs(value - target)) ?? 0;
  const point = props.data[index];
  tooltipElement.value.innerHTML = `<strong>${formatDate(point.date)}</strong><span>売上高 <b>${formatMoney(point.revenue)}</b></span><span>注文数 <b>${point.orderCount.toLocaleString('ja-JP')}件</b></span>`;
  tooltipElement.value.style.left = `${Math.min((canvasElement.value?.clientWidth ?? 0) - 154, Math.max(8, pointerX + margin.left + 10))}px`;
  tooltipElement.value.style.top = '44px';
  tooltipElement.value.classList.add('visible');
}

function updateChart(): void {
  initialise();
  if (!svg || !plot || !xAxis || !revenueAxis || !ordersAxis || !revenueArea || !revenueLine || !ordersLine || !interactionLayer || !props.data.length) return;
  const width = Math.max(canvasElement.value?.clientWidth ?? 0, 280);
  const innerWidth = width - margin.left - margin.right; const innerHeight = height - margin.top - margin.bottom;
  const dates = props.data.map((item) => new Date(`${item.date}T00:00:00Z`));
  const x = d3.scaleTime().domain(d3.extent(dates) as [Date, Date]).range([0, innerWidth]);
  const revenueY = d3.scaleLinear().domain([0, Math.max(1, d3.max(props.data, (item) => item.revenue) ?? 1) * 1.1]).nice().range([innerHeight, 0]);
  const ordersY = d3.scaleLinear().domain([0, Math.max(1, d3.max(props.data, (item) => item.orderCount) ?? 1) * 1.1]).nice().range([innerHeight, 0]);
  const lineRevenue = d3.line<SalesTrendDatum>().x((item) => x(new Date(`${item.date}T00:00:00Z`))).y((item) => revenueY(item.revenue)).curve(d3.curveMonotoneX);
  const lineOrders = d3.line<SalesTrendDatum>().x((item) => x(new Date(`${item.date}T00:00:00Z`))).y((item) => ordersY(item.orderCount)).curve(d3.curveMonotoneX);
  const areaRevenue = d3.area<SalesTrendDatum>().x((item) => x(new Date(`${item.date}T00:00:00Z`))).y0(innerHeight).y1((item) => revenueY(item.revenue)).curve(d3.curveMonotoneX);
  svg.attr('viewBox', `0 0 ${width} ${height}`); plot.attr('transform', `translate(${margin.left},${margin.top})`); interactionLayer.attr('width', innerWidth).attr('height', innerHeight);
  revenueAxis.attr('transform', `translate(${margin.left},${margin.top})`).call(d3.axisLeft(revenueY).ticks(4).tickFormat((value) => `¥${d3.format('.2s')(Number(value))}`)); styleAxis(revenueAxis, innerWidth);
  ordersAxis.attr('transform', `translate(${width - margin.right},${margin.top})`).call(d3.axisRight(ordersY).ticks(4).tickFormat((value) => d3.format('.2s')(Number(value)))); styleAxis(ordersAxis);
  xAxis.attr('transform', `translate(${margin.left},${height - margin.bottom})`).call(d3.axisBottom<Date>(x).ticks(Math.min(6, props.data.length)).tickFormat((value) => d3.timeFormat('%m/%d')(value as Date))); styleAxis(xAxis);
  revenueArea.datum(props.data).transition().duration(420).ease(d3.easeCubicOut).attr('d', showRevenue.value ? areaRevenue(props.data) : null).style('opacity', showRevenue.value ? 1 : 0);
  revenueLine.datum(props.data).transition().duration(420).ease(d3.easeCubicOut).attr('d', showRevenue.value ? lineRevenue(props.data) : null).style('opacity', showRevenue.value ? 1 : 0);
  ordersLine.datum(props.data).transition().duration(420).ease(d3.easeCubicOut).attr('d', showOrders.value ? lineOrders(props.data) : null).style('opacity', showOrders.value ? 1 : 0);
  revenueAxis.style('opacity', showRevenue.value ? 1 : .25); ordersAxis.style('opacity', showOrders.value ? 1 : .25);
}

onMounted(() => { initialise(); updateChart(); resizeObserver = new ResizeObserver(updateChart); if (canvasElement.value) resizeObserver.observe(canvasElement.value); });
onBeforeUnmount(() => { resizeObserver?.disconnect(); svg?.remove(); svg = undefined; });
watch(() => [props.data, showRevenue.value, showOrders.value], updateChart, { deep: true });
</script>

<style scoped>
.trend-chart { position: relative; width: 100%; min-height: 270px; }.chart-canvas { width: 100%; min-height: 270px; padding-top: 28px; }.chart-canvas :deep(svg) { display: block; width: 100%; height: auto; overflow: visible; }.metric-toggles { position: absolute; z-index: 2; top: 0; right: 0; display: flex; gap: 12px; }.metric-toggles label { display: flex; gap: 5px; align-items: center; color: #92abc0; font-size: 11px; cursor: pointer; }.metric-toggles input { width: 12px; height: 12px; accent-color: #55cdf8; }.metric-toggles i { width: 7px; height: 7px; border-radius: 50%; }.revenue-dot { background: #55cdf8; }.orders-dot { background: #817cff; }.tooltip { position: absolute; z-index: 3; min-width: 146px; padding: 9px 10px; border: 1px solid rgba(124,185,229,.22); border-radius: 8px; color: #c8ddeb; background: rgba(8,22,40,.94); box-shadow: 0 12px 30px rgba(0,0,0,.28); font-size: 11px; opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity .12s ease, transform .12s ease; }.tooltip.visible { opacity: 1; transform: translateY(0); }.tooltip :deep(strong), .tooltip :deep(span) { display: block; }.tooltip :deep(strong) { margin-bottom: 6px; color: #e4f3ff; }.tooltip :deep(span) { display: flex; justify-content: space-between; gap: 14px; color: #8faac1; }.tooltip :deep(b) { color: #dcecf8; font-weight: 500; }.empty-state { display: grid; min-height: 250px; place-items: center; color: #7894ad; font-size: 13px; }
@media (max-width: 520px) { .metric-toggles { position: static; justify-content: flex-end; margin-bottom: 6px; }.chart-canvas { padding-top: 0; } }
</style>
