<template>
  <article class="metric-card">
    <template v-if="loading"><el-skeleton animated><template #template><el-skeleton-item variant="text" style="width: 42%" /><el-skeleton-item variant="h1" style="width: 68%; margin-top: 18px" /><el-skeleton-item variant="text" style="width: 82%; margin-top: 14px" /></template></el-skeleton></template>
    <template v-else-if="error"><p class="metric-label">{{ label }}</p><div class="metric-error">データを読み込めませんでした</div><small>{{ description }}</small></template>
    <template v-else><p class="metric-label">{{ label }}</p><strong>{{ value }}</strong><div class="metric-meta"><span :class="['delta', delta >= 0 ? 'up' : 'down']">{{ delta >= 0 ? '↗' : '↘' }} {{ Math.abs(delta).toFixed(1) }}%</span><span>前期間比</span></div><small>{{ description }}</small></template>
  </article>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string; delta: number; description: string; loading: boolean; error: boolean }>();
</script>

<style scoped>
.metric-card { min-height: 154px; padding: 19px; border: 1px solid rgba(125,181,230,.13); border-radius: 13px; background: linear-gradient(135deg,rgba(24,50,82,.88),rgba(14,30,53,.88)); box-shadow: 0 15px 34px rgba(0,8,20,.18); }.metric-label, small { color: #7f9ab6; font-size: 12px; }.metric-card strong { display: block; margin: 18px 0 7px; color: #ecf6ff; font-size: 26px; letter-spacing: -.03em; }.metric-meta { display: flex; gap: 7px; align-items: center; color: #7892ac; font-size: 11px; }.delta { font-weight: 700; }.delta.up { color: #48d8a4; }.delta.down { color: #ff9aaf; }.metric-card small { display: block; margin-top: 11px; }.metric-error { margin: 23px 0 17px; color: #ff9aaf; font-size: 13px; }
</style>
