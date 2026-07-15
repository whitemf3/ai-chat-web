<template>
  <div class="h-screen flex relative">
    <!-- Sidebar -->
    <aside
      :class="['sidebar', { 'sidebar-collapsed': !sidebarOpen }]"
    >
      <div class="sidebar-header">
        <button class="sidebar-new-chat" @click="createNewChat">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>新建聊天</span>
        </button>
      </div>

      <div class="sidebar-conversations">
        <div v-if="conversations.length === 0" style="padding: 20px; text-align: center; opacity: 0.5;">
          暂无对话记录
        </div>

        <div v-else>
          <div v-if="groupedConversations.today.length > 0">
            <div class="conversation-time-group">今天</div>
            <div
              v-for="conv in groupedConversations.today"
              :key="conv.id"
              :class="['conversation-item', { active: currentConversationId === conv.id }]"
              @click="selectConversation(conv.id)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="conversation-title">{{ conv.title }}</span>
              <button
                class="conversation-menu-btn"
                @click.stop="toggleConversationMenu(conv.id)"
                title="更多选项"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <!-- Conversation Menu -->
              <div v-if="showConversationMenu === conv.id" class="conversation-menu" @click.stop>
                <div class="conversation-menu-item" @click="shareConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>分享</span>
                </div>
                <div class="conversation-menu-item" @click="startRename(conv.id, conv.title)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>重命名</span>
                </div>
                <div class="conversation-menu-item delete" @click="deleteConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 19h18" />
                  </svg>
                  <span>删除</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="groupedConversations.yesterday.length > 0">
            <div class="conversation-time-group">昨天</div>
            <div
              v-for="conv in groupedConversations.yesterday"
              :key="conv.id"
              :class="['conversation-item', { active: currentConversationId === conv.id }]"
              @click="selectConversation(conv.id)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="conversation-title">{{ conv.title }}</span>
              <button
                class="conversation-menu-btn"
                @click.stop="toggleConversationMenu(conv.id)"
                title="更多选项"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <!-- Conversation Menu -->
              <div v-if="showConversationMenu === conv.id" class="conversation-menu" @click.stop>
                <div class="conversation-menu-item" @click="shareConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>分享</span>
                </div>
                <div class="conversation-menu-item" @click="startRename(conv.id, conv.title)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>重命名</span>
                </div>
                <div class="conversation-menu-item delete" @click="deleteConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 19h18" />
                  </svg>
                  <span>删除</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="groupedConversations.week.length > 0">
            <div class="conversation-time-group">7天内</div>
            <div
              v-for="conv in groupedConversations.week"
              :key="conv.id"
              :class="['conversation-item', { active: currentConversationId === conv.id }]"
              @click="selectConversation(conv.id)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="conversation-title">{{ conv.title }}</span>
              <button
                class="conversation-menu-btn"
                @click.stop="toggleConversationMenu(conv.id)"
                title="更多选项"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <!-- Conversation Menu -->
              <div v-if="showConversationMenu === conv.id" class="conversation-menu" @click.stop>
                <div class="conversation-menu-item" @click="shareConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>分享</span>
                </div>
                <div class="conversation-menu-item" @click="startRename(conv.id, conv.title)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>重命名</span>
                </div>
                <div class="conversation-menu-item delete" @click="deleteConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 19h18" />
                  </svg>
                  <span>删除</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="groupedConversations.older.length > 0">
            <div class="conversation-time-group">更早</div>
            <div
              v-for="conv in groupedConversations.older"
              :key="conv.id"
              :class="['conversation-item', { active: currentConversationId === conv.id }]"
              @click="selectConversation(conv.id)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="conversation-title">{{ conv.title }}</span>
              <button
                class="conversation-menu-btn"
                @click.stop="toggleConversationMenu(conv.id)"
                title="更多选项"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <!-- Conversation Menu -->
              <div v-if="showConversationMenu === conv.id" class="conversation-menu" @click.stop>
                <div class="conversation-menu-item" @click="shareConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>分享</span>
                </div>
                <div class="conversation-menu-item" @click="startRename(conv.id, conv.title)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>重命名</span>
                </div>
                <div class="conversation-menu-item delete" @click="deleteConversation(conv.id)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 19h18" />
                  </svg>
                  <span>删除</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rename Dialog -->
      <div v-if="showRenameDialog" class="rename-dialog-overlay" @click="cancelRename">
        <div class="rename-dialog" @click.stop>
          <h3>重命名对话</h3>
          <input
            v-model="renameTitle"
            type="text"
            class="rename-input"
            placeholder="请输入新名称"
            @keyup.enter="confirmRename"
            ref="renameInput"
          />
          <div class="rename-dialog-buttons">
            <button class="rename-btn cancel" @click="cancelRename">取消</button>
            <button class="rename-btn confirm" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <!-- Theme Toggle -->
        <button class="sidebar-theme-btn" @click="toggleTheme">
          <span v-if="isDark">🌙</span>
          <span v-else>☀️</span>
        </button>

        <div class="sidebar-user" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">
            {{ (user?.username || '用户').charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user?.username || '用户' }}</div>
            <div class="user-email">{{ user?.email || '' }}</div>
          </div>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <!-- User Menu Popup -->
        <div v-if="showUserMenu" class="user-menu-overlay" @click="showUserMenu = false"></div>
        <div v-if="showUserMenu" class="user-menu" @click.stop>
          <div class="menu-item logout" @click="logout">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="sidebarOpen && isMobile"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main Content -->
    <main class="main-content" :style="{ marginLeft: sidebarOpen ? '260px' : '0' }">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="icon-button" @click="sidebarOpen = !sidebarOpen">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Messages Area -->
      <div ref="messagesContainer" class="messages-container">
        <!-- Welcome Screen -->
        <div v-if="messages.length === 0" class="welcome-screen">
          <div class="welcome-logo">✨</div>
          <h1 class="welcome-title">你好，{{ user?.username || '用户' }}</h1>
          <p class="welcome-subtitle">
            我是你的 AI 助手，可以帮助你回答问题、写作、编程、翻译等。开始对话吧！
          </p>
          <div class="welcome-suggestions">
            <button
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-card"
              @click="sendSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div v-else class="messages-wrapper">
          <div
            v-for="(msg, index) in messages"
            :key="msg.id"
            class="message"
          >
            <div :class="['message-avatar', msg.role]">
              {{ msg.role === 'user' ? '你' : 'AI' }}
            </div>
            <div class="message-wrapper">
              <!-- 编辑模式 -->
              <div v-if="editingMessageIndex === index" class="message-edit-container">
                <textarea
                  v-model="editingContent"
                  class="message-edit-textarea"
                  rows="3"
                  @keydown.enter.exact.prevent="saveMessageEdit(index)"
                  @keydown.escape.exact="cancelMessageEdit"
                ></textarea>
                <div class="message-edit-actions">
                  <button class="edit-action-btn cancel" @click="cancelMessageEdit">取消</button>
                  <button class="edit-action-btn save" @click="saveMessageEdit(index)">发送</button>
                </div>
              </div>
              <!-- 正常显示 -->
              <div v-else>
                <div class="message-content">
                  <!-- AI 消息内容为空时显示思考动画 -->
                  <div v-if="msg.role === 'assistant' && !msg.content" class="thinking-indicator">
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                  </div>
                  <div v-else v-html="renderMarkdown(msg.content)"></div>
                </div>
                <!-- 消息操作按钮 -->
                <div v-if="msg.role === 'user' && !isStreaming && editingMessageIndex !== index" class="message-actions">
                  <button class="message-action-btn" @click="copyMessage(msg.content)" title="复制">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>复制</span>
                  </button>
                  <button class="message-action-btn" @click="startMessageEdit(index, msg.content)" title="编辑">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>编辑</span>
                  </button>
                </div>
                <div v-if="msg.role === 'assistant' && !isStreaming && editingMessageIndex !== index" class="message-actions">
                  <button class="message-action-btn" @click="copyMessage(msg.content)" title="复制">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>复制</span>
                  </button>
                  <button class="message-action-btn" @click="regenerateMessage(index)" title="重新生成">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>重新生成</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-wrapper">
          <!-- Model Selector in Input -->
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <select v-model="selectedModel" class="model-selector" style="flex: 1;">
              <optgroup label="推荐模型">
                <option v-for="model in recommendedModels" :key="model.id" :value="model.id">
                  {{ model.name }}
                </option>
              </optgroup>
              <optgroup label="其他模型">
                <option v-for="model in otherModels" :key="model.id" :value="model.id">
                  {{ model.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="input-container">
            <textarea
              ref="inputArea"
              v-model="inputMessage"
              @keydown.enter.exact.prevent="sendMessage"
              @input="adjustHeight"
              placeholder="发送消息..."
              rows="1"
              class="input-textarea"
            ></textarea>
            <!-- 停止生成按钮 -->
            <button
              v-if="isStreaming"
              @click="stopGeneration"
              class="stop-button"
              title="停止生成"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <!-- 发送按钮 -->
            <button
              v-else
              @click="sendMessage"
              :disabled="!inputMessage.trim()"
              class="send-button"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Custom Dialog -->
    <MessageDialog
      v-model:visible="dialog.visible.value"
      :type="dialog.type.value"
      :message="dialog.message.value"
      @confirm="dialog.handleConfirm"
      @cancel="dialog.handleCancel"
    />
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// 使用 blank 布局（不显示 header）
definePageMeta({
  layout: 'blank'
});

const config = useRuntimeConfig();

// Auth State
const token = ref('');
const user = ref(null);

// UI State
const sidebarOpen = ref(true);
const isDark = ref(false);
const isMobile = ref(false);
const showUserMenu = ref(false);
const showConversationMenu = ref(null);
const showRenameDialog = ref(false);
const renameConversationId = ref(null);
const renameTitle = ref('');
const renameInput = ref(null);

// Dialog
const dialog = useDialog();

// Chat State
const conversations = ref([]);
const currentConversationId = ref(null);
const messages = ref([]);
const models = ref([]);
const selectedModel = ref('@cf/meta/llama-3.2-3b-instruct');
const inputMessage = ref('');
const isStreaming = ref(false);
const messagesContainer = ref(null);
const inputArea = ref(null);
const abortController = ref(null); // 用于取消请求
const editingMessageIndex = ref(null); // 编辑消息的索引
const editingContent = ref(''); // 编辑的内容

// Suggestions
const suggestions = ref([
  '帮我写一段 Python 代码',
  '解释什么是机器学习',
  '翻译一段英文文本',
  '写一篇关于 AI 的短文',
]);

// Markdown Renderer
const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
    }
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

const renderMarkdown = (content) => md.render(content);

// Computed
const recommendedModels = computed(() => models.value.filter(m => m.id.includes('llama-3.2-3b') || m.id.includes('qwen-2.5')));
const otherModels = computed(() => models.value.filter(m => !m.id.includes('llama-3.2-3b') && !m.id.includes('qwen-2.5')));

const groupedConversations = computed(() => {
  const today = [];
  const yesterday = [];
  const week = [];
  const older = [];

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
  const weekAgoDate = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  conversations.value.forEach(conv => {
    const convDate = new Date(conv.updated_at || conv.created_at);

    if (convDate >= todayDate) {
      today.push(conv);
    } else if (convDate >= yesterdayDate) {
      yesterday.push(conv);
    } else if (convDate >= weekAgoDate) {
      week.push(conv);
    } else {
      older.push(conv);
    }
  });

  return { today, yesterday, week, older };
});

// Lifecycle
onMounted(() => {
  // Check authentication
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('auth_user');

  if (!storedToken) {
    navigateTo('/login');
    return;
  }

  token.value = storedToken;
  if (storedUser) user.value = JSON.parse(storedUser);

  // Theme
  isDark.value = localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark.value);

  // Check mobile
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    sidebarOpen.value = false;
  }

  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768;
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', (e) => {
    if (showConversationMenu.value && !e.target.closest('.conversation-menu') && !e.target.closest('.conversation-menu-btn')) {
      showConversationMenu.value = null;
    }
  });

  loadModels();
  loadConversations();
});

