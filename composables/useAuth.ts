import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
  }),

  persist: {
    storage: persistedState.localStorage,
  },

  actions: {
    setAuth(token, user) {
      this.token = token;
      this.user = user;
    },

    logout() {
      this.token = null;
      this.user = null;
    },
  },
});