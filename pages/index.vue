<template>
  <div class="h-screen flex relative">
    <!-- Top Alert for copy success -->
    <TopAlert
      v-model:visible="copyAlertVisible"
      type="success"
      message="复制成功"
      :duration="2000"
      :alert-key="copyAlertKey"
    />
    <!-- 侧边栏收起后的展开按钮 -->
    <button
      v-if="!sidebarOpen"
      class="sidebar-toggle-collapsed"
      @click="sidebarOpen = true"
      title="展开侧边栏"
    >
      <span class="toggle-icon">
        <span class="toggle-line"></span>
        <span class="toggle-line"></span>
        <span class="toggle-line"></span>
      </span>
    </button>

    <!-- Sidebar -->
    <aside
      :class="['sidebar', { 'sidebar-collapsed': !sidebarOpen }]"
    >
      <div class="sidebar-header">
        <button class="sidebar-toggle-btn" @click="sidebarOpen = false" title="收起侧边栏">
          <span class="toggle-icon">
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
          </span>
        </button>
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
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
        <div class="sidebar-user" @click="showUserMenu = !showUserMenu" title="更多选项">
          <div class="user-avatar">
            {{ (user?.username || '用户').charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user?.username || '用户' }}</div>
            <div class="user-email">{{ user?.email || '' }}</div>
          </div>
          <div class="user-menu-icon">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>

        <!-- User Menu Popup -->
        <div v-if="showUserMenu" class="user-menu-overlay" @click="showUserMenu = false"></div>
        <div v-if="showUserMenu" class="user-menu" @click.stop>
          <!-- 额度显示 -->
          <div class="menu-quota">
            <div class="quota-header">
              <span class="quota-label">今日额度</span>
              <span v-if="quotaLimit > 0" class="quota-percent">{{ quotaPercent.toFixed(1) }}%</span>
            </div>
            <div class="quota-bar">
              <div class="quota-used" :style="{ width: quotaPercent + '%' }"></div>
            </div>
            <div class="quota-info">
              <span>{{ quotaUsed.toLocaleString() }} / {{ quotaLimit > 0 ? quotaLimit.toLocaleString() : '无限制' }}</span>
            </div>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item" @click="openAccountModal">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>账号管理</span>
          </div>
          <div class="menu-item" @click="openSettingsModal">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>通用设置</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item logout" @click="logout">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>退出登录</span>
          </div>
        </div>
      </div>

      <!-- Account Management Modal -->
      <div
        v-if="showAccountModal"
        class="account-modal-overlay"
        @mousedown="handleOverlayMouseDown"
        @mouseup="handleOverlayMouseUp"
      >
        <div class="account-modal" @click.stop>
          <div class="account-modal-header">
            <h3>账号管理</h3>
            <button class="account-modal-close" @click="closeAccountModal">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="account-modal-body">
            <!-- 修改昵称 -->
            <div class="account-section">
              <h4>修改昵称</h4>
              <div class="account-form">
                <input
                  v-model="newUsername"
                  type="text"
                  class="account-input"
                  placeholder="新昵称"
                />
                <button
                  class="account-btn"
                  :disabled="!newUsername.trim() || newUsername === user?.username"
                  @click="updateUsername"
                >
                  保存
                </button>
              </div>
            </div>

            <!-- 修改密码 -->
            <div class="account-section">
              <h4>修改密码</h4>
              <div class="account-form">
                <input
                  v-model="oldPassword"
                  type="password"
                  class="account-input"
                  placeholder="原密码"
                />
                <input
                  v-model="newPassword"
                  type="password"
                  class="account-input"
                  placeholder="新密码"
                />
                <input
                  v-model="confirmPassword"
                  type="password"
                  class="account-input"
                  placeholder="确认新密码"
                />
                <button
                  class="account-btn"
                  :disabled="!oldPassword || !newPassword || newPassword !== confirmPassword"
                  @click="updatePassword"
                >
                  修改密码
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div
        v-if="showSettingsModal"
        class="account-modal-overlay"
        @mousedown="handleOverlayMouseDown"
        @mouseup="handleOverlayMouseUp"
      >
        <div class="account-modal" @click.stop>
          <div class="account-modal-header">
            <h3>通用设置</h3>
            <button class="account-modal-close" @click="closeSettingsModal">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="account-modal-body">
            <!-- 主题设置 -->
            <div class="account-section">
              <h4>主题</h4>
              <div class="settings-options">
                <button
                  :class="['settings-option', { active: userSettings.theme === 'light' }]"
                  @click="updateTheme('light')"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>浅色</span>
                </button>
                <button
                  :class="['settings-option', { active: userSettings.theme === 'dark' }]"
                  @click="updateTheme('dark')"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 5.646 9.003 9.003 0 0012 21a9.003 9.003 0 01-8.354-5.646z" />
                  </svg>
                  <span>深色</span>
                </button>
                <button
                  :class="['settings-option', { active: userSettings.theme === 'auto' }]"
                  @click="updateTheme('auto')"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>跟随系统</span>
                </button>
              </div>
            </div>

            <!-- 语言设置 -->
            <div class="account-section">
              <h4>语言</h4>
              <div class="settings-options">
                <button
                  :class="['settings-option', { active: userSettings.language === 'zh' }]"
                  @click="updateLanguage('zh')"
                >
                  <span>🇨🇳</span>
                  <span>简体中文</span>
                </button>
                <button
                  :class="['settings-option', { active: userSettings.language === 'en' }]"
                  @click="updateLanguage('en')"
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
              </div>
            </div>
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
          <!-- 侧边栏控制按钮已移至侧边栏 -->
        </div>
        <div class="top-bar-right">
          <!-- 分享按钮 -->
          <button
            v-if="currentConversationId && messages.length > 0"
            class="share-btn"
            @click="shareConversation(currentConversationId)"
            title="分享对话"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>分享</span>
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
                  <button
                    class="edit-action-btn save"
                    :disabled="isSavingEdit"
                    @click="saveMessageEdit(index)"
                  >
                    {{ isSavingEdit ? '发送中...' : '发送' }}
                  </button>
                </div>
              </div>
              <!-- 正常显示 -->
              <div v-else>
                <div class="message-content">
                  <!-- 用户消息的附件 -->
                  <div v-if="msg.role === 'user' && msg.metadata?.attachments" class="message-attachments">
                    <!-- 图片附件 -->
                    <img
                      v-for="(attachment, idx) in msg.metadata.attachments.filter(a => a.type === 'image')"
                      :key="'img-' + idx"
                      :src="getFileUrl(attachment.url)"
                      class="message-image"
                      @click="previewImage(getFileUrl(attachment.url))"
                    />
                    <!-- 文档附件 -->
                    <div
                      v-for="(attachment, idx) in msg.metadata.attachments.filter(a => a.type === 'document')"
                      :key="'doc-' + idx"
                      class="message-document"
                    >
                      <div class="document-info" @click="previewDocument(attachment)">
                        <div class="document-icon">
                          <!-- PDF 图标 -->
                          <svg v-if="getFileExtension(attachment.name) === 'pdf'" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            <text x="8" y="15" font-size="5" fill="currentColor" font-weight="bold">PDF</text>
                          </svg>
                          <!-- Word 图标 -->
                          <svg v-else-if="getFileExtension(attachment.name) === 'docx'" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6M9 15h4" />
                          </svg>
                          <!-- Excel 图标 -->
                          <svg v-else-if="['xlsx', 'xls'].includes(getFileExtension(attachment.name))" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 10h2M13 10h2M9 14h2M13 14h2" />
                          </svg>
                          <!-- 默认文档图标 -->
                          <svg v-else width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span class="document-name">{{ attachment.name || '文档' }}</span>
                      </div>
                      <button class="document-download-btn" @click.stop="downloadFile(attachment)" title="下载">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <!-- AI 消息内容为空时显示思考动画或错误（有生成图片时不显示错误） -->
                  <div v-if="msg.role === 'assistant' && !msg.content && !hasGeneratedImages(msg)" class="thinking-indicator">
                    <!-- 如果当前正在流式传输中，显示思考动画 -->
                    <template v-if="isStreaming && currentStreamingMessageId === msg.id">
                      <span class="thinking-dot"></span>
                      <span class="thinking-dot"></span>
                      <span class="thinking-dot"></span>
                    </template>
                    <!-- 否则显示生成失败 -->
                    <span v-else class="error-text">生成失败，请重试</span>
                  </div>
                  <div v-else-if="msg.role === 'assistant' && msg.error" class="error-text">{{ msg.error }}</div>
                  <!-- AI 消息：支持思考过程显示 -->
                  <div v-else-if="msg.role === 'assistant'" class="ai-message-container">
                    <!-- 文生图：展示生成的图片（R2 地址） -->
                    <div v-if="hasGeneratedImages(msg)" class="message-generated-images">
                      <div class="generated-image-item" v-for="(img, imgIdx) in getGeneratedImages(msg)" :key="'gen-' + imgIdx">
                        <img
                          :src="getFileUrl(img.url)"
                          class="generated-image"
                          :alt="msg.content || '生成的图片'"
                          @click="previewImage(getFileUrl(img.url))"
                        />
                        <div class="generated-image-actions">
                          <a
                            :href="getFileUrl(img.url)"
                            :download="getGeneratedImageName(img)"
                            class="generated-image-download"
                            title="下载图片"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>下载</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <!-- 思考过程（DeepSeek 模型） -->
                    <div
                      v-if="parseThinkContent(msg.content).thinking"
                      class="thinking-section"
                    >
                      <div class="thinking-header" @click="toggleThinking(msg.id)">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.95-.376-1.862-1.057-2.528l-.548-.547z" />
                        </svg>
                        <span>思考过程</span>
                        <!-- 流式生成中的动画提示 -->
                        <span v-if="!parseThinkContent(msg.content).answer" class="thinking-status">生成中...</span>
                        <svg class="thinking-toggle-icon" :class="{ 'collapsed': collapsedThinking.has(msg.id) }" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <Transition name="thinking-content">
                        <div v-show="!collapsedThinking.has(msg.id)" class="thinking-content">
                          <div v-html="renderMarkdown(parseThinkContent(msg.content).thinking)"></div>
                        </div>
                      </Transition>
                    </div>
                    <!-- 正常回答内容 -->
                    <div v-if="parseThinkContent(msg.content).answer" class="answer-content">
                      <div v-html="renderMarkdown(parseThinkContent(msg.content).answer)"></div>
                      <span v-if="isStreaming && currentStreamingMessageId === msg.id" class="streaming-cursor"></span>
                    </div>
                    <!-- 没有思考过程的普通消息 -->
                    <div v-else-if="!parseThinkContent(msg.content).thinking" class="answer-content">
                      <span v-html="renderMarkdown(msg.content)"></span>
                      <span v-if="isStreaming && currentStreamingMessageId === msg.id" class="streaming-cursor"></span>
                    </div>
                  </div>
                  <!-- 用户消息 -->
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
                  <!-- 继续生成按钮（仅在被停止的消息显示） -->
                  <button
                    v-if="stoppedMessages.has(msg.id)"
                    class="message-action-btn continue-btn"
                    :disabled="isContinuing"
                    @click="continueGeneration(index)"
                    title="继续生成"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ isContinuing ? '生成中...' : '继续生成' }}</span>
                  </button>
                  <button
                    class="message-action-btn"
                    :disabled="isRegenerating || isContinuing"
                    @click="regenerateMessage(index)"
                    title="重新生成"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{{ isRegenerating ? '生成中...' : '重新生成' }}</span>
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
          <!-- 文件预览区 -->
          <div v-if="uploadedFiles.length > 0" class="file-preview-area">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-item">
              <!-- 图片预览 -->
              <div v-if="file.type === 'image'" class="file-preview-image-wrapper">
                <img :src="getFileUrl(file.url)" class="file-preview-image" />
                <div class="image-overlay"></div>
                <button class="file-remove-btn image-remove" @click="removeFile(index)" title="移除">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <!-- 文档预览 -->
              <div v-else class="file-preview-document" :title="file.name">
                <!-- PDF 图标 -->
                <div v-if="getFileExtension(file.name) === 'pdf'" class="file-icon pdf">
                  <span class="icon-label">PDF</span>
                </div>
                <!-- Word 图标 -->
                <div v-else-if="getFileExtension(file.name) === 'docx'" class="file-icon word">
                  <span class="icon-label">W</span>
                </div>
                <!-- Excel 图标 -->
                <div v-else-if="['xlsx', 'xls'].includes(getFileExtension(file.name))" class="file-icon excel">
                  <span class="icon-label">X</span>
                </div>
                <!-- TXT 图标 -->
                <div v-else-if="getFileExtension(file.name) === 'txt'" class="file-icon txt">
                  <span class="icon-label">TXT</span>
                </div>
                <!-- MD 图标 -->
                <div v-else-if="getFileExtension(file.name) === 'md'" class="file-icon md">
                  <span class="icon-label">MD</span>
                </div>
                <!-- 默认文档图标 -->
                <div v-else class="file-icon default">
                  <span class="icon-label">文件</span>
                </div>
                <button class="file-remove-btn" @click.stop="removeFile(index)" title="移除">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 输入框主体 -->
          <div class="input-main">
            <!-- 左侧按钮组 -->
            <div class="input-left-btns">
              <!-- 文件上传按钮 -->
              <div class="upload-btn-wrapper">
                <button class="input-action-btn" @click="triggerFileUpload" :disabled="isUploading" title="上传文件">
                  <svg v-if="!isUploading" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="spinner">
                    <circle cx="12" cy="12" r="10" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10" />
                  </svg>
                </button>
                <div class="upload-hint">图片、PDF、Word、Excel、TXT、MD</div>
              </div>
              <input ref="fileInput" type="file" accept="image/*,.txt,.md,.docx,.pdf,.xlsx,.xls" multiple style="display: none" @change="handleFileUpload" />
            </div>

            <!-- 输入框 -->
            <div class="input-field-wrapper">
              <textarea
                ref="inputArea"
                v-model="inputMessage"
                @keydown.enter.exact.prevent="sendMessage"
                @input="adjustHeight"
                placeholder="输入消息..."
                rows="1"
                class="input-textarea"
              ></textarea>
            </div>

            <!-- 右侧按钮组 -->
            <div class="input-right-btns">
              <!-- 深度思考按钮 -->
              <button
                :class="['input-action-btn', { active: deepThink }]"
                @click="toggleDeepThink"
                title="深度思考模式"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.95-.376-1.862-1.057-2.528l-.548-.547z" />
                </svg>
              </button>

              <!-- 工作流选择 -->
              <div class="workflow-selector">
                <button
                  :class="['input-action-btn', { active: selectedWorkflow }]"
                  @click="showWorkflowMenu = !showWorkflowMenu"
                  title="选择AI工作流"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l3-3m0 0l3 3M6 5v14" />
                    <rect x="9" y="3" width="5" height="5" rx="1" stroke-width="1.8" />
                    <rect x="9" y="10" width="5" height="5" rx="1" stroke-width="1.8" />
                    <rect x="9" y="17" width="5" height="4" rx="1" stroke-width="1.8" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 5.5h3a2 2 0 012 2v9a2 2 0 01-2 2h-3" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 12h-2" />
                  </svg>
                </button>

                <!-- 工作流下拉菜单 -->
                <Transition name="workflow-menu">
                  <div v-if="showWorkflowMenu" class="workflow-menu">
                    <div class="workflow-menu-header">
                      <span>选择处理方式</span>
                    </div>
                    <div class="workflow-menu-list">
                      <div
                        v-for="workflow in workflows"
                        :key="workflow.id"
                        class="workflow-option"
                        :class="{ active: selectedWorkflow?.id === workflow.id }"
                        @click="selectWorkflow(workflow)"
                      >
                        <div class="workflow-icon">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h4M4 12h4M4 18h4" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6l3 3-3 3M12 18l3-3-3-3" />
                          </svg>
                        </div>
                        <div class="workflow-info">
                          <span class="workflow-name">{{ workflow.name }}</span>
                          <span class="workflow-desc">{{ workflow.description || `${workflow.step_count} 个步骤` }}</span>
                        </div>
                        <svg v-if="selectedWorkflow?.id === workflow.id" width="16" height="16" fill="#007aff" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>

                      <!-- 取消选择 -->
                      <div
                        v-if="selectedWorkflow"
                        class="workflow-option cancel"
                        @click="selectWorkflow(null)"
                      >
                        <div class="workflow-icon">✕</div>
                        <div class="workflow-info">
                          <span class="workflow-name">取消选择</span>
                          <span class="workflow-desc">使用智能模型选择</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- 发送/停止按钮 -->
              <button
                v-if="isStreaming"
                @click="stopGeneration"
                class="send-btn stop"
                title="停止生成"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
              <button
                v-else
                @click="sendMessage"
                :disabled="!inputMessage.trim() && uploadedFiles.length === 0"
                class="send-btn"
                title="发送"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 模式提示 -->
          <Transition name="mode-hint">
            <div v-if="deepThink || selectedWorkflow" class="mode-hints">
              <span v-if="deepThink" class="mode-hint">
                <span class="hint-dot"></span>
                深度思考
              </span>
              <span v-if="selectedWorkflow" class="mode-hint workflow">
                <span class="hint-dot"></span>
                {{ selectedWorkflow.name }}
              </span>
            </div>
          </Transition>
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

    <!-- Image Preview Modal -->
    <Transition name="fade">
      <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
        <div class="image-preview-container" @click.stop>
          <button class="image-preview-close" @click="closeImagePreview">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img :src="previewImageUrl" class="image-preview-img" @click.stop />
        </div>
      </div>
    </Transition>

    <!-- Document Preview Modal -->
    <Transition name="fade">
      <div v-if="showDocPreview" class="doc-preview-overlay" @click="closeDocPreview">
        <div class="doc-preview-container" @click.stop>
          <div class="doc-preview-header">
            <h3 class="doc-preview-title">{{ previewDocName }}</h3>
            <div class="doc-preview-actions">
              <button class="doc-action-btn" @click="downloadFile(previewDocFile)" title="下载">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button class="doc-action-btn" @click="closeDocPreview" title="关闭">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="doc-preview-content">
            <!-- PDF 预览 -->
            <template v-if="getFileExtension(previewDocName) === 'pdf'">
              <div v-if="docPreviewLoading" class="doc-preview-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="docPreviewError" class="doc-preview-error">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{{ docPreviewError }}</p>
                <button class="btn-download" @click="downloadFile(previewDocFile)">直接下载文件</button>
              </div>
              <div v-else class="pdf-preview" ref="pdfContainer"></div>
            </template>
            <!-- Excel 预览 -->
            <template v-else-if="['xlsx', 'xls'].includes(getFileExtension(previewDocName))">
              <div v-if="docPreviewLoading" class="doc-preview-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="docPreviewError" class="doc-preview-error">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{{ docPreviewError }}</p>
                <button class="btn-download" @click="downloadFile(previewDocFile)">直接下载文件</button>
              </div>
              <div v-else class="excel-preview" ref="excelContainer"></div>
            </template>
            <!-- Word 预览 -->
            <template v-else-if="getFileExtension(previewDocName) === 'docx'">
              <div v-if="docPreviewLoading" class="doc-preview-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="docPreviewError" class="doc-preview-error">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{{ docPreviewError }}</p>
                <button class="btn-download" @click="downloadFile(previewDocFile)">直接下载文件</button>
              </div>
              <div v-else class="word-preview" ref="wordContainer"></div>
            </template>
            <!-- Markdown 预览 -->
            <template v-else-if="getFileExtension(previewDocName) === 'md'">
              <div v-if="docPreviewLoading" class="doc-preview-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="docPreviewError" class="doc-preview-error">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{{ docPreviewError }}</p>
                <button class="btn-download" @click="downloadFile(previewDocFile)">直接下载文件</button>
              </div>
              <div v-else class="md-preview" ref="mdContainer"></div>
            </template>
            <!-- 纯文本预览 -->
            <template v-else-if="getFileExtension(previewDocName) === 'txt'">
              <div v-if="docPreviewLoading" class="doc-preview-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <pre v-else class="text-preview">{{ docTextContent }}</pre>
            </template>
            <!-- 不支持预览 -->
            <template v-else>
              <div class="doc-preview-unsupported">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>此文件格式不支持在线预览</p>
                <button class="btn-download" @click="downloadFile(previewDocFile)">下载文件</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { useChat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import { dbMessageToUIMessage, uiMessageText, getGeneratedImages as getGeneratedImagesFromUIMessage } from '~/utils/uimessage';

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

// Quota State
const quotaLimit = ref(10000);
const quotaUsed = ref(0);
const quotaUnlimited = ref(false);

// 计算额度百分比
const quotaPercent = computed(() => {
  if (quotaUnlimited.value || quotaLimit.value <= 0) return 0;
  return Math.min(100, (quotaUsed.value / quotaLimit.value) * 100);
});

// Dialog
const dialog = useDialog();

// Top Alert
const copyAlertVisible = ref(false);
const copyAlertKey = ref(0);

// Chat State
const conversations = ref([]);
const currentConversationId = ref(null);
const inputMessage = ref('');

// ============================================
// AI SDK useChat：消息状态 / 发送 / 停止 / 重新生成全托管
// 协议：UIMessageStream（SSE），与后端 chat.ts 对接
// ============================================
// 发送附加载荷（deep_think / workflow_id / 附件）：发送前更新此 ref，
// prepareSendMessagesRequest 读取后注入请求 body
const chatExtras = ref({ deep_think: false, workflow_id: null, attachments: [] });

const chatTransport = new DefaultChatTransport({
  prepareSendMessagesRequest: ({ id, messages, trigger, messageId, body }) => ({
    // ai@7：自定义请求地址字段名为 api（url 无效）
    api: `${config.public.apiBase}/api/chat/conversations/${currentConversationId.value || 'pending'}/messages`,
    headers: {
      'Content-Type': 'application/json',
      ...(token.value && { Authorization: `Bearer ${token.value}` }),
    },
    body: {
      id,
      messages,
      trigger,
      ...(messageId ? { message_id: messageId } : {}),
      ...(body || {}),
      // 平台扩展载荷
      deep_think: chatExtras.value.deep_think,
      workflow_id: chatExtras.value.workflow_id,
      attachments: chatExtras.value.attachments,
    },
  }),
});

const {
  messages: chatMessages,
  sendMessage: chatSendMessage,
  stop: chatStop,
  regenerate: chatRegenerate,
  status: chatStatus,
  error: chatError,
} = useChat({
  transport: chatTransport,
  onError: (error) => {
    console.error('useChat error:', error);
  },
});

// 消息列表更新（@ai-sdk/vue 无 setMessages，直接赋值 messages ref）
const chatSetMessages = (msgs) => {
  chatMessages.value = msgs;
};

// 错误可见性：watch chatError 驱动弹窗（避免发送失败静默）
watch(chatError, (err) => {
  if (err) {
    dialog.showError(formatAIError(err.message) || 'AI 生成失败，请稍后重试');
  }
});

// 流式期间自动滚动跟随新内容（useChat 更新 messages 时触发）
const lastMessageTextLength = () => {
  const last = chatMessages.value[chatMessages.value.length - 1];
  if (!last?.parts) return 0;
  return last.parts.reduce((sum, p) => sum + (p.type === 'text' ? (p.text?.length || 0) : 0), 0);
};

watch(lastMessageTextLength, () => {
  if (isStreaming.value) {
    // 仅当用户已在底部附近时才跟随，避免打断向上翻阅
    const el = messagesContainer.value;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
      nextTick(() => { el.scrollTop = el.scrollHeight; });
    }
  }
});

