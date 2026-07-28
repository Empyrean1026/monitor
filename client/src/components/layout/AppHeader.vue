<template>
  <header class="header">
    <button class="header-button menu-button" type="button" aria-label="サイドバーを切り替える" @click="$emit('toggle-menu')">☰</button>
    <div class="header-spacer" />
    <span class="environment"><i />リアルタイム環境</span>
    <button class="header-button" type="button" aria-label="通知">◌</button>
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="user-button" type="button"><span class="avatar">{{ initials }}</span><span class="user-name">{{ user?.name ?? '管理者' }}</span><span class="chevron">⌄</span></button>
      <template #dropdown><el-dropdown-menu><el-dropdown-item command="logout">ログアウト</el-dropdown-item></el-dropdown-menu></template>
    </el-dropdown>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AuthUser } from '../../types/auth';

const props = defineProps<{ user: AuthUser | null }>();
const emit = defineEmits<{ 'toggle-menu': []; logout: [] }>();
const initials = computed(() => props.user?.name.slice(0, 1).toUpperCase() ?? 'A');
function handleCommand(command: string): void { if (command === 'logout') emit('logout'); }
</script>

<style scoped>
.header { height: 64px; display: flex; align-items: center; gap: 13px; padding: 0 30px; background: rgba(11, 25, 45, .72); border-bottom: 1px solid rgba(136, 177, 220, .11); backdrop-filter: blur(12px); }.header-spacer { flex: 1; }.header-button { width: 33px; height: 33px; border: 1px solid rgba(125, 171, 219, .16); border-radius: 8px; color: #b8cce1; background: rgba(77, 126, 178, .08); cursor: pointer; }.environment { display: flex; align-items: center; gap: 7px; color: #91aac3; font-size: 12px; }.environment i { width: 6px; height: 6px; border-radius: 50%; background: #45d8a1; box-shadow: 0 0 10px #45d8a1; }.user-button { display: flex; align-items: center; gap: 8px; border: 0; color: #d8e7f5; background: transparent; cursor: pointer; }.avatar { display: grid; place-items: center; width: 31px; height: 31px; border-radius: 50%; color: #dff7ff; background: linear-gradient(140deg, #1d9bd2, #5665d8); font-size: 12px; font-weight: 700; }.user-name { font-size: 13px; }.chevron { color: #718da9; }.menu-button { display: none; }
@media (max-width: 900px) { .header { padding: 0 18px; }.menu-button { display: block; }.user-name, .environment { display: none; } }
</style>
