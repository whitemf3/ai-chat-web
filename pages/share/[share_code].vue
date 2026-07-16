<template>
  <div class="share-page">
    <div v-if="loading" class="share-loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="share-error">
      <div class="error-icon">⚠️</div>
      <h2>{{ error }}</h2>
      <button @click="goHome" class="error-btn">返回首页</button>
    </div>

    <div v-else class="share-content">
      <!-- Header -->
      <header class="share-header">
        <h1>{{ conversation?.title || '分享的对话' }}</h1>
        <p class="share-meta">
          <span>⏰ 有效期至：{{ formatTime(expiresAt) }}</span>
          <span>👁️ 浏览：{{ viewCount }} 次</span>
        </p>
      </header>

      <!-- Messages -->
      <div class="share-messages">
        <div
          v-for="msg in messages"
          :key="msg.created_at"
          class="share-message"
        >
          <div :class="['message-avatar', msg.role]">
            {{ msg.role === 'user' ? '你' : 'AI' }}
          </div>
          <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="share-footer">
        <button @click="goHome" class="footer-btn primary">
          开始使用 AI Chat
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { formatShort } from '~/utils/date';

// 使用空白布局，不显示默认的导航栏
definePageMeta({
  layout: 'blank'
});

const route = useRoute();
const shareCode = route.params.share_code;

const loading = ref(true);
const error = ref('');
const conversation = ref(null);
const messages = ref([]);
const expiresAt = ref('');
const viewCount = ref(0);

// Markdown 渲染器
const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
    }
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

const renderMarkdown = (content) => md.render(content);

// 使用统一的日期格式化函数
const formatTime = formatShort;

// 跳转首页
const goHome = () => {
  navigateTo('/');
};

// 加载分享内容
onMounted(async () => {
  try {
    const config = useRuntimeConfig();
    const res = await fetch(`${config.public.apiBase}/api/share/${shareCode}`);
    const data = await res.json();

    if (!data.success) {
      error.value = data.error.message;
    } else {
      conversation.value = data.data.conversation;
      messages.value = data.data.messages;
      expiresAt.value = data.data.expires_at;
      viewCount.value = data.data.view_count;
    }
  } catch (err) {
    console.error('Load share error:', err);
    error.value = '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: #f5f0e8;
  padding: 20px;
}

.share-loading,
.share-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #10a37f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-btn {
  margin-top: 24px;
  padding: 12px 32px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.error-btn:hover {
  background: #0d8a6a;
}

.share-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.share-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.share-header h1 {
  font-size: 24px;
  margin: 0 0 12px;
}

.share-meta {
  font-size: 13px;
  color: #6e6e80;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.share-messages {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.share-message {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.message-avatar.user {
  background: #5436da;
  color: white;
}

.message-avatar.assistant {
  background: #19c37d;
  color: white;
}

.message-content {
  flex: 1;
  line-height: 1.75;
  font-size: 15px;
}

.message-content pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.message-content code {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 14px;
  color: #24292e;
}

.share-footer {
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.footer-btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.footer-btn.primary {
  background: #10a37f;
  color: white;
}

.footer-btn.primary:hover {
  background: #0d8a6a;
}
</style>