// 消息列表（渲染层统一入口）：UIMessage[] → 含 metadata 的消息对象
// content 为 parts 文本拼接（兼容模板层的 msg.content 用法）
const messages = computed(() =>
  chatMessages.value.map((m) => ({
    ...m,
    content: uiMessageText(m),
    metadata: m.metadata || {},
    attachments: getGeneratedImagesFromUIMessage(m),
  }))
);

// 流式状态（兼容模板与既有逻辑）
const isStreaming = computed(() => chatStatus.value === 'submitted' || chatStatus.value === 'streaming');
const messagesContainer = ref(null);
const inputArea = ref(null);
const editingMessageIndex = ref(null);
const editingContent = ref('');
const isSavingEdit = ref(false);
const isRegenerating = ref(false);
const stoppedMessages = ref(new Set());
const currentStreamingMessageId = computed(() => {
  if (isStreaming.value && chatMessages.value.length > 0) {
    return chatMessages.value[chatMessages.value.length - 1].id;
  }
  return null;
});
const isContinuing = ref(false);

// Deep Think & File Upload
const deepThink = ref(false);
const uploadedFiles = ref([]);
const isUploading = ref(false);
const fileInput = ref(null);

// Workflow
const workflows = ref([]);
const selectedWorkflow = ref(null);
const showWorkflowMenu = ref(false);

