# AI Chat 用户前端

基于 Nuxt 3 + Vue 3 构建的 AI 对话平台前端，支持多模型切换、文件上传、文档预览等功能，部署在 Cloudflare Pages。

## 功能特性

### 核心功能

- **多模型支持** - 支持多种 AI 模型，智能模型选择
- **流式响应** - 实时显示 AI 回复，打字机效果
- **对话管理** - 创建、重命名、删除对话
- **消息编辑** - 编辑历史消息并重新生成回复
- **深度思考** - 开启深度思考模式获得更详细回复

### 文件处理

- **图片上传** - 支持图片上传，AI 自动识别内容
- **文档上传** - 支持 PDF、Word、Excel、Markdown、TXT 等格式
- **文档预览** - 在线预览文档内容（PDF.js、SheetJS、mammoth.js）
- **文件下载** - 一键下载上传的文档

### 分享功能

- **对话分享** - 创建分享链接，分享对话内容
- **公开访问** - 无需登录即可查看分享的对话

### 用户体验

- **深色模式** - 自动跟随系统，支持手动切换
- **响应式设计** - 适配桌面和移动设备
- **本地存储** - 对话自动保存，刷新不丢失
- **Markdown 渲染** - 支持代码高亮、表格、列表等

## 技术栈

- **框架**: Nuxt 3
- **前端**: Vue 3 + Composition API
- **状态管理**: Pinia
- **Markdown**: markdown-it + highlight.js
- **文档处理**: 
  - PDF.js - PDF 预览
  - SheetJS (xlsx) - Excel 预览
  - mammoth.js - Word 预览
  - marked.js - Markdown 预览
- **部署**: Cloudflare Pages

## 目录结构

```
web/
├── assets/
│   └── css/
│       └── main.css          # 全局样式
├── components/
│   ├── MessageDialog.vue     # 消息确认对话框
│   └── TopAlert.vue          # 顶部通知组件
├── composables/
│   ├── useAuth.ts            # 用户认证
│   └── useDialog.js          # 对话框工具
├── layouts/
│   └── default.vue           # 默认布局
├── pages/
│   ├── index.vue             # 主对话页面
│   ├── login.vue             # 登录/注册页面
│   └── share/
│       └── [code].vue        # 分享链接页面
├── utils/
│   └── ...
├── app.vue                   # 根组件
├── nuxt.config.ts            # Nuxt 配置
└── package.json
```

## 开发指南

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run generate
```

生成的静态文件在 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## 环境配置

### 环境变量

创建 `.env` 文件：

```env
NUXT_PUBLIC_API_BASE=https://your-api.example.com
```

或直接修改 `nuxt.config.ts`：

```typescript
runtimeConfig: {
  public: {
    apiBase: 'https://your-api.example.com',
  },
},
```

## 页面说明

### 首页 (`/`)

主对话界面，包含：

- **左侧边栏** - 对话列表、新建对话、用户设置
- **消息区域** - 对话内容显示，支持滚动加载
- **输入区域** - 消息输入、附件上传、模型选择

### 登录页 (`/login`)

用户认证页面，支持：

- 邮箱注册
- 邮箱登录
- 自动跳转（已登录用户）

### 分享页 (`/share/[code]`)

公开的分享链接页面：

- 无需登录即可访问
- 查看分享的对话内容
- 显示分享信息和创建时间

## API 接口

前端调用 Worker API，主要接口包括：

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 对话

- `GET /api/chat/conversations` - 获取对话列表
- `POST /api/chat/conversations` - 创建新对话
- `PUT /api/chat/conversations/:id` - 更新对话（重命名）
- `DELETE /api/chat/conversations/:id` - 删除对话

### 消息

- `POST /api/chat/conversations/:id/messages` - 发送消息
- `POST /api/chat/conversations/:id/generate` - 继续生成
- `POST /api/chat/conversations/:id/regenerate` - 重新生成
- `PUT /api/chat/conversations/:messageId/messages/:messageId` - 编辑消息
- `DELETE /api/chat/conversations/:messageId/messages/:messageId` - 删除消息

### 文件

- `POST /api/files/upload` - 上传文件
- `GET /api/files/:userId/:filename` - 下载文件

### 分享

- `POST /api/share` - 创建分享
- `GET /api/share/:code` - 获取分享内容

## 部署

### Cloudflare Pages

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 配置构建命令：
   - Build command: `npm run build`
   - Build output directory: `dist`
3. 设置环境变量 `NUXT_PUBLIC_API_BASE`

### 手动部署

```bash
# 构建
npm run generate

# dist 目录内容可直接部署到任何静态托管服务
```

## 使用说明

### 发送消息

1. 在输入框输入内容
2. 可选择添加附件（图片、文档）
3. 点击发送或按 Enter
4. AI 流式返回回复

### 上传文件

1. 点击附件按钮或拖拽文件
2. 支持图片（PNG、JPG、GIF）和文档（PDF、Word、Excel、MD、TXT）
3. 图片会自动识别内容，文档可预览和下载

### 管理对话

- **新建**: 点击侧边栏顶部的"+"按钮
- **重命名**: 点击对话标题，修改后保存
- **删除**: 点击对话旁的删除图标

### 编辑消息

1. 鼠标悬停在用户消息上
2. 点击编辑图标
3. 修改内容后发送
4. AI 会基于新内容重新生成回复

### 分享对话

1. 点击对话旁的分享图标
2. 复制生成的分享链接
3. 其他人可通过链接查看对话

## 权限说明

- 未登录用户只能访问登录页和分享页面
- 登录后可访问所有功能
- 每个用户只能查看和操作自己的对话
- 分享链接为公开访问，无需登录

## 设计风格

- ChatGPT 风格界面设计
- 简洁的对话气泡样式
- 平滑的动画过渡
- 深色模式完美适配

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 注意事项

1. **API 地址**: 确保 `NUXT_PUBLIC_API_BASE` 配置正确
2. **跨域**: API 服务器需配置 CORS 允许前端域名
3. **Token**: 登录后 Token 存储在 localStorage
4. **文件大小**: 单个文件上传限制取决于 API 配置

## 常见问题

### Q: 页面刷新后对话丢失？
A: 检查 localStorage 是否被清理，确保已登录状态。

### Q: 文件上传失败？
A: 检查文件格式和大小，确保 API 服务正常运行。

### Q: AI 回复显示乱码？
A: 可能是编码问题，尝试刷新页面重新发送。

### Q: 深色模式不生效？
A: 检查系统主题设置，或手动切换主题。

## 相关项目

- [worker](../../../ai-chat-worker/) - Cloudflare Workers API 后端
- [admin](../../../ai-chat-wms/) - 后台管理系统

## License

MIT