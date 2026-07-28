<template>
  <div class="distribution-chart">
    <div v-if="data.length" class="chart-layout">
      <div ref="canvasElement" class="chart-canvas" aria-label="カテゴリ別売上構成グラフ" />
      <ul class="legend" aria-label="カテゴリの凡例">
        <li v-for="(item, index) in chartData" :key="item.key">
          <button type="button" :class="{ hidden: hiddenKeys.has(item.key) }" @click="toggleCategory(item.key)">
            <i :style="{ background: colorFor(index) }" /><span>{{ item.categoryName }}</span><strong>{{ item.percentage.toFixed(1) }}%</strong>
          </button>
        </li>
      </ul>
    </div>
    <div v-else class="empty-state">表示できるカテゴリデータはありません</div>
    <div ref="tooltipElement" class="tooltip" role="status" />
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export type CategoryRevenueDatum = {
  categoryName: string;
  percentage: number;
  revenue: number;
};

type ChartDatum = CategoryRevenueDatum & { key: string };
type ArcElement = SVGPathElement & { __current?: d3.PieArcDatum<ChartDatum> };

const props = defineProps<{ data: CategoryRevenueDatum[] }>();
const canvasElement = ref<HTMLDivElement>();
const tooltipElement = ref<HTMLDivElement>();
const hiddenKeys = ref(new Set<string>());
const colors = ['#55cdf8', '#6d7dff', '#5cdbb0', '#f3b75f', '#c78cff', '#ff8fa8', '#70a9dc', '#8fa9a1'];
const maxVisibleCategories = 7;
let resizeObserver: ResizeObserver | undefined;
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
let arcsGroup: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
let centerValue: d3.Selection<SVGTextElement, unknown, null, undefined> | undefined;
let centerLabel: d3.Selection<SVGTextElement, unknown, null, undefined> | undefined;

const chartData = computed<ChartDatum[]>(() => {
  const sorted = [...props.data].filter((item) => item.revenue > 0).sort((left, right) => right.revenue - left.revenue);
  const primary = sorted.slice(0, maxVisibleCategories);
  const remainder = sorted.slice(maxVisibleCategories);
  const merged = remainder.length ? [...primary, { categoryName: 'その他', revenue: remainder.reduce((sum, item) => sum + item.revenue, 0), percentage: remainder.reduce((sum, item) => sum + item.percentage, 0) }] : primary;
  return merged.map((item) => ({ ...item, key: item.categoryName }));
});

const visibleData = computed(() => chartData.value.filter((item) => !hiddenKeys.value.has(item.key)));

function colorFor(index: number): string { return colors[index % colors.length]; }
function formatMoney(value: number): string { return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value); }
function toggleCategory(key: string): void {
  const next = new Set(hiddenKeys.value); next.has(key) ? next.delete(key) : next.add(key); hiddenKeys.value = next;
}

function initialise(): void {
  if (!canvasElement.value || svg) return;
  svg = d3.select(canvasElement.value).append('svg').attr('role', 'img').attr('aria-label', 'カテゴリ別売上構成');
  arcsGroup = svg.append('g').attr('class', 'arcs');
  centerValue = svg.append('text').attr('text-anchor', 'middle').attr('fill', '#e6f3ff').attr('font-size', 17).attr('font-weight', 700);
  centerLabel = svg.append('text').attr('text-anchor', 'middle').attr('y', 19).attr('fill', '#7894ad').attr('font-size', 10).text('総売上高');
}

function showTooltip(event: MouseEvent, item: d3.PieArcDatum<ChartDatum>): void {
  const tooltip = tooltipElement.value; const host = canvasElement.value; if (!tooltip || !host) return;
  tooltip.innerHTML = `<strong>${item.data.categoryName}</strong><span>売上高 <b>${formatMoney(item.data.revenue)}</b></span><span>構成比 <b>${item.data.percentage.toFixed(1)}%</b></span>`;
  const [x, y] = d3.pointer(event, host); tooltip.style.left = `${Math.min(host.clientWidth - 154, Math.max(8, x + 12))}px`; tooltip.style.top = `${Math.max(8, y - 16)}px`; tooltip.classList.add('visible');
}

function hideTooltip(): void { tooltipElement.value?.classList.remove('visible'); }