// 思考过程折叠状态（默认展开，所以是折叠集合）
const collapsedThinking = ref(new Set());

// 切换思考过程展开/折叠
const toggleThinking = (messageId) => {
  if (collapsedThinking.value.has(messageId)) {
    collapsedThinking.value.delete(messageId);
  } else {
    collapsedThinking.value.add(messageId);
  }
};

// Account Management
const showAccountModal = ref(false);
const newUsername = ref('');
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Settings
const showSettingsModal = ref(false);
const userSettings = ref({
  theme: 'auto',
  language: 'zh',
});
const overlayMouseDownTarget = ref(null);

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

// 分离思考和回答内容（支持流式生成中的未闭合标签）
const parseThinkContent = (content) => {
  if (!content) return { thinking: '', answer: '' };

  // 匹配完整的 <think>...</think> 标签
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const answer = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thinking, answer };
  }

  // 匹配未闭合的 <think> 标签（流式生成中）
  const unclosedThinkMatch = content.match(/<think>([\s\S]*)/);

  if (unclosedThinkMatch) {
    // 思考过程还在生成中
    const thinking = unclosedThinkMatch[1].trim();
    return { thinking, answer: '' };
  }

  return { thinking: '', answer: content };
};

// 渲染 Markdown
const renderMarkdown = (content) => md.render(content);

// Computed
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
    // 使用统一的日期解析
    const dateStr = conv.updated_at || conv.created_at;
    let convDate;
    if (dateStr.includes('T')) {
      convDate = new Date(dateStr);
    } else {
      convDate = new Date(dateStr.replace(' ', 'T') + 'Z');
    }

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
    // 关闭工作流菜单
    if (showWorkflowMenu.value && !e.target.closest('.workflow-selector')) {
      showWorkflowMenu.value = false;
    }
  });

  loadConversations();
  loadWorkflows();
  fetchQuota(); // 获取用户额度
});

// API Methods
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${config.public.apiBase}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token.value && { Authorization: `Bearer ${token.value}` }),
  };
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } }, options.signal ? { signal: options.signal } : {});

  // 检查 401 未授权响应，立即跳转登录页
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigateTo('/login');
    throw new Error('Unauthorized');
  }

  return res;
};

// 加载可用工作流
const loadWorkflows = async () => {
  try {
    const res = await fetchAPI('/api/workflows');
    const data = await res.json();
    if (data.success) {
      workflows.value = data.data || [];
    }
  } catch (err) {
    console.error('Load workflows error:', err);
  }
};

// 切换深度思考（互斥逻辑）
const toggleDeepThink = () => {
  deepThink.value = !deepThink.value;
  // 如果开启深度思考，清除工作流选择
  if (deepThink.value) {
    selectedWorkflow.value = null;
  }
};

// 选择工作流（互斥逻辑）
const selectWorkflow = (workflow) => {
  selectedWorkflow.value = workflow;
  showWorkflowMenu.value = false;
  // 如果选择了工作流，关闭深度思考
  if (workflow) {
    deepThink.value = false;
  }
};

