<template>
  <section class="page">
    <header class="page-head">
      <div><p>ORDER INTELLIGENCE</p><h1>注文分析</h1><span>注文の推移、ステータス、決済方法を確認します。</span></div>
      <el-button :loading="isLoading" @click="reload">更新</el-button>
    </header>

    <article class="surface filters">
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="〜" start-placeholder="開始日" end-placeholder="終了日" :clearable="false" @change="applyFilters" />
      <el-select v-model="status" clearable placeholder="すべてのステータス" @change="applyFilters"><el-option v-for="option in statusOptions" :key="option" :label="orderStatusLabel(option)" :value="option" /></el-select>
      <el-select v-model="paymentMethod" clearable placeholder="すべての決済方法" @change="applyFilters"><el-option v-for="option in paymentOptions" :key="option" :label="paymentMethodLabel(option)" :value="option" /></el-select>
    </article>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="error" />

    <div class="charts">
      <article class="surface chart-panel"><h2>注文量・売上推移</h2><el-skeleton v-if="analyticsLoading" animated :rows="8" /><SalesTrendChart v-else :data="trend" /></article>
      <article class="surface"><h2>注文ステータス</h2><el-skeleton v-if="analyticsLoading" animated :rows="5" /><div v-else-if="statusSummary.length" class="distribution"><div v-for="item in statusSummary" :key="item.status"><span>{{ orderStatusLabel(item.status) }}</span><el-progress :percentage="item.percentage" :stroke-width="7" :show-text="false" /><b>{{ item.count }}件 · {{ item.percentage }}%</b></div></div><el-empty v-else description="注文データはありません" :image-size="70" /></article>
      <article class="surface"><h2>決済方法</h2><el-skeleton v-if="analyticsLoading" animated :rows="5" /><div v-else-if="paymentSummary.length" class="distribution"><div v-for="item in paymentSummary" :key="item.paymentMethod"><span>{{ paymentMethodLabel(item.paymentMethod) }}</span><el-progress :percentage="item.percentage" :stroke-width="7" :show-text="false" /><b>{{ item.orderCount }}件 · {{ item.percentage }}%</b></div></div><el-empty v-else description="決済データはありません" :image-size="70" /></article>
    </div>

    <article class="surface table-panel">
      <div class="table-head"><div><h2>注文一覧</h2><small>{{ total }} 件</small></div><div class="sort"><span>並び順</span><el-select v-model="sortBy" size="small" @change="changeSort"><el-option label="注文日時" value="createdAt" /><el-option label="注文金額" value="totalAmount" /><el-option label="注文番号" value="orderNumber" /></el-select><el-button size="small" @click="toggleOrder">{{ sortOrder === 'desc' ? '降順' : '昇順' }}</el-button></div></div>
      <el-table v-if="orders.length || listLoading" v-loading="listLoading" :data="orders" class="order-table" empty-text="注文データはありません">
        <el-table-column prop="orderNumber" label="注文番号" min-width="160" />
        <el-table-column prop="customerName" label="顧客" min-width="130" />
        <el-table-column prop="status" label="ステータス" min-width="110"><template #default="{ row }"><el-tag :type="statusTagType(row.status)" effect="dark">{{ orderStatusLabel(row.status) }}</el-tag></template></el-table-column>
        <el-table-column prop="paymentMethod" label="決済方法" min-width="145"><template #default="{ row }">{{ paymentMethodLabel(row.paymentMethod) }}</template></el-table-column>
        <el-table-column prop="region" label="地域" min-width="100" />
        <el-table-column prop="totalAmount" label="金額" min-width="120" align="right"><template #default="{ row }">{{ formatOrderMoney(row.totalAmount) }}</template></el-table-column>
        <el-table-column prop="createdAt" label="注文日時" min-width="165"><template #default="{ row }">{{ formatOrderDate(row.createdAt) }}</template></el-table-column>
      </el-table>
      <el-empty v-else-if="!listLoading" description="条件に一致する注文はありません" :image-size="90" />
      <div v-if="total > pageSize" class="pagination"><el-pagination v-model:current-page="page" :page-size="pageSize" layout="prev, pager, next, total" :total="total" @current-change="changePage" /></div>
    </article>
  </section>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SalesTrendChart from '../components/charts/SalesTrendChart.vue';
import { getOrderList, getOrderStatus, getPaymentMethods, getSalesTrendByGranularity, type OrderListParams } from '../api/dashboard';
import type { OrderStatusSummary, PaymentMethodSummary, RecentOrder, SalesTrendPoint } from '../types/dashboard';
import { formatOrderDate, formatOrderMoney, orderStatusLabel, paymentMethodLabel, statusTagType } from '../utils/order-presentation';

