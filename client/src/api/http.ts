import axios, { type AxiosError } from 'axios';
import { ElMessage } from 'element-plus';

import { router } from '../router';
import type { ApiErrorResponse } from '../types/api';
import { clearAuthSession, getAccessToken } from '../utils/auth-session';

export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api', timeout: 15_000 });

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      if (router.currentRoute.value.name !== 'login') await router.replace({ name: 'login' });
      ElMessage.warning('セッションの有効期限が切れました。もう一度ログインしてください。');
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else if (error.message !== 'canceled') {
      ElMessage.error('ネットワークエラーが発生しました。しばらくしてから再試行してください。');
    }
    return Promise.reject(error);
  },
);