const loadConversations = async () => {
  try {
    const res = await fetchAPI('/api/chat/conversations');
    const data = await res.json();
    if (data.success) {
      conversations.value = data.data;

      // 如果有对话，根据 URL 参数或选择最新的对话
      if (data.data.length > 0) {
        // 从 URL 获取对话 ID
        const urlConversationId = window.location.hash.slice(1); // 去掉 # 号
        if (urlConversationId && data.data.some(c => c.id === urlConversationId)) {
          // URL 中有有效的对话 ID，加载该对话
          await selectConversation(urlConversationId, false);
        } else {
          // URL 中没有对话 ID 或无效，加载最新的对话
          const latestConversation = data.data[0];
          await selectConversation(latestConversation.id, true);
        }
      }
    }
  } catch (err) {
    console.error('Load conversations error:', err);
  }
};

// 获取用户额度
const fetchQuota = async () => {
  try {
    const res = await fetchAPI('/api/user/quota');
    const data = await res.json();
    if (data.success) {
      quotaLimit.value = data.data.dailyLimit;
      quotaUsed.value = data.data.usedToday;
      quotaUnlimited.value = data.data.unlimited;
    }
  } catch (err) {
    console.error('Fetch quota error:', err);
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
        window.location.hash = emptyConv.id;
        chatSetMessages([]);
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
      body: JSON.stringify({ title: '新对话' }),
    });
    const data = await res.json();
    if (data.success) {
      currentConversationId.value = data.data.id;
      window.location.hash = data.data.id;
      chatSetMessages([]);
      conversations.value.unshift(data.data);
    }
  } catch (err) {
    console.error('Create conversation error:', err);
  }
};

