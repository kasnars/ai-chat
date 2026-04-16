# 🤖 AI Chat

一个基于 Vue3 + Vite 的纯前端 AI 聊天应用，支持流式输出，兼容移动端 H5 和 PC 端 Web。

## ✨ 特性

- 🎨 **现代 UI 设计** - 渐变色彩、流畅动画、响应式布局
- 📱 **全平台兼容** - 完美适配移动端和桌面端
- ⚡ **流式输出** - 实时显示 AI 回复，打字机效果
- 🔒 **本地存储** - API 配置保存在 localStorage，安全隐私
- ⚙️ **灵活配置** - 支持任意 OpenAI 兼容的 API 服务
- 🚀 **零后端** - 纯前端实现，无需服务器

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📋 支持的 API 服务商

- 阿里云百炼 (DashScope)
- OpenAI
- DeepSeek
- Moonshot (月之暗面)
- 其他 OpenAI 兼容的 API 服务

## ⚙️ 配置说明

首次进入应用时会自动弹出设置页面，需要配置：

1. **API 地址** - AI 服务的基础 URL
   - 阿里云百炼：`https://dashscope.aliyuncs.com/api/v1`
   - OpenAI：`https://api.openai.com/v1`
   - DeepSeek：`https://api.deepseek.com/v1`

2. **API Key** - 你的 API 密钥

3. **模型名称** - 使用的 AI 模型
   - 阿里云：`qwen-plus`、`qwen-turbo` 等
   - OpenAI：`gpt-3.5-turbo`、`gpt-4` 等

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **样式**: 原生 CSS + CSS Variables
- **部署**: 可部署到任意静态托管服务

## 📦 部署

### Vercel

```bash
npm run build
# 将 dist 目录部署到 Vercel
```

### Netlify

```bash
npm run build
# 将 dist 目录部署到 Netlify
```

### GitHub Pages

```bash
npm run build
# 使用 gh-pages 或 GitHub Actions 部署
```

### 自有服务器

```bash
npm run build
# 将 dist 目录复制到 Nginx/Apache 的 web 目录
```

## 📝 功能说明

### 聊天功能
- ✅ 发送消息
- ✅ 流式接收 AI 回复
- ✅ 清空对话
- ✅ 消息时间戳
- ✅ 加载状态指示

### 设置功能
- ✅ API 地址配置
- ✅ API Key 配置
- ✅ 模型名称配置
- ✅ 快速选择预设
- ✅ 配置本地持久化

## 🎨 UI 设计

- 渐变紫色主题
- 毛玻璃效果
- 流畅过渡动画
- 移动端优化（防止缩放、触摸友好）
- 暗色模式支持（可扩展）

## 📄 License

MIT

## 🙏 致谢

感谢所有提供 AI API 服务的厂商～
