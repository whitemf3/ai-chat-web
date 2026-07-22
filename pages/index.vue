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
                      @click="downloadFile(attachment)"
                    >
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
                      <svg class="document-download" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                  <!-- AI 消息内容为空时显示思考动画或错误 -->
                  <div v-if="msg.role === 'assistant' && !msg.content" class="thinking-indicator">
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

// Top Alert
const copyAlertVisible = ref(false);
const copyAlertKey = ref(0);

// Chat State
const conversations = ref([]);
const currentConversationId = ref(null);
const messages = ref([]);
const inputMessage = ref('');
const isStreaming = ref(false);
const messagesContainer = ref(null);
const inputArea = ref(null);
const abortController = ref(null);
const editingMessageIndex = ref(null);
const editingContent = ref('');
const isSavingEdit = ref(false);
const isRegenerating = ref(false);
const stoppedMessages = ref(new Set());
const currentStreamingMessageId = ref(null);
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
      body: JSON.stringify({ title: '新对话' }),
    });
    const data = await res.json();
    if (data.success) {
      currentConversationId.value = data.data.id;
      window.location.hash = data.data.id;
      messages.value = [];
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
      messages.value = data.data;

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
        messages.value = [];
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

  // 准备附件
  const attachments = uploadedFiles.value.map(f => ({
    type: f.type,
    url: f.url,
    name: f.name,
    content: f.content, // 文档文件的文本内容
  }));

  // 清空已上传文件
  uploadedFiles.value = [];

  // 创建临时用户消息 ID
  const tempUserMsgId = Date.now();
  messages.value.push({
    id: tempUserMsgId,
    role: 'user',
    content: userMessage,
    created_at: new Date().toISOString(),
    metadata: attachments.length > 0 ? { attachments } : undefined,
  });

  scrollToBottom();
  isStreaming.value = true;

  // 创建临时的 AI 消息用于显示思考状态
  const tempAiMsgId = `temp-${Date.now()}`;
  messages.value.push({
    id: tempAiMsgId,
    role: 'assistant',
    content: '',
    created_at: new Date().toISOString(),
  });
  currentStreamingMessageId.value = tempAiMsgId;

  // 创建 AbortController
  abortController.value = new AbortController();

  try {
    const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message: userMessage,
        stream: true,
        deep_think: deepThink.value,
        attachments: attachments,
        workflow_id: selectedWorkflow.value?.id || null,
      }),
      signal: abortController.value.signal,
    });

    // 检查 HTTP 响应状态
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `请求失败 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let realMessageCreated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'start') {
              // 收到 start 事件，更新消息的真实 ID
              // 1. 更新用户消息 ID
              if (data.user_message_id) {
                const userMsgIndex = messages.value.findIndex(m => m.id === tempUserMsgId);
                if (userMsgIndex !== -1) {
                  messages.value[userMsgIndex].id = data.user_message_id;
                }
              }
              // 2. 更新 AI 消息 ID
              if (data.message_id) {
                const aiMsgIndex = messages.value.findIndex(m => m.id === tempAiMsgId);
                if (aiMsgIndex !== -1) {
                  messages.value[aiMsgIndex].id = data.message_id;
                  currentStreamingMessageId.value = data.message_id;
                }
              }
              realMessageCreated = true;
            } else if (data.type === 'chunk') {
              // 找到当前正在流式传输的消息并追加内容
              const msgIndex = messages.value.findIndex(m => m.id === currentStreamingMessageId.value);
              if (msgIndex !== -1) {
                messages.value[msgIndex].content += data.content;
                scrollToBottom();
              }
            } else if (data.type === 'error') {
              // AI 生成错误
              throw new Error(formatAIError(data.message));
            } else if (data.type === 'done') {
              // 生成完成
              stoppedMessages.value.delete(currentStreamingMessageId.value);
              currentStreamingMessageId.value = null;
            }
          } catch (parseError) {
            // JSON 解析错误，可能是数据不完整
            console.warn('Parse SSE data error:', parseError, 'Raw:', line);
            // 继续处理其他行，不中断
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
    // 删除临时消息（用户消息和 AI 消息）
    // 注意：如果收到过 start 事件，消息 ID 已更新为真实 ID，需要查找真实位置
    if (err.name === 'AbortError') {
      // 用户主动取消
      console.log('Generation stopped by user');
      // 如果已经收到 start 事件，消息已保存到数据库，不删除
      // 如果还没收到 start 事件，需要删除临时消息
      if (!realMessageCreated) {
        // 删除临时用户消息
        const userMsgIndex = messages.value.findIndex(m => m.id === tempUserMsgId);
        if (userMsgIndex !== -1) {
          messages.value.splice(userMsgIndex, 1);
        }
        // 删除临时 AI 消息
        const aiMsgIndex = messages.value.findIndex(m => m.id === tempAiMsgId);
        if (aiMsgIndex !== -1) {
          messages.value.splice(aiMsgIndex, 1);
        }
      }
    } else {
      // 其他错误，删除消息并提示
      const userMsgIndex = messages.value.findIndex(m => m.id === tempUserMsgId || m.role === 'user' && messages.value.indexOf(m) === messages.value.length - 2);
      if (userMsgIndex !== -1) {
        messages.value.splice(userMsgIndex, 1);
      }

      const aiMsgIndex = messages.value.findIndex(m => m.id === tempAiMsgId || m.role === 'assistant' && messages.value.indexOf(m) === messages.value.length - 1);
      if (aiMsgIndex !== -1) {
        messages.value.splice(aiMsgIndex, 1);
      }

      console.error('Send message error:', err);
      await dialog.showError(err.message || '发送失败，请重试');
    }
    currentStreamingMessageId.value = null;
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
const stopGeneration = async () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }

  // 保存部分生成的内容并标记为已停止
  if (currentStreamingMessageId.value && messages.value.length > 0) {
    const lastMsgIndex = messages.value.length - 1;
    const lastMsg = messages.value[lastMsgIndex];

    if (lastMsg.role === 'assistant' && lastMsg.content && currentStreamingMessageId.value === lastMsg.id) {
      try {
        // 调用后端保存部分内容
        const res = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/messages/${currentStreamingMessageId.value}/partial`, {
          method: 'POST',
          body: JSON.stringify({ content: lastMsg.content }),
        });

        const data = await res.json();
        if (data.success) {
          // 标记为已停止，显示"继续生成"按钮
          stoppedMessages.value.add(currentStreamingMessageId.value);
        }
      } catch (err) {
        console.error('Save partial message error:', err);
      }
    }
  }

  isStreaming.value = false;
  currentStreamingMessageId.value = null;
};