// API Methods
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${config.public.apiBase}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token.value && { Authorization: `Bearer ${token.value}` }),
  };
  return fetch(url, { ...options, headers: { ...headers, ...options.headers } }, options.signal ? { signal: options.signal } : {});
};

const loadModels = async () => {
  try {
    const res = await fetchAPI('/api/models');
    const data = await res.json();
    if (data.success) models.value = data.data;
  } catch (err) {
    console.error('Load models error:', err);
  }
};

const loadConversations = async () => {
  try {
    const res = await fetchAPI('/api/chat/conversations');
    const data = await res.json();
    if (data.success) {
      conversations.value = data.data;

      // 如果有对话，自动选中并加载最新的对话
      if (data.data.length > 0) {
        const latestConversation = data.data[0]; // 列表已按 updated_at DESC 排序
        await selectConversation(latestConversation.id);
      }
    }
  } catch (err) {
    console.error('Load conversations error:', err);
  }
};

const createNewChat = async () => {
  // 检查当前对话是否为空，如果是则复用
  if (currentConversationId.value && messages.value.length === 0) {
    return;
  }

  // 检查是否有标题为"新对话"的空对话，复用它
  const emptyConv = conversations.value.find(c => c.title === '新对话');
  if (emptyConv) {
    try {
      const res = await fetchAPI(`/api/chat/conversations/${emptyConv.id}/messages`);
      const data = await res.json();
      if (data.success && data.data.length === 0) {
        // 找到空对话，选中它
        currentConversationId.value = emptyConv.id;
        messages.value = [];
        return;
      }
    } catch (err) {
      // 忽略错误，继续创建新的
    }
  }

  // 没有空对话，创建新的
  try {
    const res = await fetchAPI('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: '新对话', model: selectedModel.value }),
    });
    const data = await res.json();
    if (data.success) {
      currentConversationId.value = data.data.id;
      messages.value = [];
      conversations.value.unshift(data.data);
    }
  } catch (err) {
    console.error('Create conversation error:', err);
  }
};

