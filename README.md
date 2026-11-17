# AI Chat Web

AI Chat 平台的用户端，基于 React 18、TypeScript、Rspack 2 和 Zustand。浏览器通过 JWT 和 REST/SSE 调用 [Worker API](../worker/README.md)，不是 Nuxt 应用，也不是浏览器直连 DeepSeek 的无后端示例。

父目录 [README](../README.md) 和 [部署指南](../DEPLOYMENT.md) 保留了早期 Nuxt 方案；本项目的技术栈、命令、产物和接口以当前源码及本文为准。

## 职责与功能

- 邮箱注册、登录、账户信息、修改密码及额度查看；生产登录接入 Turnstile。
- 会话创建、自动标题、重命名、删除和历史读取。
- 流式回答、深度思考、停止、重新生成、编辑提问及同父消息版本切换。
- 图片和文档附件上传；根据 Worker 路由结果显示文本、思考内容或生成图片。
- Markdown、代码高亮、KaTeX 公式、Mermaid 图表，以及中英文、明暗主题和移动端布局。
- 公开分享页 `/share/:code`，展示服务端当前选中的消息路径。

模型选择由后端智能路由与模型配置决定。原版 chat-demo 的浏览器直连 API Key、语音服务、智能搜索、ZIP 历史导入导出等，不能仅因保留了部分文案或依赖就视为当前已接入能力。文件能上传也不等于其中的 PDF、Office 等内容都能被自动解析。

## 架构与数据流

```text
React 页面 / 组件
  → Zustand 会话、分支、生成状态
  → services/api：Bearer JWT + REST / UIMessageStream SSE
  → Worker：鉴权、额度、消息树、模型路由
      ├─ Workers AI：文本、视觉与生图
      ├─ D1：会话、消息、分支、分享
      ├─ KV：额度与配置缓存
      └─ R2：附件与生成图片
```

- 会话正文和分支以服务端 D1 为持久化来源，不再使用原版 IndexedDB 作为聊天历史数据库。
- localStorage 保存登录 Token 和本机偏好；IndexedDB 仅缓存附件原件。清理浏览器存储不等于删除服务端会话或 R2 文件。
- 上传内容会发送给 Worker，相关内容可能进入模型上下文。当前文件下载链接是公开读取接口，不应上传凭据或依赖链接本身保护机密文件。

### 消息版本与继续生成

| 操作 | REST 语义 |
| --- | --- |
| 发送 / 编辑后发送 | `POST .../messages` 新建一条 user 和一条 assistant，保留旧版本及其子树 |
| 重新生成 | `POST .../generate` 为指定 user 新建 assistant 版本，不重复插入 user |
| 继续生成 | `POST .../continue` 续写原 assistant，保持消息 ID 和原模型，不创建新的提问 |
| 切换版本 | `PATCH .../branch` 保存当前选择，刷新后恢复 |

`messages.metadata.branch` 中的 `parentId`、`selectedChildId`、`selectedRoot` 保存树结构与选择，不需要为本次分支功能修改数据库 schema。旧线性消息仍可读取；历史版本若早已被旧逻辑删除，不能凭本次改造恢复。

每轮请求使用独立的 `generation_id`；停止后的可见文本保存与续写通过该标识隔离，防止迟到的旧请求覆盖新一轮。发生冲突时应刷新核对服务端内容，而不是反复重发写请求。

### 流式完成与中断

- 前端按字节解析 SSE，保留 `stop`、`length`、`error` 的区别；没有正常结束帧的断流不能冒充成功。
- 前端网络空闲超时为 **2 分钟**，收到数据后重新计时，不是整次生成的时长上限；等待 SSE 响应头也最多 2 分钟，收到响应头即取消这一计时器。
- 普通 REST 请求（含停止保存、切换分支）等待响应最多 **30 秒**；保存失败保留独立重试记录，不会无限占用生成状态。分支保存失败时，已提交的问题保留在本次页面内存中，可通过“重试保存”重试；刷新前应先处理未保存提示。
- 页面隐藏或异常断流时直接合并积压输出，不等待逐字动画，避免浏览器后台定时器节流拖延收尾。
- Worker 文本流使用 **90 秒上游空闲超时**，显式设置 `keepAliveMs: 15000`；心跳不能代替上游真实输出，也不能解除模型输出长度限制。
- 正常完成不显示“继续生成”；达到长度上限、暂停或异常且已有可续写文本时，允许用户继续。空回复、生成图片不按文本续写处理。
- 最大输出仍受后端 `model_configs.max_output_tokens` 等生成参数控制。服务端先持久化再发送完成帧；客户端不会为断流盲目自动重试，以免重复输出。

