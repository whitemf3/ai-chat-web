<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Theme Toggle Button -->
      <button class="login-theme-btn" @click="toggleTheme">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>

      <div class="login-logo">✨</div>
      <h1 class="login-title">开始使用</h1>
      <p class="login-subtitle">登录或注册以继续</p>

      <div class="login-tabs">
        <button
          :class="['login-tab', { active: isLogin }]"
          @click="isLogin = true"
        >
          登录
        </button>
        <button
          :class="['login-tab', { active: !isLogin }]"
          @click="handleRegisterTabClick"
        >
          注册
        </button>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <input
          v-model="form.email"
          type="email"
          class="login-input"
          placeholder="邮箱地址"
          required
        />

        <input
          v-if="!isLogin"
          v-model="form.username"
          type="text"
          class="login-input"
          placeholder="用户名"
          :required="!isLogin"
        />

        <input
          v-model="form.password"
          type="password"
          class="login-input"
          placeholder="密码"
          required
          minlength="6"
        />

        <input
          v-if="!isLogin"
          v-model="form.confirmPassword"
          type="password"
          class="login-input"
          placeholder="确认密码"
          :required="!isLogin"
        />

        <!-- Turnstile widget for login and registration -->
        <div class="turnstile-wrapper">
          <div class="cf-turnstile" data-sitekey="0x4AAAAAAD_yxEkCTD6muHx5" data-action="turnstile-spin-v2"></div>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          <span v-if="isLoading">{{ isLogin ? '登录中...' : '注册中...' }}</span>
          <span v-else>{{ isLogin ? '登录' : '注册' }}</span>
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center; font-size: 13px; color: #6e6e80;">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <button
          v-if="isLogin"
          @click="handleRegisterTabClick"
          style="color: #10a37f; background: none; border: none; cursor: pointer; font-weight: 500;"
        >
          注册账号
        </button>
        <button
          v-else
          @click="isLogin = true"
          style="color: #10a37f; background: none; border: none; cursor: pointer; font-weight: 500;"
        >
          立即登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 使用 blank 布局（不显示 header）
definePageMeta({
  layout: 'blank'
});

// Load Turnstile script for registration
useHead({
  script: [
    {
      src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
      async: true,
      defer: true,
    },
  ],
});

// ============================================
// 注册开关（设置为 true 开放注册，false 关闭注册）
// ============================================
const REGISTRATION_ENABLED = false;

const config = useRuntimeConfig();

const isLogin = ref(true);
const isLoading = ref(false);
const error = ref('');
const isDark = ref(false);

const form = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
});

onMounted(() => {
  // 如果已登录，直接跳转
  if (localStorage.getItem('auth_token')) {
    navigateTo('/');
  }

  // 初始化主题
  isDark.value = localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark.value);
});

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

// 处理注册 Tab 点击
const handleRegisterTabClick = () => {
  // 切换到注册表单
  isLogin.value = false;
};

const handleSubmit = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    // 验证
    if (!isLogin.value && form.password !== form.confirmPassword) {
      error.value = '两次输入的密码不一致';
      isLoading.value = false;
      return;
    }

    if (!isLogin.value && form.password.length < 6) {
      error.value = '密码至少需要 6 位';
      isLoading.value = false;
      return;
    }

    if (!isLogin.value && !form.username.trim()) {
      error.value = '请输入用户名';
      isLoading.value = false;
      return;
    }

    // 获取 Turnstile token (登录和注册都需要)
    const turnstileResponse = document.querySelector('input[name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse?.value;
    if (!turnstileToken) {
      error.value = '请完成人机验证';
      isLoading.value = false;
      return;
    }

    // 发送请求
    const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin.value
      ? { email: form.email, password: form.password, turnstileToken }
      : { email: form.email, username: form.username, password: form.password, turnstileToken };

    const res = await fetch(`${config.public.apiBase}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      error.value = data.error.message;
      // Reset Turnstile widget on failure so user can retry
      if (window.turnstile) {
        window.turnstile.reset();
      }
      return;
    }

    // 保存认证信息
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.data.user));

    // 跳转到首页
    navigateTo('/');

  } catch (err) {
    console.error('Auth error:', err);
    error.value = '网络错误，请稍后重试';
    // Reset Turnstile widget on network error
    if (window.turnstile) {
      window.turnstile.reset();
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.turnstile-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.dark .turnstile-wrapper iframe {
  color-scheme: dark;
}
</style>