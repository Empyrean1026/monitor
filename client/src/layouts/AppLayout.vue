<template>
  <div class="app-shell">
    <SidebarNav :collapsed="isCollapsed" :mobile-open="mobileOpen" @navigate="mobileOpen = false" />
    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />
    <main class="main-area" :class="{ collapsed: isCollapsed }"><AppHeader :user="auth.user" @toggle-menu="toggleMenu" @logout="logout" /><div class="page-frame"><AppBreadcrumb /><RouterView v-slot="{ Component }"><Suspense><component :is="Component" /><template #fallback><div class="page-loading">ページを読み込んでいます…</div></template></Suspense></RouterView></div></main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import SidebarNav from '../components/layout/SidebarNav.vue';
import AppHeader from '../components/layout/AppHeader.vue';
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore(); const router = useRouter(); const isCollapsed = ref(false); const mobileOpen = ref(false); const isMobile = ref(false);
function resize(): void { isMobile.value = window.innerWidth <= 900; if (!isMobile.value) mobileOpen.value = false; }
function toggleMenu(): void { if (isMobile.value) mobileOpen.value = !mobileOpen.value; else isCollapsed.value = !isCollapsed.value; }
async function logout(): Promise<void> { await auth.logout(); ElMessage.success('ログアウトしました'); await router.replace({ name: 'login' }); }
onMounted(() => { resize(); window.addEventListener('resize', resize); }); onBeforeUnmount(() => window.removeEventListener('resize', resize));
</script>

<style scoped>
.main-area { min-height: 100vh; margin-left: 244px; transition: margin-left .2s ease; }.main-area.collapsed { margin-left: 72px; }.page-frame { max-width: 1580px; margin: 0 auto; padding: 26px 32px 48px; }.backdrop { position: fixed; z-index: 20; inset: 0; background: rgba(1, 8, 18, .62); }.page-loading { display: grid; min-height: 350px; place-items: center; color: #8ea7be; }
@media (max-width: 900px) { .main-area, .main-area.collapsed { margin-left: 0; }.page-frame { padding: 22px 18px 36px; } }
</style>