const selectConversation = async (id, updateUrl = true) => {
  currentConversationId.value = id;

  // 更新 URL hash
  if (updateUrl) {
    window.location.hash = id;
  }

  try {
    const res = await fetchAPI(`/api/chat/conversations/${id}/messages`);
    const data = await res.json();
    if (data.success) {
      // D1 行 → UIMessage（含 metadata），交由 useChat 渲染
      chatSetMessages((data.data || []).map(dbMessageToUIMessage));

      // 初始化 stoppedMessages 集合（从 metadata 中读取停止状态）
      stoppedMessages.value = new Set();
      for (const msg of data.data) {
        if (msg.role === 'assistant' && msg.metadata?.stopped) {
          stoppedMessages.value.add(msg.id);
        }
      }

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

      // 如果删除的是当前对话，清空消息并清除 URL
      if (currentConversationId.value === id) {
        currentConversationId.value = null;
        chatSetMessages([]);
        window.location.hash = '';
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

// ============================================
// 文件上传
// ============================================
// 获取完整的文件 URL
const getFileUrl = (url) => {
  if (!url) return '';
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 拼接 API 前缀
  return `${config.public.apiBase}${url}`;
};

// 获取文件扩展名
const getFileExtension = (filename) => {
  if (!filename) return '';
  const ext = filename.toLowerCase().split('.').pop();
  return ext || '';
};

// ============================================
// 文生图：生成图片的展示辅助
// 兼容两种来源：
// 1. metadata.attachments（D1 历史消息与刷新后）
// 2. parts 中的 data-image（流式生成中实时下发）
// ============================================
// 获取消息中的生成图片附件列表
const getGeneratedImages = (msg) => {
  const fromMetadata = (msg?.metadata?.attachments && Array.isArray(msg.metadata.attachments))
    ? msg.metadata.attachments.filter(a => a.type === 'generated_image' && a.url)
    : [];
  const fromParts = (msg?.parts || [])
    .filter(p => p.type === 'data-image' && p.data?.url)
    .map(p => ({ type: 'generated_image', url: p.data.url, model: p.data.model }));
  return [...fromMetadata, ...fromParts];
};

// 判断消息是否包含生成图片
const hasGeneratedImages = (msg) => {
  return getGeneratedImages(msg).length > 0;
};

// 生成下载文件名（提示词前20字符 + 模型名）
const getGeneratedImageName = (img) => {
  const modelShort = (img?.model || 'ai').split('/').pop() || 'ai';
  return `ai-image-${modelShort}.png`;
};

// 下载文件
const downloadFile = async (file) => {
  try {
    const url = getFileUrl(file.url);
    // 使用 fetch 获取文件，确保正确处理 blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('下载失败');
    }
    const blob = await response.blob();
    // 创建下载链接
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // 释放 blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    dialog.showError('文件下载失败');
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  isUploading.value = true;

  for (const file of files) {
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isTxt = fileName.endsWith('.txt');
    const isMd = fileName.endsWith('.md');
    const isDocx = fileName.endsWith('.docx');
    const isPdf = fileName.endsWith('.pdf');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isDocument = isTxt || isMd || isDocx || isPdf || isExcel;

    // 检查文件类型
    if (!isImage && !isDocument) {
      dialog.showError(`文件 ${file.name} 格式不支持，目前仅支持图片、txt、md、docx、pdf、xlsx、xls 格式`);
      continue;
    }

    // 检查是否已上传图片，如果已上传图片则不能上传文档
    const hasImage = uploadedFiles.value.some(f => f.type === 'image');
    if (hasImage && isDocument) {
      dialog.showError(`已上传图片，不能同时上传文档文件。请先移除图片后再上传文档`);
      continue;
    }

    // 检查是否已上传文档，如果已上传文档则不能上传图片
    const hasDocument = uploadedFiles.value.some(f => f.type === 'document');
    if (hasDocument && isImage) {
      dialog.showError(`已上传文档文件，不能同时上传图片。请先移除文档后再上传图片`);
      continue;
    }

    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      dialog.showError(`文件 ${file.name} 超过 10MB 限制`);
      continue;
    }

    const formData = new FormData();
    formData.append('file', file);

    // 如果是文档文件，提取文本内容
    if (isDocument) {
      try {
        let textContent = '';

        if (isTxt || isMd) {
          // txt 和 md 文件直接读取
          textContent = await file.text();
        } else if (isDocx) {
          // docx 文件需要解析
          textContent = await extractDocxText(file);
        } else if (isPdf) {
          // pdf 文件需要解析
          textContent = await extractPdfText(file);
        } else if (isExcel) {
          // excel 文件需要解析
          textContent = await extractExcelText(file);
        }

        // 限制文本长度
        if (textContent.length > 50000) {
          textContent = textContent.substring(0, 50000) + '...(内容过长已截断)';
        }

        formData.append('textContent', textContent);
      } catch (err) {
        console.error('Extract text error:', err);
        dialog.showError(`文件 ${file.name} 内容提取失败`);
        continue;
      }
    }

    try {
      const res = await fetch(`${config.public.apiBase}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        uploadedFiles.value.push({
          id: data.data.id,
          name: data.data.filename,
          url: data.data.url,
          type: data.data.type,
          size: data.data.size,
          content: data.data.content,
        });
      } else {
        dialog.showError(`上传 ${file.name} 失败`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      dialog.showError(`上传 ${file.name} 失败`);
    }
  }

  isUploading.value = false;
  // 清空 input，允许重复选择同一文件
  if (fileInput.value) fileInput.value.value = '';
};

// 提取 docx 文件文本内容
const extractDocxText = async (file) => {
  try {
    const JSZip = await import('jszip');

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 读取 word/document.xml
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) {
      return '';
    }

    // 使用正则提取所有 <w:t> 标签中的文本
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (textMatches) {
      return textMatches
        .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
        .join('');
    }
    return '';
  } catch (err) {
    console.error('Extract docx error:', err);
    return '';
  }
};

// 提取 pdf 文件文本内容
const extractPdfText = async (file) => {
  try {
    // pdfjs-dist v4 的标准导入
    const pdfjsLib = await import('pdfjs-dist');

    // 设置 worker 源（使用 CDN 或禁用 worker）
    // 方案1: 使用 CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();

    // v4 API: 使用 getDocument
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    let textContent = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // v4 中 items 可能包含 str 属性或其他类型
      const pageText = content.items
        .map(item => {
          if ('str' in item) return item.str;
          return '';
        })
        .join(' ');
      textContent += pageText + '\n';
    }

    return textContent;
  } catch (err) {
    console.error('Extract pdf error:', err);
    return '';
  }
};

// 提取 excel 文件文本内容
const extractExcelText = async (file) => {
  try {
    const XLSX = await import('xlsx');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let textContent = '';

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      textContent += `【工作表: ${sheetName}】\n${csv}\n\n`;
    }

    return textContent;
  } catch (err) {
    console.error('Extract excel error:', err);
    return '';
  }
};

const removeFile = async (index) => {
  const file = uploadedFiles.value[index];
  if (!file) return;

  // 如果文件已上传到服务器（有 id），则从服务器删除
  if (file.id) {
    try {
      const res = await fetchAPI(`/api/files/${file.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Delete file error:', data.error);
      }
    } catch (err) {
      console.error('Delete file error:', err);
    }
  }

  // 从本地列表中移除
  uploadedFiles.value.splice(index, 1);
};

const sendMessage = async () => {
  if ((!inputMessage.value.trim() && uploadedFiles.value.length === 0) || isStreaming.value) return;

  // 如果没有当前对话，先创建一个
  if (!currentConversationId.value) {
    await createNewChat();
  }

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';
  if (inputArea.value) inputArea.value.style.height = 'auto';

  // 准备附件（经 chatExtras 注入请求 body，由后端装配为多模态 parts）
  const attachments = uploadedFiles.value.map(f => ({
    type: f.type,
    url: f.url,
    name: f.name,
    content: f.content, // 文档文件的文本内容
  }));
  uploadedFiles.value = [];

  // 更新发送载荷（deep_think / workflow_id / attachments）
  chatExtras.value = {
    deep_think: deepThink.value,
    workflow_id: selectedWorkflow.value?.id || null,
    attachments,
  };

  scrollToBottom();

  try {
    // useChat 全托管：乐观更新用户消息、流式接收 assistant 回复（含 data-image parts）
    await chatSendMessage({
      text: userMessage,
      metadata: attachments.length > 0 ? { attachments } : {},
    });

    // 更新对话标题（如果是第一条消息）
    const convIndex = conversations.value.findIndex(c => c.id === currentConversationId.value);
    if (convIndex !== -1 && conversations.value[convIndex].title === '新对话') {
      let newTitle = userMessage
        .replace(/[^\w一-龥\s]/g, '')
        .trim()
        .substring(0, 30);

      if (newTitle.length < 2) {
        newTitle = userMessage.substring(0, 30);
      }

      try {
        await fetchAPI(`/api/chat/conversations/${currentConversationId.value}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: newTitle }),
        });
        conversations.value[convIndex].title = newTitle;
      } catch (err) {
        console.error('Update title error:', err);
        conversations.value[convIndex].title = newTitle;
      }
    }
  } catch (err) {
    console.error('Send message error:', err);
    await dialog.showError(formatAIError(err.message) || '发送失败，请重试');
  } finally {
    // 重置载荷并刷新额度
    chatExtras.value = { deep_think: false, workflow_id: null, attachments: [] };
    fetchQuota();
  }
};

const sendSuggestion = async (text) => {
  inputMessage.value = text;
  await sendMessage();
};

// 停止生成：useChat stop() → 后端 abortSignal 触发 → onEnd(isAborted) 持久化半截内容
const stopGeneration = async () => {
  chatStop();
  // 后端保存 stopped 标记后，刷新消息以显示"继续生成"按钮
  setTimeout(async () => {
    await refreshCurrentMessages();
    fetchQuota();
  }, 600);
};

// 从服务器刷新当前对话消息（同步 stopped 状态与最新内容）
const refreshCurrentMessages = async () => {
  if (!currentConversationId.value) return;
  try {
    const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages`);
    const data = await res.json();
    if (data.success) {
      chatSetMessages((data.data || []).map(dbMessageToUIMessage));
      stoppedMessages.value = new Set(
        (data.data || []).filter(m => m.role === 'assistant' && m.metadata?.stopped).map(m => m.id)
      );
    }
  } catch (err) {
    console.error('Refresh messages error:', err);
  }
};

// 继续生成：专用端点（UIMessageStream），流式追加到目标消息
const continueGeneration = async (messageIndex) => {
  if (isContinuing.value) return;

  const msg = messages.value[messageIndex];
  if (!msg || msg.role !== 'assistant') return;

  isContinuing.value = true;

  try {
    const response = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/continue`, {
      method: 'POST',
      headers: { 'Accept': 'text/event-stream' },
      body: JSON.stringify({
        message_id: msg.id,
        existing_content: msg.content,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
    }

    // 解析 UIMessageStream SSE：text-delta 增量追加
    // 注意：chatMessages 是 shallowRef，须以「替换消息对象」方式触发响应式更新
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const chunk = JSON.parse(line.slice(6));
          if (chunk.type === 'text-delta' && chunk.delta) {
            // 追加到目标消息：替换消息对象（含新 parts 数组）以触发 shallowRef
            const targetIndex = chatMessages.value.findIndex(m => m.id === msg.id);
            if (targetIndex !== -1) {
              const target = chatMessages.value[targetIndex];
              const parts = target.parts?.length > 0 ? target.parts : [];
              const textPart = parts.find(p => p.type === 'text');
              const nextParts = textPart
                ? parts.map(p => p === textPart ? { ...p, text: p.text + chunk.delta } : p)
                : [...parts, { type: 'text', text: chunk.delta }];
              // 浅层响应式：整体替换数组触发更新
              chatSetMessages(chatMessages.value.map((m, i) =>
                i === targetIndex ? { ...target, parts: nextParts } : m
              ));
            }
            scrollToBottom();
          } else if (chunk.type === 'error') {
            throw new Error(formatAIError(chunk.errorText || chunk.message));
          } else if (chunk.type === 'finish') {
            stoppedMessages.value.delete(msg.id);
          }
        } catch (parseError) {
          if (parseError.message && !parseError.message.includes('JSON')) {
            throw parseError;
          }
          console.warn('Parse SSE data error:', parseError, 'Raw:', line);
        }
      }
    }

    // 与服务端最终内容对齐（继续生成会拼接 existing + completion）
    await refreshCurrentMessages();

  } catch (err) {
    console.error('Continue generation error:', err);
    await dialog.showError(err.message || '继续生成失败，请稍后重试');
  } finally {
    isContinuing.value = false;
  }
};

// 格式化 AI 错误消息
const formatAIError = (errorMessage) => {
  if (!errorMessage) return 'AI 生成失败，请稍后重试';
  if (errorMessage.includes('internal error')) {
    return 'AI 服务暂时不可用，请稍后重试';
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return '请求过于频繁，请稍后再试';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return '请求超时，请重试';
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return '网络连接失败，请检查网络后重试';
  }
  return errorMessage;
};

// 复制消息
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    if (copyAlertVisible.value) {
      copyAlertVisible.value = false;
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    copyAlertKey.value++;
    copyAlertVisible.value = true;
  } catch (err) {
    console.error('Copy error:', err);
    await dialog.showError('复制失败');
  }
};

// 重新生成：删除尾部 assistant 消息后，由 /generate 重新生成
const regenerateMessage = async (messageIndex) => {
  if (isStreaming.value || isRegenerating.value) return;

  const userMsgIndex = messageIndex - 1;
  if (userMsgIndex < 0 || messages.value[userMsgIndex].role !== 'user') {
    await dialog.showError('无法重新生成');
    return;
  }

  if (!currentConversationId.value) {
    await dialog.showError('请先选择对话');
    return;
  }

  isRegenerating.value = true;

  const aiMsg = messages.value[messageIndex];

  try {
    const isTempMessage = String(aiMsg.id).startsWith('temp-');
    const isEmptyMessage = !aiMsg.content;

    if (!isTempMessage && !isEmptyMessage) {
      const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages/${aiMsg.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        await dialog.showError(data.error.message || '重新生成失败');
        isRegenerating.value = false;
        return;
      }
    }

    // 本地移除该 AI 回复及之后的消息
    chatSetMessages(chatMessages.value.slice(0, messageIndex));

    // 重新生成（不重复保存用户消息）
    await generateAIResponse();

  } catch (err) {
    console.error('Regenerate error:', err);
    await dialog.showError('重新生成失败');
  } finally {
    isRegenerating.value = false;
  }
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
  if (isSavingEdit.value) return;

  if (!editingContent.value.trim()) {
    await dialog.showError('消息内容不能为空');
    return;
  }

  if (!currentConversationId.value) {
    await dialog.showError('请先选择对话');
    editingMessageIndex.value = null;
    editingContent.value = '';
    return;
  }

  isSavingEdit.value = true;

  const msg = messages.value[index];
  const newContent = editingContent.value.trim();

  try {
    const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages/${msg.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: newContent }),
    });

    const data = await res.json();

    if (!data.success) {
      await dialog.showError(data.error.message || '编辑失败');
      isSavingEdit.value = false;
      return;
    }

    // 取消编辑模式
    editingMessageIndex.value = null;
    editingContent.value = '';

    if (msg.role === 'user') {
      // 用户消息：截断后续并重新生成 AI 回复
      // 浅层响应式：以替换方式更新被编辑消息文本
      const base = chatMessages.value.slice(0, index + 1);
      const target = base[index];
      if (target) {
        const parts = target.parts?.length > 0 ? target.parts : [{ type: 'text', text: '' }];
        base[index] = {
          ...target,
          parts: parts.map(p => p.type === 'text' ? { ...p, text: newContent } : p),
        };
      }
      chatSetMessages(base);
      await generateAIResponse();
    } else {
      await refreshCurrentMessages();
    }

  } catch (err) {
    console.error('Edit message error:', err);
    await dialog.showError('编辑失败，请重试');
  } finally {
    isSavingEdit.value = false;
  }
};

// 生成AI回复（不保存用户消息，用于编辑后重新生成）
// 走 /generate 专用端点（UIMessageStream），手动消费流并合入 chatMessages
const generateAIResponse = async () => {
  if (!currentConversationId.value) return;

  try {
    const response = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/generate`, {
      method: 'POST',
      headers: { 'Accept': 'text/event-stream' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 新 assistant 消息（本地构建，结束后由 refreshCurrentMessages 对齐服务端 ID）
    const localId = 'regen-' + Date.now();
    let newText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const chunk = JSON.parse(line.slice(6));
          if (chunk.type === 'text-delta' && chunk.delta) {
            newText += chunk.delta;
            scrollToBottom();
          } else if (chunk.type === 'error') {
            throw new Error(formatAIError(chunk.errorText || chunk.message));
          }
        } catch (parseError) {
          if (parseError.message && !parseError.message.includes('JSON')) {
            throw parseError;
          }
          console.warn('Parse SSE data error:', parseError, 'Raw:', line);
        }
      }
    }

    if (newText) {
      // 浅层响应式：以整体赋值方式追加消息
      chatSetMessages([
        ...chatMessages.value,
        {
          id: localId,
          role: 'assistant',
          parts: [{ type: 'text', text: newText }],
          metadata: {},
        },
      ]);
    }

    // 与服务端对齐（获取真实消息 ID 与 metadata）
    await refreshCurrentMessages();

  } catch (err) {
    console.error('Generate AI response error:', err);
    await dialog.showError(err.message || '生成回复失败');
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

// ============================================
// 账号管理
// ============================================
const openAccountModal = () => {
  showUserMenu.value = false;
  newUsername.value = user.value?.username || '';
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showAccountModal.value = true;
};

const closeAccountModal = () => {
  showAccountModal.value = false;
};

// 处理弹窗外点击关闭（防止拖动选择文本时误触发）
const handleOverlayMouseDown = (e) => {
  // 记录鼠标按下时的目标
  overlayMouseDownTarget.value = e.target;
};

const handleOverlayMouseUp = (e) => {
  // 只有当鼠标按下和松开都在 overlay 上时才关闭
  if (overlayMouseDownTarget.value === e.target && e.target.classList.contains('account-modal-overlay')) {
    closeAccountModal();
    closeSettingsModal();
  }
  overlayMouseDownTarget.value = null;
};

// ============================================
// 通用设置
// ============================================
const openSettingsModal = async () => {
  showUserMenu.value = false;
  // 加载用户设置
  await loadUserSettings();
  showSettingsModal.value = true;
};

const closeSettingsModal = () => {
  showSettingsModal.value = false;
};

const loadUserSettings = async () => {
  try {
    const res = await fetchAPI('/api/user/settings');
    const response = await res.json();
    if (response.success && response.data) {
      userSettings.value = {
        theme: response.data.theme || 'auto',
        language: response.data.language || 'zh',
      };
      // 应用主题
      applyTheme(userSettings.value.theme);
    }
  } catch (error) {
    console.error('Load settings error:', error);
  }
};

const applyTheme = (theme) => {
  if (theme === 'dark') {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  } else {
    // auto - 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark.value = prefersDark;
    document.documentElement.classList.toggle('dark', prefersDark);
  }
};

const updateTheme = async (theme) => {
  userSettings.value.theme = theme;
  applyTheme(theme);
  await saveUserSettings();
};

const updateLanguage = async (language) => {
  userSettings.value.language = language;
  await saveUserSettings();
};

const saveUserSettings = async () => {
  try {
    const res = await fetchAPI('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify({
        theme: userSettings.value.theme,
        language: userSettings.value.language,
      }),
    });
    const response = await res.json();
    if (!response.success) {
      dialog.showError('保存设置失败');
    }
  } catch (error) {
    console.error('Save settings error:', error);
    dialog.showError('保存设置失败');
  }
};

const updateUsername = async () => {
  if (!newUsername.value.trim()) {
    dialog.showError('请输入昵称');
    return;
  }

  if (newUsername.value === user.value?.username) {
    dialog.showError('昵称未改变');
    return;
  }

  try {
    const res = await fetchAPI('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        username: newUsername.value.trim(),
      }),
    });
    const response = await res.json();
    if (response.success) {
      user.value.username = newUsername.value.trim();
      localStorage.setItem('auth_user', JSON.stringify(user.value));
      dialog.showSuccess('昵称修改成功');
    } else {
      dialog.showError(response?.error?.message || '修改失败');
    }
  } catch (error) {
    console.error('Update username error:', error);
    dialog.showError('修改失败');
  }
};

const updatePassword = async () => {
  if (!oldPassword.value) {
    dialog.showError('请输入原密码');
    return;
  }

  if (!newPassword.value) {
    dialog.showError('请输入新密码');
    return;
  }

  if (newPassword.value.length < 6) {
    dialog.showError('新密码至少6位');
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    dialog.showError('两次密码不一致');
    return;
  }

  try {
    const res = await fetchAPI('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
      }),
    });
    const response = await res.json();
    if (response.success) {
      oldPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      dialog.showSuccess('密码修改成功');
    } else {
      dialog.showError(response?.error?.message || '修改失败');
    }
  } catch (error) {
    console.error('Update password error:', error);
    dialog.showError('修改失败');
  }
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