type SortBy = OrderListParams['sortBy'];
type SortOrder = OrderListParams['sortOrder'];
const route = useRoute(); const router = useRouter();
const defaultEnd = dayjs().format('YYYY-MM-DD'); const defaultStart = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
const dateRange = ref<[string, string]>([String(route.query.startDate ?? defaultStart), String(route.query.endDate ?? defaultEnd)]);
const status = ref(String(route.query.status ?? '')); const paymentMethod = ref(String(route.query.paymentMethod ?? ''));
const page = ref(Math.max(1, Number(route.query.page ?? 1) || 1)); const pageSize = 20;
const sortBy = ref<SortBy>(isSortBy(route.query.sortBy) ? route.query.sortBy : 'createdAt'); const sortOrder = ref<SortOrder>(route.query.sortOrder === 'asc' ? 'asc' : 'desc');
const orders = ref<RecentOrder[]>([]); const total = ref(0); const trend = ref<SalesTrendPoint[]>([]); const statusSummary = ref<OrderStatusSummary[]>([]); const paymentSummary = ref<PaymentMethodSummary[]>([]);
const listLoading = ref(false); const analyticsLoading = ref(false); const error = ref('');
const isLoading = computed(() => listLoading.value || analyticsLoading.value);
const statusOptions = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
const paymentOptions = ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'PAYPAY', 'KONBINI'];

function isSortBy(value: unknown): value is SortBy { return value === 'createdAt' || value === 'totalAmount' || value === 'orderNumber'; }
function dates(): { startDate: string; endDate: string } { return { startDate: dateRange.value[0], endDate: dateRange.value[1] }; }
function listParams(): OrderListParams { return { ...dates(), status: status.value || undefined, paymentMethod: paymentMethod.value || undefined, page: page.value, pageSize, sortBy: sortBy.value, sortOrder: sortOrder.value }; }
async function syncQuery(): Promise<void> { await router.replace({ query: { ...dates(), ...(status.value ? { status: status.value } : {}), ...(paymentMethod.value ? { paymentMethod: paymentMethod.value } : {}), page: String(page.value), sortBy: sortBy.value, sortOrder: sortOrder.value } }); }
async function loadList(): Promise<void> { listLoading.value = true; error.value = ''; try { const response = await getOrderList(listParams()); orders.value = response.items; total.value = response.total; } catch { error.value = '注文一覧を取得できませんでした。接続を確認して再試行してください。'; } finally { listLoading.value = false; } }
async function loadAnalytics(): Promise<void> { analyticsLoading.value = true; const params = dates(); const [trendResult, statusResult, paymentResult] = await Promise.allSettled([getSalesTrendByGranularity(params, 'day'), getOrderStatus(params), getPaymentMethods(params)]); if (trendResult.status === 'fulfilled') trend.value = trendResult.value; if (statusResult.status === 'fulfilled') statusSummary.value = statusResult.value; if (paymentResult.status === 'fulfilled') paymentSummary.value = paymentResult.value; if ([trendResult, statusResult, paymentResult].some((result) => result.status === 'rejected') && !error.value) error.value = '一部の分析データを取得できませんでした。'; analyticsLoading.value = false; }
async function reload(): Promise<void> { await Promise.all([loadList(), loadAnalytics()]); }
async function applyFilters(): Promise<void> { page.value = 1; await syncQuery(); await reload(); }
async function changePage(): Promise<void> { await syncQuery(); await loadList(); }
async function changeSort(): Promise<void> { page.value = 1; await syncQuery(); await loadList(); }
async function toggleOrder(): Promise<void> { sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'; await changeSort(); }
void reload();
</script>

<style scoped>
.page{padding:22px 0}.page-head,.table-head,.filters,.sort{display:flex;align-items:center;gap:12px}.page-head,.table-head{justify-content:space-between;margin:0 0 18px}.page-head p{margin:0;color:#55cdf8;font-size:11px;letter-spacing:.14em}.page-head h1{margin:7px 0;color:#edf7ff;font-size:26px}.page-head span,.table-head small{color:#89a5bd;font-size:12px}.surface{border:1px solid rgba(125,181,230,.13);border-radius:13px;background:linear-gradient(145deg,#10263f,#0d2036);box-shadow:0 12px 26px rgba(0,0,0,.12)}.filters{padding:14px;margin-bottom:16px;flex-wrap:wrap}.filters :deep(.el-select){width:190px}.error{margin-bottom:16px}.charts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;margin-bottom:16px}.charts .surface,.table-panel{padding:18px}.surface h2{margin:0 0 15px;color:#eaf4fc;font-size:15px}.distribution{display:grid;gap:12px}.distribution>div{display:grid;grid-template-columns:82px 1fr auto;align-items:center;gap:8px;color:#a9bfd1;font-size:12px}.distribution b{color:#d5e8f5;font-weight:500;white-space:nowrap;font-size:11px}.table-head{margin-bottom:12px}.table-head h2{margin:0 0 3px}.sort{color:#92abc0;font-size:12px}.sort :deep(.el-select){width:110px}.order-table{--el-table-bg-color:transparent;--el-table-tr-bg-color:transparent;--el-table-header-bg-color:rgba(96,157,205,.08);--el-table-row-hover-bg-color:rgba(96,157,205,.08);--el-table-text-color:#c4d9e7;--el-table-header-text-color:#8facbf;--el-table-border-color:rgba(125,181,230,.1)}.pagination{display:flex;justify-content:flex-end;margin-top:16px}@media(max-width:1100px){.charts{grid-template-columns:1fr 1fr}.chart-panel{grid-column:1/-1}}@media(max-width:700px){.page-head,.table-head{align-items:flex-start;flex-direction:column}.filters :deep(.el-date-editor),.filters :deep(.el-select){width:100%}.charts{grid-template-columns:1fr}.chart-panel{grid-column:auto}.distribution>div{grid-template-columns:78px 1fr}.distribution b{grid-column:2}.sort{flex-wrap:wrap}}
</style>