function updateChart(): void {
  initialise();
  if (!svg || !arcsGroup || !centerValue || !centerLabel) return;
  const width = Math.max(canvasElement.value?.clientWidth ?? 0, 250); const height = 262; const radius = Math.min(width, height) / 2 - 13;
  const data = visibleData.value; const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  svg.attr('viewBox', `0 0 ${width} ${height}`); arcsGroup.attr('transform', `translate(${width / 2},${height / 2})`); centerValue.attr('x', width / 2).attr('y', height / 2).text(formatMoney(totalRevenue)); centerLabel.attr('x', width / 2).attr('y', height / 2 + 19);
  const pie = d3.pie<ChartDatum>().sort(null).value((item) => item.revenue)(data); const arc = d3.arc<d3.PieArcDatum<ChartDatum>>().innerRadius(radius * .62).outerRadius(radius);
  const paths = arcsGroup.selectAll<SVGPathElement, d3.PieArcDatum<ChartDatum>>('path').data(pie, (item) => item.data.key);
  paths.exit().transition().duration(240).style('opacity', 0).remove();
  const entered = paths.enter().append('path').attr('fill', (_, index) => colorFor(index)).attr('stroke', '#0d1d34').attr('stroke-width', 3).style('cursor', 'pointer').each(function (item) { (this as ArcElement).__current = { ...item, endAngle: item.startAngle }; });
  entered.merge(paths).on('mousemove', function (event, item) { d3.select(this).transition().duration(120).attr('transform', 'scale(1.04)').style('filter', 'brightness(1.16)'); showTooltip(event, item); }).on('mouseleave', function () { d3.select(this).transition().duration(120).attr('transform', 'scale(1)').style('filter', null); hideTooltip(); }).transition().duration(420).ease(d3.easeCubicOut).attrTween('d', function (item) { const element = this as ArcElement; const interpolate = d3.interpolate(element.__current ?? item, item); element.__current = interpolate(1); return (time) => arc(interpolate(time)) ?? ''; });
}

onMounted(() => { initialise(); updateChart(); resizeObserver = new ResizeObserver(updateChart); if (canvasElement.value) resizeObserver.observe(canvasElement.value); });
onBeforeUnmount(() => { resizeObserver?.disconnect(); svg?.remove(); svg = undefined; });
watch(() => [props.data, visibleData.value], updateChart, { deep: true });
</script>

<style scoped>
.distribution-chart { position: relative; width: 100%; }.chart-layout { display: grid; grid-template-columns: minmax(210px, 1fr) minmax(140px, .75fr); align-items: center; gap: 10px; min-height: 262px; }.chart-canvas { width: 100%; }.chart-canvas :deep(svg) { display: block; width: 100%; height: auto; overflow: visible; }.legend { display: grid; gap: 4px; padding: 0; margin: 0; list-style: none; }.legend button { display: flex; align-items: center; width: 100%; gap: 7px; padding: 5px 4px; border: 0; border-radius: 5px; color: #a7bed0; background: transparent; font-size: 11px; text-align: left; cursor: pointer; }.legend button:hover { background: rgba(91,160,214,.1); }.legend button.hidden { opacity: .38; text-decoration: line-through; }.legend i { flex: 0 0 7px; width: 7px; height: 7px; border-radius: 50%; }.legend span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.legend strong { margin-left: auto; color: #d9e9f6; font-size: 11px; font-weight: 500; }.tooltip { position: absolute; z-index: 3; min-width: 146px; padding: 9px 10px; border: 1px solid rgba(124,185,229,.22); border-radius: 8px; color: #c8ddeb; background: rgba(8,22,40,.94); box-shadow: 0 12px 30px rgba(0,0,0,.28); font-size: 11px; opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity .12s ease, transform .12s ease; }.tooltip.visible { opacity: 1; transform: translateY(0); }.tooltip :deep(strong), .tooltip :deep(span) { display: block; }.tooltip :deep(strong) { margin-bottom: 6px; color: #e4f3ff; }.tooltip :deep(span) { display: flex; justify-content: space-between; gap: 14px; color: #8faac1; }.tooltip :deep(b) { color: #dcecf8; font-weight: 500; }.empty-state { display: grid; min-height: 250px; place-items: center; color: #7894ad; font-size: 13px; }
@media (max-width: 520px) { .chart-layout { grid-template-columns: 1fr; }.legend { grid-template-columns: repeat(2, minmax(0, 1fr)); }.chart-canvas { max-width: 290px; margin: auto; } }
</style>