// 图片预览
const previewImageUrl = ref('');
const showImagePreview = ref(false);

const previewImage = (url) => {
  previewImageUrl.value = url;
  showImagePreview.value = true;
};

const closeImagePreview = () => {
  showImagePreview.value = false;
  previewImageUrl.value = '';
};

// 文档预览
const showDocPreview = ref(false);
const previewDocUrl = ref('');
const previewDocName = ref('');
const previewDocFile = ref(null);
const docPreviewLoading = ref(false);
const docPreviewError = ref('');
const docTextContent = ref('');
const excelContainer = ref(null);
const wordContainer = ref(null);
const pdfContainer = ref(null);
const mdContainer = ref(null);

// 等待容器可用的辅助函数
const waitForContainer = async (containerRef, maxWait = 2000) => {
  const startTime = Date.now();
  while (!containerRef.value && Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return containerRef.value;
};

// 预览文档
const previewDocument = async (attachment) => {
  previewDocFile.value = attachment;
  previewDocName.value = attachment.name || '文档';
  previewDocUrl.value = '';
  docPreviewError.value = '';
  docTextContent.value = '';

  const ext = getFileExtension(attachment.name);
  const url = getFileUrl(attachment.url);

  // 先显示弹窗
  showDocPreview.value = true;
  docPreviewLoading.value = true;

  // 等待弹窗 DOM 渲染
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    if (ext === 'pdf') {
      await previewPDF(url);
    } else if (['xlsx', 'xls'].includes(ext)) {
      await previewExcel(url);
    } else if (ext === 'docx') {
      await previewWord(url);
    } else if (ext === 'md') {
      await previewMarkdown(url);
    } else if (ext === 'txt') {
      const response = await fetch(url);
      docTextContent.value = await response.text();
      docPreviewLoading.value = false;
    } else {
      docPreviewLoading.value = false;
    }
  } catch (error) {
    console.error('Document preview error:', error);
    docPreviewError.value = '预览加载失败: ' + error.message;
    docPreviewLoading.value = false;
  }
};

// PDF 预览
const previewPDF = async (url) => {
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // 关闭 loading，让容器渲染出来
    docPreviewLoading.value = false;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = await waitForContainer(pdfContainer);
    if (!container) {
      throw new Error('容器初始化失败');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    container.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 1.2;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.display = 'block';
      canvas.style.margin = '10px auto';
      canvas.style.maxWidth = '100%';
      canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

      await page.render({ canvasContext: context, viewport }).promise;
      container.appendChild(canvas);
    }
  } catch (error) {
    console.error('PDF preview error:', error);
    docPreviewError.value = 'PDF 预览失败: ' + error.message;
  }
};

// Excel 预览
const previewExcel = async (url) => {
  try {
    await loadScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');

    if (!window.XLSX) {
      throw new Error('SheetJS 库加载失败');
    }

    // 关闭 loading，让容器渲染出来
    docPreviewLoading.value = false;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = await waitForContainer(excelContainer);
    if (!container) {
      throw new Error('容器初始化失败');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });

    container.innerHTML = '';

    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const html = window.XLSX.utils.sheet_to_html(sheet, { editable: false });

      const sheetDiv = document.createElement('div');
      sheetDiv.className = 'excel-sheet';
      if (index > 0) sheetDiv.style.marginTop = '20px';

      const sheetTitle = document.createElement('h4');
      sheetTitle.className = 'sheet-title';
      sheetTitle.textContent = sheetName;
      sheetDiv.appendChild(sheetTitle);

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      tableWrapper.innerHTML = html;
      sheetDiv.appendChild(tableWrapper);

      container.appendChild(sheetDiv);
    });
  } catch (error) {
    console.error('Excel preview error:', error);
    docPreviewError.value = 'Excel 预览失败: ' + error.message;
  }
};

// Word 预览
const previewWord = async (url) => {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');

    if (!window.mammoth) {
      throw new Error('mammoth 库加载失败');
    }

    // 关闭 loading，让容器渲染出来
    docPreviewLoading.value = false;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = await waitForContainer(wordContainer);
    if (!container) {
      throw new Error('容器初始化失败');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer });

    container.innerHTML = result.value || '<p style="color: #8e8e93; text-align: center;">文档内容为空</p>';
  } catch (error) {
    console.error('Word preview error:', error);
    docPreviewError.value = 'Word 预览失败: ' + error.message;
  }
};

// Markdown 预览
const previewMarkdown = async (url) => {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js');

    if (!window.marked) {
      throw new Error('marked 库加载失败');
    }

    // 关闭 loading，让容器渲染出来
    docPreviewLoading.value = false;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = await waitForContainer(mdContainer);
    if (!container) {
      throw new Error('容器初始化失败');
    }

    const response = await fetch(url);
    const markdownText = await response.text();

    window.marked.setOptions({ breaks: true, gfm: true });
    container.innerHTML = window.marked.parse(markdownText);
  } catch (error) {
    console.error('Markdown preview error:', error);
    docPreviewError.value = 'Markdown 预览失败: ' + error.message;
  }
};

// 动态加载 JS 脚本
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
    document.head.appendChild(script);
  });
};

// 关闭文档预览
const closeDocPreview = () => {
  showDocPreview.value = false;
  previewDocUrl.value = '';
  previewDocName.value = '';
  previewDocFile.value = null;
  docPreviewLoading.value = false;
  docPreviewError.value = '';
  docTextContent.value = '';
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
  right: 12px;
  left: auto;
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 1001;
  min-width: 120px;
  padding: 4px 0;
}

