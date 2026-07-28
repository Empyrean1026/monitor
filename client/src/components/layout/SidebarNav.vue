<template>
  <aside class="sidebar" :class="{ collapsed, mobileOpen }">
    <AppBrand :collapsed="collapsed" />
    <nav class="nav" aria-label="メインナビゲーション">
      <RouterLink v-for="item in menuItems" :key="item.to" :to="item.to" class="nav-item" @click="emit('navigate')">
        <span class="nav-symbol">{{ item.symbol }}</span><span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div v-if="!collapsed" class="sidebar-footer"><span class="live-dot" />システムは正常に稼働中</div>
  </aside>
</template>

<script setup lang="ts">
import AppBrand from '../common/AppBrand.vue';

defineProps<{ collapsed: boolean; mobileOpen: boolean }>();
const emit = defineEmits<{ navigate: [] }>();
const menuItems = [
  { label: 'ダッシュボード', to: '/', symbol: '▦' }, { label: '売上分析', to: '/sales', symbol: '↗' },
  { label: '商品分析', to: '/products', symbol: '◇' }, { label: '顧客分析', to: '/customers', symbol: '◎' },
  { label: '注文分析', to: '/orders', symbol: '▤' }, { label: 'リアルタイム監視', to: '/realtime', symbol: '◉' },
];
</script>

<style scoped>
.sidebar { display: flex; flex-direction: column; position: fixed; z-index: 30; inset: 0 auto 0 0; width: 244px; color: #a8b9cf; background: linear-gradient(180deg, #0e1c31, #091426); border-right: 1px solid rgba(129, 171, 218, .12); transition: width .2s ease, transform .2s ease; }.sidebar.collapsed { width: 72px; }.nav { padding: 20px 12px; display: grid; gap: 6px; }.nav-item { display: flex; align-items: center; gap: 13px; height: 46px; border-radius: 9px; padding: 0 12px; color: inherit; text-decoration: none; font-size: 14px; transition: background .15s ease, color .15s ease; }.nav-item:hover { background: rgba(82, 170, 244, .09); color: #e8f5ff; }.nav-item.router-link-exact-active { color: #f4faff; background: linear-gradient(100deg, rgba(41, 175, 249, .22), rgba(81, 101, 247, .15)); box-shadow: inset 2px 0 #45c9ff; }.nav-symbol { width: 22px; text-align: center; color: #62cfff; font-size: 18px; }.nav-label { white-space: nowrap; }.sidebar-footer { display: flex; gap: 8px; align-items: center; margin: auto 18px 24px; font-size: 11px; color: #6f8da9; white-space: nowrap; }.live-dot { width: 6px; height: 6px; border-radius: 50%; background: #3fdea2; box-shadow: 0 0 10px #3fdea2; }
@media (max-width: 900px) { .sidebar { transform: translateX(-100%); width: 244px; box-shadow: 14px 0 36px rgba(0, 0, 0, .32); }.sidebar.mobileOpen { transform: translateX(0); }.sidebar.collapsed { width: 244px; } }
</style>
