import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'ダッシュボード' } },
      { path: 'sales', name: 'sales', component: () => import('../views/SalesAnalysisView.vue'), meta: { title: '売上分析' } },
      { path: 'products', name: 'products', component: () => import('../views/ProductAnalysisView.vue'), meta: { title: '商品分析' } },
      { path: 'customers', name: 'customers', component: () => import('../views/CustomerAnalysisView.vue'), meta: { title: '顧客分析' } },
      { path: 'orders', name: 'orders', component: () => import('../views/OrderAnalysisView.vue'), meta: { title: '注文分析' } },
      { path: 'realtime', name: 'realtime', component: () => import('../views/RealtimeMonitorView.vue'), meta: { title: 'リアルタイム監視' } },
    ],
  },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: 'ログイン' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({ history: createWebHistory(), routes: appRoutes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' };
  return true;
});