.dark .user-menu {
  background: #2a2b32;
  border-color: rgba(255, 255, 255, 0.08);
}

.user-menu .menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.user-menu .menu-item:hover {
  background: #f5f5f7;
}

.dark .user-menu .menu-item {
  color: #ffffff;
}

.dark .user-menu .menu-item:hover {
  background: #3a3b41;
}

.user-menu .menu-item.logout {
  color: #ff3b30;
}

.dark .user-menu .menu-item.logout {
  color: #ff6b6b;
}

.user-menu .menu-item svg {
  flex-shrink: 0;
}

.user-menu .menu-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 4px 0;
}

.dark .user-menu .menu-divider {
  background: #3a3b41;
}

.user-menu .menu-quota {
  padding: 12px 14px;
}

.user-menu .quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-menu .quota-label {
  font-size: 11px;
  color: #8e8e93;
}

.dark .user-menu .quota-label {
  color: #98989d;
}

.user-menu .quota-percent {
  font-size: 11px;
  color: #8e8e93;
  font-weight: 500;
}

.dark .user-menu .quota-percent {
  color: #98989d;
}

.user-menu .quota-bar {
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.dark .user-menu .quota-bar {
  background: #3a3b41;
}

.user-menu .quota-used {
  height: 100%;
  background: linear-gradient(90deg, #34c759 0%, #30d158 100%);
  border-radius: 3px;
  transition: width 0.3s;
}

.user-menu .quota-used.full {
  background: linear-gradient(90deg, #ff9500 0%, #ff3b30 100%);
}

.user-menu .quota-info {
  font-size: 11px;
  color: #8e8e93;
}

.dark .user-menu .quota-info {
  color: #98989d;
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

/* Account Modal Styles */
.account-modal-overlay {
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

.account-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dark .account-modal {
  background: #2a2b32;
}

.account-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.dark .account-modal-header {
  border-bottom-color: #3a3b41;
}

.account-modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.dark .account-modal-header h3 {
  color: #ffffff;
}

.account-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6e6e80;
  transition: background 0.2s;
}

.account-modal-close:hover {
  background: #f4f4f4;
}

.dark .account-modal-close:hover {
  background: #3a3b41;
}

.account-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.account-section {
  margin-bottom: 28px;
}

.account-section:last-child {
  margin-bottom: 0;
}

.account-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #6e6e80;
  margin: 0 0 16px 0;
}

.dark .account-section h4 {
  color: #8e8e93;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  background: #ffffff;
  color: #1a1a1a;
}

.account-input:focus {
  border-color: #007aff;
}

.dark .account-input {
  background: #1a1b20;
  border-color: #3a3b41;
  color: #ffffff;
}

.dark .account-input:focus {
  border-color: #007aff;
}

.account-btn {
  width: 100%;
  height: 44px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.account-btn:hover:not(:disabled) {
  background: #0051d4;
}

.account-btn:disabled {
  background: #c7c7c7;
  cursor: not-allowed;
}

.dark .account-btn:disabled {
  background: #3a3b41;
}

.settings-options {
  display: flex;
  gap: 12px;
}

.settings-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-option:hover {
  border-color: #007aff;
  background: #f8faff;
}

.settings-option.active {
  border-color: #007aff;
  background: #eff6ff;
}

.dark .settings-option {
  background: #1a1b20;
  border-color: #3a3b41;
}

.dark .settings-option:hover {
  border-color: #007aff;
  background: #1c3a5e;
}

.dark .settings-option.active {
  border-color: #007aff;
  background: #1c3a5e;
}

.settings-option span {
  font-size: 14px;
  color: #1a1a1a;
}

.dark .settings-option span {
  color: #ffffff;
}

.user-menu-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6e6e80;
  flex-shrink: 0;
}

.menu-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 8px 0;
}

.dark .menu-divider {
  background: #3a3b41;
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

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e5e5e5;
  position: relative;
}

.dark .sidebar-footer {
  border-top-color: #3a3b41;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-user:hover {
  background: #f4f4f4;
}

.dark .sidebar-user:hover {
  background: #3a3b41;
}

.sidebar-user .user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007aff 0%, #0051d4 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.sidebar-user .user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-user .user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .sidebar-user .user-name {
  color: #ffffff;
}

.sidebar-user .user-email {
  font-size: 12px;
  color: #6e6e80;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================
   Input Area - Modern Design
   ============================================ */
.input-area {
  padding: 12px 16px 16px;
  background: transparent;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

/* File Preview */
.file-preview-area {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.file-preview-item {
  position: relative;
  display: flex;
  align-items: center;
}

/* 图片预览样式 */
.file-preview-image-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.file-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.file-preview-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.file-remove-btn.image-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.2s;
}

.file-preview-image-wrapper:hover .file-remove-btn.image-remove {
  opacity: 1;
}

.file-remove-btn.image-remove:hover {
  background: rgba(255, 60, 60, 0.9);
  transform: scale(1.1);
}

.dark .file-preview-image-wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* 文档预览样式 */
.file-preview-document {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: #f5f5f7;
  cursor: pointer;
  transition: all 0.2s;
}

.file-preview-document:hover {
  background: #ebebef;
}

.dark .file-preview-document {
  background: #3a3b41;
}

.dark .file-preview-document:hover {
  background: #4a4b51;
}

.file-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #8e8e93;
}

.file-icon.pdf {
  background: linear-gradient(135deg, #ff5252 0%, #ff1744 100%);
}

.file-icon.word {
  background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
}

.file-icon.excel {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
}

.file-icon.txt {
  background: linear-gradient(135deg, #78909c 0%, #546e7a 100%);
}

.file-icon.md {
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
}

.file-icon.default {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
}

.icon-label {
  font-size: 12px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  text-align: center;
}

.file-preview-document .file-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  opacity: 0;
}

.file-preview-document:hover .file-remove-btn {
  opacity: 1;
}

.file-preview-document .file-remove-btn:hover {
  background: #ff3b30;
  transform: scale(1.1);
}

.file-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.file-remove-btn:hover {
  background: #ff3b30;
}

/* Input Main Container */
.input-main {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid #e5e5e5;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-main:focus-within {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.dark .input-main {
  background: #2a2b32;
  border-color: #3a3b41;
}

.dark .input-main:focus-within {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

/* Button Groups */
.input-left-btns,
.input-right-btns {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* Input Field */
.input-field-wrapper {
  flex: 1;
  min-width: 0;
}

.input-textarea {
  width: 100%;
  padding: 6px 0;
  border: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.5;
  color: #1a1a1a;
  resize: none;
  outline: none;
  font-family: inherit;
}

.input-textarea::placeholder {
  color: #8e8e93;
}

.dark .input-textarea {
  color: #ffffff;
}

/* Action Buttons */
.upload-btn-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.upload-btn-wrapper:hover .upload-hint {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.upload-hint {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(-5px);
  margin-left: 8px;
  padding: 6px 10px;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 11px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 100;
}

.upload-hint::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: #1a1a1a;
}

.dark .upload-hint {
  background: #ffffff;
  color: #1a1a1a;
}

.dark .upload-hint::before {
  border-right-color: #ffffff;
}

.input-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  transition: all 0.2s;
}

.input-action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a1a;
}

.input-action-btn.active {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
}

.dark .input-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dark .input-action-btn.active {
  background: rgba(0, 122, 255, 0.2);
}

/* Send Button */
.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #007aff;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #0051d4;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #d1d1d6;
  cursor: not-allowed;
  transform: none;
}

.send-btn.stop {
  background: #ff3b30;
}

.send-btn.stop:hover {
  background: #d63029;
}

.dark .send-btn:disabled {
  background: #48484a;
}

/* Workflow Selector */
.workflow-selector {
  position: relative;
}

.workflow-menu {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  width: 280px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e5e5;
  overflow: hidden;
  z-index: 100;
}

.dark .workflow-menu {
  background: #2a2b32;
  border-color: #3a3b41;
}

.workflow-menu-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  border-bottom: 1px solid #e5e5e5;
}

.dark .workflow-menu-header {
  border-bottom-color: #3a3b41;
}

.workflow-menu-list {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.workflow-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.workflow-option:hover {
  background: #f5f5f7;
}

.workflow-option.active {
  background: rgba(0, 122, 255, 0.1);
}

.workflow-option.cancel {
  border-top: 1px solid #e5e5e5;
  margin-top: 8px;
  padding-top: 16px;
}

.workflow-option.cancel .workflow-icon {
  background: #ff3b30;
  color: white;
}

.workflow-option.cancel .workflow-name {
  color: #ff3b30;
}

.dark .workflow-option.cancel {
  border-top-color: #3a3b41;
}

.dark .workflow-option:hover {
  background: #3a3b41;
}

.dark .workflow-option.active {
  background: rgba(0, 122, 255, 0.2);
}

.workflow-icon {
  width: 36px;
  height: 36px;
  background: #f5f5f7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  color: #007aff;
}

.dark .workflow-icon {
  background: #3a3b41;
}

.workflow-info {
  flex: 1;
  min-width: 0;
}

.workflow-option .workflow-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.dark .workflow-option .workflow-name {
  color: #ffffff;
}

.workflow-option .workflow-desc {
  display: block;
  font-size: 12px;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mode Hints */
.mode-hints {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-left: 4px;
}

.mode-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.mode-hint.workflow {
  background: rgba(16, 163, 127, 0.1);
  color: #10a37f;
}

.dark .mode-hint {
  background: rgba(0, 122, 255, 0.15);
}

.dark .mode-hint.workflow {
  background: rgba(16, 163, 127, 0.15);
}

.hint-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

/* Workflow Menu Transition */
.workflow-menu-enter-active,
.workflow-menu-leave-active {
  transition: all 0.2s ease;
}

.workflow-menu-enter-from,
.workflow-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Mode Hint Transition */
.mode-hint-enter-active,
.mode-hint-leave-active {
  transition: all 0.2s ease;
}

.mode-hint-enter-from,
.mode-hint-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .input-area {
    padding: 8px 12px 12px;
  }

  .input-main {
    padding: 6px 10px;
    border-radius: 20px;
  }

  .input-action-btn,
  .send-btn {
    width: 32px;
    height: 32px;
  }

  .input-textarea {
    font-size: 16px; /* Prevent iOS zoom */
  }

  .workflow-menu {
    position: fixed;
    bottom: 80px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 60vh;
  }

  .file-preview-area {
    padding-bottom: 4px;
  }

  .file-preview-image {
    width: 48px;
    height: 48px;
  }
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

/* 错误文本样式 */
.error-text {
  color: #ff3b30;
  font-size: 14px;
}

.dark .error-text {
  color: #ff6b6b;
}

/* 编辑按钮禁用状态 */
.edit-action-btn.save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 重新生成按钮禁用状态 */
.message-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 继续生成按钮特殊样式 */
.message-action-btn.continue-btn {
  color: #10a37f;
  border-color: rgba(16, 163, 127, 0.3);
}

.message-action-btn.continue-btn:hover:not(:disabled) {
  background: rgba(16, 163, 127, 0.1);
  border-color: rgba(16, 163, 127, 0.5);
}

/* Message Attachments - 图片附件样式 */
.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.message-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  object-fit: cover;
}

.message-image:hover {
  transform: scale(1.02);
}

/* Message Generated Images - 文生图生成图片样式 */
.message-generated-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.generated-image-item {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f5f5f7;
}

.dark .generated-image-item {
  border-color: rgba(255, 255, 255, 0.1);
  background: #3a3b41;
}

.generated-image {
  display: block;
  max-width: 320px;
  max-height: 320px;
  width: auto;
  height: auto;
  cursor: pointer;
  transition: transform 0.2s;
  object-fit: contain;
}

.generated-image:hover {
  transform: scale(1.02);
}

.generated-image-actions {
  display: flex;
  justify-content: flex-end;
  padding: 6px 8px;
}

.generated-image-download {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  text-decoration: none;
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.generated-image-download:hover {
  color: var(--primary-color, #007aff);
  background: rgba(0, 122, 255, 0.08);
}

.dark .generated-image-download {
  color: #aaa;
}

.dark .generated-image-download:hover {
  color: #5ac8fa;
  background: rgba(90, 200, 250, 0.1);
}

/* Message Document - 文档附件样式 */
.message-document {
  display: inline-flex;
  align-items: center;
  padding: 6px 8px 6px 12px;
  background: #f5f5f7;
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.dark .message-document {
  background: #3a3b41;
}

.message-document:hover {
  background: #ebebef;
  border-color: rgba(0, 0, 0, 0.08);
}

.dark .message-document:hover {
  background: #4a4b51;
  border-color: rgba(255, 255, 255, 0.1);
}

.message-document .document-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.message-document .document-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007aff;
}

.message-document .document-name {
  font-size: 13px;
  color: #1a1a1a;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .message-document .document-name {
  color: #ffffff;
}

.message-document .document-download-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6e6e80;
  transition: all 0.2s;
  margin-left: 4px;
}

.message-document .document-download-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1a1a;
}

.dark .message-document .document-download-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Image Preview Modal */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.image-preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.image-preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.image-preview-img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Document Preview Modal */
.doc-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.doc-preview-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dark .doc-preview-container {
  background: #2a2b32;
}

.doc-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.dark .doc-preview-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.doc-preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.dark .doc-preview-title {
  color: #ffffff;
}

.doc-preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #6e6e80;
  transition: all 0.2s;
}

.doc-action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a1a;
}

