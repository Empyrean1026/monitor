<template><section class="placeholder-page"><div class="placeholder-card"><span>◌</span><p class="overline">MODULE READY</p><h1>{{ title }}</h1><p>{{ description }}</p><div class="placeholder-grid"><i v-for="item in 6" :key="item" /></div><small>管理画面、ルートガード、リクエスト層の準備ができました</small></div></section></template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute(); const title = computed(() => String(route.meta.title)); const description = computed(() => String(route.meta.description));
</script>

<style scoped>
.placeholder-page { display: grid; min-height: calc(100vh - 145px); place-items: center; padding: 22px 0; }.placeholder-card { width: min(650px, 100%); padding: 48px; text-align: center; border: 1px solid rgba(121, 181, 227, .15); border-radius: 16px; background: linear-gradient(135deg, rgba(24, 53, 87, .72), rgba(12, 26, 48, .82)); box-shadow: 0 18px 44px rgba(0, 5, 15, .22); }.placeholder-card > span { display: grid; place-items: center; width: 44px; height: 44px; margin: 0 auto 17px; border-radius: 12px; color: #63d2fb; font-size: 22px; background: rgba(61, 181, 238, .13); }.overline { color: #4bc9f7; font-size: 10px; font-weight: 700; letter-spacing: .15em; }.placeholder-card h1 { margin: 8px 0 10px; color: #ecf7ff; font-size: 27px; }.placeholder-card > p:not(.overline) { color: #8ea9c0; font-size: 14px; }.placeholder-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 30px 0; }.placeholder-grid i { height: 55px; border-radius: 7px; background: linear-gradient(130deg, rgba(78, 157, 214, .12), rgba(83, 106, 235, .06)); }.placeholder-card small { color: #64819e; font-size: 11px; }
@media (max-width: 600px) { .placeholder-card { padding: 34px 22px; } }
</style>