## 目录

```text
web/
├─ src/
│  ├─ main.tsx / login-main.tsx / share-main.tsx  三个页面入口
│  ├─ app/                 布局、主题、全局样式
│  ├─ pages/               登录页和公开分享页
│  ├─ components/          输入框、消息、分支切换、设置、Markdown
│  ├─ services/
│  │  ├─ api/              JWT 请求封装、SSE 解析、协议类型
│  │  ├─ chat/             状态、消息树、回复归并、REST 持久层
│  │  ├─ markdown/         Markdown、代码、公式和图表处理
│  │  └─ attachments.ts    附件校验及上传队列
│  └─ i18n/                中英文文案
├─ public/_redirects       Cloudflare Pages 静态路径重写
├─ rspack.config.ts        入口、API 构建注入、本地代理
├─ edgeone.json            EdgeOne 构建及路径重写
├─ chat.test.mjs           聊天与流式协议回归测试
└─ dist/                   构建产物，不是源码
```

## 环境变量与安全

| 名称 | 安全示例 | 用途 |
| --- | --- | --- |
| `API_ORIGIN` | `https://api.example.com` | 构建时注入的 Worker origin，不带 `/api` 和末尾斜杠 |
| `NODE_ENV` | `production` | `npm run build` 自动设置，切换生产构建 |

`API_ORIGIN` 默认空字符串，表示同源 `/api/...`。开发服务器会代理到 `http://127.0.0.1:8790`；生产静态托管不会自动提供这一代理。生产必须注入可访问的 API origin，或由托管层另行提供真正的 `/api` 反向代理。

Rspack 当前读取进程环境变量，没有主动加载 `.env` 的逻辑；不要只创建 `.env` 就假定配置已生效。变量进入浏览器产物，是公开信息。不要向前端注入 `JWT_SECRET`、`TURNSTILE_SECRET`、Cloudflare Token 或其他服务端凭据。Turnstile 公开 site key 位于登录页实现中，迁移域名时应检查其允许域名，不要把后端 secret 当作 site key。

## 本地运行

建议 Node.js **22.23+ 或 24 LTS**，配套 npm。以下命令在 `web/` 目录执行，环境变量写法适用于 Git Bash / POSIX shell。

```bash
npm ci
npm run dev
```

先按 Worker README 准备独立的本地数据库、绑定和开发变量，并在另一终端启动 `worker` 的 `npm run dev`。然后访问 <http://localhost:8090>。`/login` 与 `/share/:code` 由开发中间件分别指向对应 HTML。

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按锁文件安装依赖 |
| `npm run dev` | Rspack 开发服务器，端口 8090 |
| `npm run type` | TypeScript 检查 |
| `npm run lint` | oxlint 检查 |
| `npm run build` | 清理并生成 `dist/` |
| `node --test chat.test.mjs` | 聊天状态与协议回归测试 |

本项目没有 `npm run generate` 或 Nuxt 的 `.output/public` 产物。

## 构建与 Git 集成部署

```bash
API_ORIGIN=https://api.example.com npm run build
```

产物为 `dist/index.html`、`dist/login.html`、`dist/share.html` 和 `dist/static/`。应通过 HTTP(S) 静态托管访问，不沿用原版“双击 HTML 即可使用”的部署方式。

### EdgeOne Pages

- 独立 web 仓库的构建根目录为仓库根；若以父目录组织托管项目，根目录选 `web`。
- 可复现安装建议 `npm ci`，构建命令 `npm run build`，输出目录 `dist`，构建环境设置 `API_ORIGIN`。
- 现有 `edgeone.json` 使用 `npm install`、内联指定 API 地址的构建命令，并固定 `nodeVersion: 22.11.0`。该版本低于本文建议；接入或排障时要核对控制台与文件的实际优先级。内联赋值可能覆盖控制台中的同名变量，不能假定只改控制台即可切换 API。
- 保留 `/login`、`/login/` → `/login.html`，`/share/*` → `/share.html`，其余页面 → `/index.html` 的重写；静态资源必须按真实文件提供，不能返回 HTML。

### 其他静态托管

Cloudflare Pages 可发布同一 `dist/`，`public/_redirects` 会随构建复制进去。其他平台需配置等价重写。所有平台均需允许流式响应通过 API 链路，避免代理缓冲 SSE。

当前 web 仓库没有自带 GitHub Actions 工作流。GitHub 推送触发自动部署可以由 EdgeOne / Pages 控制台的 Git 集成提供；仓库内没有工作流不代表外部集成未配置。请核对连接的仓库、生产分支、构建根目录、Node 版本、变量及部署日志。克隆仓库本身不会自动建立这些关联；修改构建变量后需要重新构建发布。

