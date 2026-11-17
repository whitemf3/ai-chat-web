import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@rspack/cli'
import { rspack, type Configuration } from '@rspack/core'

const dev = process.env.NODE_ENV !== 'production'
const targets = ['chrome >= 105', 'edge >= 105', 'safari >= 16', 'firefox >= 110']
const root = path.dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string }

// 后端 API 地址：环境变量 API_ORIGIN（构建时注入完整域名，如 edgeone.json / Pages 配置）。
// 未注入时留空 = 前端走同源相对路径（本地 dev 由 devServer proxy 转发到 wrangler dev）。
const apiOrigin = process.env.API_ORIGIN ?? ''

const cssLoader = {
  loader: 'builtin:lightningcss-loader',
  options: { targets },
}

type ConfigOptions = {
  /** 公开 API 的地址，注入为 __API_ORIGIN__ */
  apiOrigin?: string
  /** 开发服务器配置，支持本地接口代理 */
  devServer?: Configuration['devServer']
}

/** 创建构建配置，支持自定义 API 地址和开发服务器选项 */
export const createConfig = ({
  apiOrigin: origin = apiOrigin,
  devServer,
}: ConfigOptions = {}): Configuration => ({
  mode: dev ? 'development' : 'production',
  entry: {
    main: './src/main.tsx',
    login: './src/login-main.tsx',
    share: './src/share-main.tsx',
  },
  output: {
    path: path.resolve(root, 'dist'),
    // 显式根路径：publicPath 'auto' 在 /share/:code 等深路径页面上
    // 会把异步 chunk 解析到 /share/static/... 导致 404/HTML 错误加载
    publicPath: '/',
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/async/[name].[contenthash:8].js',
    cssFilename: 'static/css/[name].[contenthash:8].css',
    cssChunkFilename: 'static/css/async/[name].[contenthash:8].css',
    assetModuleFilename: 'static/media/[name].[contenthash:8][ext]',
    clean: true,
  },
  devtool: dev ? 'cheap-module-source-map' : false,
  // 开发模式预编译异步模块，保持首次加载代码高亮和公式时的页面状态
  lazyCompilation: false,
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    // 将 .js 导入路径解析到同名 .ts、.tsx 或 .js 文件
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
  },
  module: {
    // CSS Modules 使用默认导出：`import styles from './x.module.css'`
    parser: { 'css/module': { namedExports: false } },
    generator: { 'css/module': { localIdentName: '[local]-[hash:6]' } },
    rules: [
      { test: /\.module\.css$/, type: 'css/module', use: [cssLoader] },
      { test: /\.css$/, exclude: /\.module\.css$/, type: 'css', use: [cssLoader] },
      {
        test: /\.(j|t)sx?$/,
        exclude: /[\\/]node_modules[\\/]/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic', development: dev } },
            externalHelpers: true,
          },
          env: { targets },
        },
        type: 'javascript/auto',
      },
      { test: /\.(woff2?|ttf)$/, type: 'asset/resource' },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/index.html',
      scriptLoading: 'defer',
      // 仅注入 main 入口（默认会带上全部入口导致 login 入口同页执行，
      // 其 token 检查会整页重定向 → 无限刷新）
      chunks: ['main'],
      meta: { 'application-version': version },
    }),
    new rspack.HtmlRspackPlugin({
      template: './src/login.html',
      filename: 'login.html',
      scriptLoading: 'defer',
      chunks: ['login'],
      meta: { 'application-version': version },
    }),
    new rspack.HtmlRspackPlugin({
      template: './src/share.html',
      filename: 'share.html',
      scriptLoading: 'defer',
      chunks: ['share'],
      meta: { 'application-version': version },
    }),
    new rspack.DefinePlugin({ __API_ORIGIN__: JSON.stringify(origin) }),
    // Cloudflare Pages 静态资源：_redirects（/login 别名与 SPA fallback）
    new rspack.CopyRspackPlugin({
      patterns: [{ from: path.resolve(root, 'public'), to: '' }],
    }),
  ],
  performance: { hints: false },
  devServer: {
    port: 8090,
    // 本地开发代理：后端 wrangler dev 运行在 8790
    proxy: [
      {
        context: '/api',
        target: 'http://127.0.0.1:8790',
        changeOrigin: true,
      },
    ],
    // SPA 路径改写（historyApiFallback 的 rewrite 语义在 rspack 下不稳定，
    // 用前置中间件显式改写 /login 与 /share/:code）
    setupMiddlewares: (middlewares, server) => {
      server.app?.use(
        (req: { url?: string }, _res: unknown, next: () => void) => {
          const url = req.url ?? ''
          if (/^\/login\/?$/.test(url)) {
            req.url = '/login.html'
          } else if (/^\/share\/.+/.test(url)) {
            req.url = '/share.html'
          }
          next()
        }
      )
      return middlewares
    },
    ...devServer,
  },
})

// eslint-disable-next-line import/no-default-export
export default defineConfig(createConfig())