const selectConversation = async (id) => {
  currentConversationId.value = id;
  try {
    const res = await fetchAPI(`/api/chat/conversations/${id}/messages`);
    const data = await res.json();
    if (data.success) {
      messages.value = data.data;
      scrollToBottom();
    }
  } catch (err) {
    console.error('Load messages error:', err);
  }

  // Mobile: close sidebar after selecting
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};

const deleteConversation = async (id) => {
  showConversationMenu.value = null;
  const confirmed = await dialog.showConfirm('确定要删除这个对话吗？');
  if (!confirmed) return;

  try {
    const res = await fetchAPI(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (data.success) {
      conversations.value = conversations.value.filter(c => c.id !== id);

      // 如果删除的是当前对话，清空消息
      if (currentConversationId.value === id) {
        currentConversationId.value = null;
        messages.value = [];
      }
    }
  } catch (err) {
    console.error('Delete conversation error:', err);
    await dialog.showError('删除失败，请重试');
  }
};

// 切换对话菜单
const toggleConversationMenu = (id) => {
  showConversationMenu.value = showConversationMenu.value === id ? null : id;
};

// 开始重命名
const startRename = (id, currentTitle) => {
  showConversationMenu.value = null;
  renameConversationId.value = id;
  renameTitle.value = currentTitle;
  showRenameDialog.value = true;
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
      renameInput.value.select();
    }
  });
};