## API 概览

除标记为公开的接口外，使用 `Authorization: Bearer <USER_JWT>`。占位符应替换为当前测试用户的短期 Token，禁止写入文档或提交到仓库。

| 接口 | 用途 |
| --- | --- |
| `POST /api/auth/register`、`POST /api/auth/login` | 注册、登录，生产携带 Turnstile 响应 |
| `GET /api/user/profile`、`GET /api/user/quota` | 账户与额度 |
| `PUT /api/user/password` | 修改密码 |
| `GET /api/chat/conversations`、`POST /api/chat/conversations` | 会话列表、创建 |
| `PATCH /api/chat/conversations/:id`、`DELETE /api/chat/conversations/:id` | 重命名、删除 |
| `GET /api/chat/conversations/:id/messages` | 读取所有消息版本与元数据 |
| `POST /api/chat/conversations/:id/messages` | 新建提问与回复，返回 SSE |
| `POST /api/chat/conversations/:id/generate` | 为指定 user 新建回复版本，返回 SSE |
| `POST /api/chat/conversations/:id/continue` | 续写指定 assistant，返回 SSE |
| `PATCH /api/chat/conversations/:id/branch` | `{ "message_id": "<MESSAGE_ID>" }` 保存选择 |
| `POST /api/chat/conversations/:id/replies/:messageId/save` | 保存停止时的可见文本，携带 `generation_id` |
| `POST /api/files/upload` | multipart 表单字段 `file` |
| `POST /api/share` | 创建或延长分享 |
| `GET /api/share/:code`、`GET /api/config/public` | 公开分享、公开显示配置 |

详细请求字段以 `src/services/api/client.ts`、`src/services/chat/db.ts` 和 Worker 路由为准。

## 常见故障

| 现象 | 检查方向 |
| --- | --- |
| `/api` 返回 HTML、404 或网络错误 | 检查 Worker 8790 是否启动、构建 API origin、CORS；静态 fallback 不是 API 代理 |
| 登录失败或反复跳转 | 检查 Token、浏览器存储、账户禁用状态、Turnstile 允许域名及后端环境；401/403 会清理用户端登录状态 |
| `/share/:code` 刷新白屏、chunk 报 MIME 错误 | 检查分享页重写与 `/static/` 资源；Rspack 使用根 `publicPath: '/'` |
| 一直等待或长回答被截断 | 查看 SSE `Content-Type`、心跳、代理缓冲、finish reason 和模型输出上限；不要直接无限增加超时或自动重发 |
| 停止后刷新文本不一致 / 续写 409 | 核对停止保存是否成功、`generation_id` 是否过期；刷新服务端状态后再操作 |
| 切换版本后历史丢失 | 核对 Web / Worker 协议版本和 branch 保存请求；旧逻辑已经删除的历史无法恢复 |
| 上传失败或模型读不到文档 | 单文件上限 10 MiB，前端每轮最多 20 个；检查扩展名、R2、文本提取与模型能力，勿将上传成功等同于解析成功 |

## 验证方法

先运行 `npm run type`、`npm run lint`、`node --test chat.test.mjs` 和 `npm run build`，再在隔离测试环境检查：

1. 登录后新建会话；普通回答正常结束且不显示继续按钮。
2. 编辑旧提问、重新生成多版回复；切换同父版本、刷新和重新登录后，选择及各自后续对话仍保留。
3. 暂停已有文本的回答，刷新后继续；assistant ID 不变、前缀不重复，旧请求不能覆盖续写结果。
4. 用受控测试模拟长度上限、异常断流、空流和长时间无数据；部分文本保留，有文本才允许继续。
5. 连续输出超过 90 秒但不空闲的长代码回答，不应仅因总时长被中止；代码、思考块和 finish reason 应完整。
6. 上传图片 / 文本附件，检查历史与分享显示；未选中分支不出现在公开分享里。
7. 对构建产物直接访问并刷新 `/login`、`/share/:code`，确认脚本和样式没有被重写成 HTML。

这些是验证步骤，不代表已完成线上验证；本地单元测试也不覆盖真实 Workers AI、网络代理或托管配置。

## 来源与关联项目

界面基于 [DeepSeek chat-demo](https://github.com/deepseek-ai/chat-demo) 改造，仓库地址取自原版 README。原版采用 MIT 许可证，分发衍生代码时应保留上游版权和许可证声明；第三方依赖遵循各自许可证。

- [Worker](../worker/README.md)：鉴权、存储、生成与管理 API。
- [Admin](../admin/README.md)：模型、路由、用户、额度和分享管理。
