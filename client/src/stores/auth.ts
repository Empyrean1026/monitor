import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { getCurrentUser, loginRequest, logoutRequest } from '../api/auth';
import type { LoginPayload, AuthUser } from '../types/auth';
import { clearAuthSession, getAccessToken, getStoredUser, saveAuthSession } from '../utils/auth-session';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAccessToken());
  const user = ref<AuthUser | null>(getStoredUser());
  const isLoading = ref(false);
  const isAuthenticated = computed(() => Boolean(token.value && user.value));

  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true;
    try {
      const result = await loginRequest(payload);
      token.value = result.accessToken;
      user.value = result.user;
      saveAuthSession(result.accessToken, result.user);
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshUser(): Promise<void> {
    if (!token.value) return;
    user.value = await getCurrentUser();
    saveAuthSession(token.value, user.value);
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) await logoutRequest();
    } finally {
      token.value = null;
      user.value = null;
      clearAuthSession();
    }
  }

  return { token, user, isLoading, isAuthenticated, login, logout, refreshUser };
});