// 确认重命名
const confirmRename = async () => {
  if (!renameTitle.value.trim()) {
    await dialog.showError('对话名称不能为空');
    return;
  }

  try {
    const res = await fetchAPI(`/api/chat/conversations/${renameConversationId.value}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: renameTitle.value.trim() }),
    });
    const data = await res.json();

    if (data.success) {
      const convIndex = conversations.value.findIndex(c => c.id === renameConversationId.value);
      if (convIndex !== -1) {
        conversations.value[convIndex].title = renameTitle.value.trim();
      }
      showRenameDialog.value = false;
    }
  } catch (err) {
    console.error('Rename conversation error:', err);
    await dialog.showError('重命名失败，请重试');
  }
};

// 取消重命名
const cancelRename = () => {
  showRenameDialog.value = false;
  renameConversationId.value = null;
  renameTitle.value = '';
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isStreaming.value) return;

  // 如果没有当前对话，先创建一个
  if (!currentConversationId.value) {
    await createNewChat();
  }

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';
  if (inputArea.value) inputArea.value.style.height = 'auto';

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userMessage,
    created_at: new Date().toISOString(),
  });

  scrollToBottom();
  isStreaming.value = true;

  // 创建 AbortController
  abortController.value = new AbortController();

  try {
    const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message: userMessage,
        stream: true,
        model: selectedModel.value,
      }),
      signal: abortController.value.signal,
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantMsg = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          if (data.type === 'start') {
            // 收到 start 事件，创建 AI 消息
            assistantMsg = {
              id: 'temp-' + Date.now(),
              role: 'assistant',
              content: '',
              created_at: new Date().toISOString(),
            };
            messages.value.push(assistantMsg);
          } else if (data.type === 'chunk' && assistantMsg) {
            assistantMsg.content += data.content;
            scrollToBottom();
          } else if (data.type === 'done' && assistantMsg) {
            assistantMsg.id = data.message_id;
          }
        }
      }
    }

    // 更新对话标题（如果是第一条消息）
    const convIndex = conversations.value.findIndex(c => c.id === currentConversationId.value);
    if (convIndex !== -1 && conversations.value[convIndex].title === '新对话') {
      // 智能生成标题：提取关键内容，去除标点和多余字符
      let newTitle = userMessage
        .replace(/[^\w一-龥\s]/g, '') // 保留中英文和空格
        .trim()
        .substring(0, 30);

      // 如果标题太短，保留原样
      if (newTitle.length < 2) {
        newTitle = userMessage.substring(0, 30);
      }

      // 调用后端 API 更新标题
      try {
        await fetchAPI(`/api/chat/conversations/${currentConversationId.value}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: newTitle }),
        });
        conversations.value[convIndex].title = newTitle;
      } catch (err) {
        console.error('Update title error:', err);
        // 即使更新失败，也在本地更新标题
        conversations.value[convIndex].title = newTitle;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // 用户主动取消，不做错误提示
      console.log('Generation stopped by user');
    } else {
      console.error('Send message error:', err);
      await dialog.showError('发送失败，请重试');
    }
  } finally {
    isStreaming.value = false;
    abortController.value = null;
  }
};

