<template><el-breadcrumb separator="/" class="breadcrumb"><el-breadcrumb-item>データプラットフォーム</el-breadcrumb-item><el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item></el-breadcrumb></template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const currentTitle = computed(() => String(route.meta.title ?? 'ダッシュボード'));
</script>

<style scoped>.breadcrumb :deep(.el-breadcrumb__inner) { color: #809bb5; font-weight: 400; font-size: 12px; }.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) { color: #cfe1f2; }</style>