.dark .doc-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.doc-preview-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  min-height: 300px;
}

/* PDF 预览 */
.pdf-preview {
  overflow: auto;
  max-height: calc(90vh - 150px);
  background: #525659;
  border-radius: 8px;
  padding: 20px;
}

.pdf-preview canvas {
  display: block;
  margin: 10px auto;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* Markdown 预览 */
.md-preview {
  font-size: 14px;
  line-height: 1.8;
  color: #1a1a1a;
  max-height: calc(90vh - 150px);
  overflow: auto;
}

.dark .md-preview {
  color: #cdd6f4;
}

.md-preview h1,
.md-preview h2,
.md-preview h3,
.md-preview h4,
.md-preview h5,
.md-preview h6 {
  margin: 24px 0 16px;
  font-weight: 600;
  line-height: 1.4;
}

.md-preview h1 { font-size: 28px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
.md-preview h2 { font-size: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
.md-preview h3 { font-size: 20px; }
.md-preview h4 { font-size: 16px; }

.dark .md-preview h1,
.dark .md-preview h2 {
  border-color: #3a3a3c;
}

.md-preview p {
  margin: 12px 0;
}

.md-preview ul,
.md-preview ol {
  margin: 12px 0;
  padding-left: 24px;
}

.md-preview li {
  margin: 4px 0;
}

.md-preview code {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: #f5f5f7;
  padding: 2px 6px;
  border-radius: 4px;
}

.dark .md-preview code {
  background: #3a3b41;
}

.md-preview pre {
  margin: 16px 0;
  padding: 16px;
  background: #f6f8fa;
  border-radius: 8px;
  overflow-x: auto;
}

.dark .md-preview pre {
  background: #1e1e2e;
}

.md-preview pre code {
  background: transparent;
  padding: 0;
}

.md-preview blockquote {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #007aff;
  background: #f5f5f7;
  border-radius: 0 8px 8px 0;
}

.dark .md-preview blockquote {
  background: #3a3b41;
}

.md-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.md-preview th,
.md-preview td {
  padding: 10px 14px;
  border: 1px solid #e5e5e5;
  text-align: left;
}

.dark .md-preview th,
.dark .md-preview td {
  border-color: #3a3a3c;
}

.md-preview th {
  background: #f5f5f7;
  font-weight: 600;
}

.dark .md-preview th {
  background: #3a3b41;
}

.md-preview a {
  color: #007aff;
  text-decoration: none;
}

.md-preview a:hover {
  text-decoration: underline;
}

.md-preview img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

.md-preview hr {
  border: none;
  height: 1px;
  background: #e5e5e5;
  margin: 24px 0;
}

.dark .md-preview hr {
  background: #3a3a3c;
}

/* 文本预览 */
.text-preview {
  margin: 0;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1a1a1a;
  max-height: calc(90vh - 150px);
  overflow: auto;
}

.dark .text-preview {
  background: #1e1e2e;
  color: #cdd6f4;
}

/* Excel 预览 */
.excel-preview {
  overflow: auto;
}

.excel-sheet {
  margin-bottom: 16px;
}

.sheet-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #f5f5f7;
  border-radius: 6px;
}

.dark .sheet-title {
  background: #3a3b41;
  color: #ffffff;
}

.excel-preview .table-wrapper {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
}

.dark .excel-preview .table-wrapper {
  border-color: #3a3a3c;
}

.excel-preview table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.excel-preview th,
.excel-preview td {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  text-align: left;
  white-space: nowrap;
}

.dark .excel-preview th,
.dark .excel-preview td {
  border-color: #3a3a3c;
}

.excel-preview th {
  background: #f5f5f7;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.dark .excel-preview th {
  background: #3a3b41;
}

.excel-preview tr:nth-child(even) td {
  background: #fafafa;
}

.dark .excel-preview tr:nth-child(even) td {
  background: #2e2f36;
}

/* Word 预览 */
.word-preview {
  font-size: 14px;
  line-height: 1.8;
  color: #1a1a1a;
}

.dark .word-preview {
  color: #cdd6f4;
}

.word-preview h1,
.word-preview h2,
.word-preview h3,
.word-preview h4,
.word-preview h5,
.word-preview h6 {
  margin: 16px 0 8px;
  font-weight: 600;
}

.word-preview p {
  margin: 8px 0;
}

.word-preview ul,
.word-preview ol {
  margin: 8px 0;
  padding-left: 24px;
}

.word-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.word-preview table th,
.word-preview table td {
  border: 1px solid #e5e5e5;
  padding: 8px;
}

.dark .word-preview table th,
.dark .word-preview table td {
  border-color: #3a3a3c;
}

/* 加载状态 */
.doc-preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: #6e6e80;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e5e5;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dark .loading-spinner {
  border-color: #3a3a3c;
  border-top-color: #007aff;
}

/* 错误状态 */
.doc-preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 12px;
  color: #6e6e80;
  text-align: center;
}

.doc-preview-error svg {
  color: #ff6b6b;
}

.doc-preview-error p {
  margin: 0;
}

/* 不支持预览 */
.doc-preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 12px;
  color: #6e6e80;
  text-align: center;
}

.doc-preview-unsupported svg {
  opacity: 0.5;
}

.doc-preview-unsupported p {
  margin: 0;
}

/* 下载按钮 */
.btn-download {
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.btn-download:hover {
  background: #0056cc;
}
</style>