const sendSuggestion = async (text) => {
  inputMessage.value = text;
  await sendMessage();
};

// 停止生成
const stopGeneration = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  isStreaming.value = false;
};

// 复制消息
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    await dialog.showSuccess('已复制到剪贴板');
  } catch (err) {
    console.error('Copy error:', err);
    await dialog.showError('复制失败');
  }
};

// 重新生成
const regenerateMessage = async (messageIndex) => {
  if (isStreaming.value) return;

  // 找到用户消息（AI 回复的前一条）
  const userMsgIndex = messageIndex - 1;
  if (userMsgIndex < 0 || messages.value[userMsgIndex].role !== 'user') {
    await dialog.showError('无法重新生成');
    return;
  }

  const userMessage = messages.value[userMsgIndex].content;

  // 删除当前的 AI 回复
  messages.value.splice(messageIndex, 1);

  // 重新发送
  inputMessage.value = userMessage;
  await sendMessage();
};

// 开始编辑消息
const startMessageEdit = (index, content) => {
  editingMessageIndex.value = index;
  editingContent.value = content;
};

// 取消编辑
const cancelMessageEdit = () => {
  editingMessageIndex.value = null;
  editingContent.value = '';
};

// 保存消息编辑（发送编辑后的消息）
const saveMessageEdit = async (index) => {
  if (!editingContent.value.trim()) {
    await dialog.showError('消息内容不能为空');
    return;
  }

  if (!currentConversation.value) {
    await dialog.showError('请先选择对话');
    editingMessageIndex.value = null;
    editingContent.value = '';
    return;
  }

  const msg = messages.value[index];
  const newContent = editingContent.value.trim();

  // 调用后端API更新消息
  try {
    const res = await fetchAPI(`/api/chat/conversations/${currentConversation.value}/messages/${msg.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: newContent }),
    });

    const data = await res.json();

    if (!data.success) {
      await dialog.showError(data.error.message || '编辑失败');
      return;
    }

    // 更新本地消息内容
    messages.value[index].content = newContent;

    // 取消编辑模式
    editingMessageIndex.value = null;
    editingContent.value = '';

    // 删除该消息之后的所有消息（本地）
    const messagesToDelete = messages.value.length - index - 1;
    if (messagesToDelete > 0) {
      messages.value.splice(index + 1, messagesToDelete);
    }

    // 如果是用户消息，重新生成 AI 回复
    if (msg.role === 'user') {
      // 获取历史消息构建上下文
      const historyMessages = messages.value.slice(0, index + 1).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 发送请求获取新的AI回复
      await generateAIResponse(historyMessages);
    }

  } catch (err) {
    console.error('Edit message error:', err);
    await dialog.showError('编辑失败，请重试');
  }
};

// 生成AI回复
const generateAIResponse = async (historyMessages) => {
  if (!currentConversation.value) return;

  isStreaming.value = true;

  try {
    const response = await fetchAPI(`/api/chat/conversations/${currentConversation.value}/messages`, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: historyMessages[historyMessages.length - 1].content,
        stream: true,
        model: selectedModel.value,
      }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'start') {
              aiMessage = { id: 'temp-' + Date.now(), role: 'assistant', content: '' };
              messages.value.push(aiMessage);
            } else if (data.type === 'chunk' && aiMessage) {
              aiMessage.content += data.content;
              scrollToBottom();
            } else if (data.type === 'done' && aiMessage) {
              aiMessage.id = data.message_id;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

  } catch (err) {
    console.error('Generate AI response error:', err);
    await dialog.showError('生成回复失败');
  } finally {
    isStreaming.value = false;
  }
};

// 分享对话
const shareConversation = async (conversationId) => {
  showConversationMenu.value = null;

  try {
    // 调用后端 API 创建分享链接
    const res = await fetchAPI('/api/share', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    });

    const data = await res.json();

    if (!data.success) {
      await dialog.showError(data.error.message || '创建分享链接失败');
      return;
    }

    // 拼接前端分享链接（使用当前页面域名，不是 API 域名）
    const shareUrl = `${window.location.origin}/share/${data.data.share_code}`;

    // 复制链接到剪贴板
    await navigator.clipboard.writeText(shareUrl);

    // 显示成功提示
    await dialog.showSuccess('公开链接已复制到剪贴板！\n\n任何拥有此链接的人都可查看此对话\n有效期：24小时');
  } catch (err) {
    console.error('Share error:', err);
    await dialog.showError('分享失败，请重试');
  }
};

// UI Methods
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const logout = async () => {
  showUserMenu.value = false;
  const confirmed = await dialog.showConfirm('确定要退出登录吗？');
  if (!confirmed) return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  navigateTo('/login');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const adjustHeight = () => {
  if (inputArea.value) {
    inputArea.value.style.height = 'auto';
    inputArea.value.style.height = Math.min(inputArea.value.scrollHeight, 200) + 'px';
  }
};
</script>

<style scoped>
.user-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: transparent;
}

.user-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 12px;
  right: 12px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1001;
}

.dark .user-menu {
  background: #2a2b32;
  border-color: rgba(255, 255, 255, 0.1);
}

.rename-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.rename-dialog {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dark .rename-dialog {
  background: #2a2b32;
}

.rename-dialog h3 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
}

.rename-input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.rename-input:focus {
  border-color: #10a37f;
}

.dark .rename-input {
  background: #1e1e2e;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ececf1;
}

.rename-dialog-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.rename-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.rename-btn.cancel {
  background: #f4f4f4;
  color: #6e6e80;
}

.rename-btn.cancel:hover {
  background: #e4e4e4;
}

.rename-btn.confirm {
  background: #10a37f;
  color: white;
}

.rename-btn.confirm:hover {
  background: #0d8a6a;
}

.dark .rename-btn.cancel {
  background: #444654;
  color: #b4b4b4;
}

.dark .rename-btn.cancel:hover {
  background: #545563;
}
</style>

<style>
.thinking-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  background: #10a37f;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-dot:nth-child(1) {
  animation-delay: 0s;
}

.thinking-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.thinking-dot:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>