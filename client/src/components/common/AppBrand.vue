<template>
  <div class="brand">
    <span class="brand-mark">A</span>
    <span v-if="!collapsed" class="brand-name">ANALYTICS<span>OS</span></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ collapsed: boolean }>();
</script>

<style scoped>
.brand { display: flex; align-items: center; gap: 11px; min-height: 64px; padding: 0 19px; color: #f7fbff; white-space: nowrap; overflow: hidden; }
.brand-mark { display: grid; place-items: center; flex: 0 0 29px; width: 29px; height: 29px; border-radius: 9px; font-weight: 800; font-size: 14px; background: linear-gradient(145deg, #39c8ff, #5468ff); box-shadow: 0 7px 22px rgba(52, 143, 255, .35); }
.brand-name { font-size: 13px; font-weight: 800; letter-spacing: .11em; }.brand-name span { color: #62d7ff; }
</style>