// 继续生成
const continueGeneration = async (messageIndex) => {
  if (isContinuing.value) return;

  const msg = messages.value[messageIndex];
  if (!msg || msg.role !== 'assistant') return;

  isContinuing.value = true;

  try {
    const response = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/continue`, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message_id: msg.id,
        existing_content: msg.content,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              messages.value[messageIndex].content += data.content;
              scrollToBottom();
            } else if (data.type === 'error') {
              // AI 生成错误
              throw new Error(formatAIError(data.message));
            } else if (data.type === 'done') {
              // 从停止集合中移除
              stoppedMessages.value.delete(msg.id);
            }
          } catch (parseError) {
            // JSON 解析错误或业务错误
            if (parseError.message && !parseError.message.includes('JSON')) {
              // 业务错误（来自 error 类型），向上抛出
              throw parseError;
            }
            // JSON 解析错误，记录日志继续处理
            console.warn('Parse SSE data error:', parseError, 'Raw:', line);
          }
        }
      }
    }

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
  // 提取更友好的错误信息
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
    // 先关闭旧弹窗
    if (copyAlertVisible.value) {
      copyAlertVisible.value = false;
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    // 显示新弹窗
    copyAlertKey.value++;
    copyAlertVisible.value = true;
  } catch (err) {
    console.error('Copy error:', err);
    await dialog.showError('复制失败');
  }
};

// 重新生成
const regenerateMessage = async (messageIndex) => {
  // 防止重复点击
  if (isStreaming.value || isRegenerating.value) return;

  // 找到用户消息（AI 回复的前一条）
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
    // 如果 AI 消息是临时 ID 或空内容（表示失败的消息），跳过后端删除
    const isTempMessage = aiMsg.id.toString().startsWith('temp-');
    const isEmptyMessage = !aiMsg.content;

    if (!isTempMessage && !isEmptyMessage) {
      // 调用后端 API 删除该 AI 回复及之后的所有消息
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

    // 删除本地消息（从该 AI 回复开始到末尾）
    messages.value.splice(messageIndex);

    // 使用 generateAIResponse 重新生成（不重复保存用户消息）
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
  // 防止重复点击
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

  // 调用后端API更新消息
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

    // 更新本地消息内容
    // 注意：metadata 已在数据库中保留，前端本地消息也已有 metadata（附件信息）
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
      await generateAIResponse();
    }

  } catch (err) {
    console.error('Edit message error:', err);
    await dialog.showError('编辑失败，请重试');
  } finally {
    isSavingEdit.value = false;
  }
};

// 生成AI回复（不保存用户消息）
const generateAIResponse = async () => {
  if (!currentConversationId.value) return;

  isStreaming.value = true;
  currentStreamingMessageId.value = null;

  // 不再预先创建临时消息，等收到 start 事件后再创建
  const tempAiMsgId = `temp-regen-${Date.now()}`;

  try {
    // 使用 /generate 接口，只生成AI回复，不保存用户消息
    const response = await fetchAPI(`/api/chat/conversations/${currentConversationId.value}/generate`, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        stream: true,
      }),
    });

    // 检查 HTTP 响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let messageCreated = false;

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
              // 收到 start 事件后才创建消息
              const realMessageId = data.message_id;
              messages.value.push({
                id: realMessageId,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString(),
              });
              currentStreamingMessageId.value = realMessageId;
              messageCreated = true;
            } else if (data.type === 'chunk') {
              // 找到当前消息并追加内容
              if (currentStreamingMessageId.value) {
                const aiMsgIndex = messages.value.findIndex(m => m.id === currentStreamingMessageId.value);
                if (aiMsgIndex !== -1) {
                  messages.value[aiMsgIndex].content += data.content;
                  scrollToBottom();
                }
              }
            } else if (data.type === 'error') {
              // AI 生成错误
              throw new Error(formatAIError(data.message));
            } else if (data.type === 'done') {
              // 生成完成
              stoppedMessages.value.delete(currentStreamingMessageId.value);
              currentStreamingMessageId.value = null;
            }
          } catch (parseError) {
            // JSON 解析错误或业务错误
            if (parseError.message && !parseError.message.includes('JSON')) {
              // 业务错误（来自 error 类型），向上抛出
              throw parseError;
            }
            // JSON 解析错误，记录日志继续处理
            console.warn('Parse SSE data error:', parseError, 'Raw:', line);
          }
        }
      }
    }

  } catch (err) {
    // 删除临时 AI 消息（如果已创建）
    if (currentStreamingMessageId.value) {
      const aiMsgIndex = messages.value.findIndex(m => m.id === currentStreamingMessageId.value);
      if (aiMsgIndex !== -1) {
        messages.value.splice(aiMsgIndex, 1);
      }
    }
    currentStreamingMessageId.value = null;

    console.error('Generate AI response error:', err);
    await dialog.showError(err.message || '生成回复失败');
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

/* Message Document - 文档附件样式 */
.message-document {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f7;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.dark .message-document {
  background: #3a3b41;
}

.message-document:hover {
  background: #ebebef;
}

.dark .message-document:hover {
  background: #4a4b51;
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
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .message-document .document-name {
  color: #ffffff;
}

.message-document .document-download {
  flex-shrink: 0;
  opacity: 0.5;
  color: #6e6e80;
  transition: opacity 0.2s;
}

.message-document:hover .document-download {
  opacity: 1;
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
</style>