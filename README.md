# Flirt Wingman 撩妹助手

WhatsApp 风格的 AI 聊天助手，帮你分析对话上下文，生成高情商回复选项。

## 功能

- **多会话管理** — 同时和多人聊天，左侧边栏切换
- **AI 对话分析** — 自动分析语气、兴趣度、情绪状态、关系阶段、潜台词
- **智能回复生成** — 为每条未回复消息生成 2-3 个回复选项
- **回复引用** — 支持右键菜单、悬浮图标、右滑三种方式引用特定消息
- **引用气泡** — 已发送消息显示引用的原始消息
- **性别切换** — 支持男生/女生视角，AI 会调整风格
- **中英文切换** — 每个会话独立语言设置
- **用户风格检测** — 自动分析你的打字风格，AI 模仿你的语气
- **本地运行** — 使用 Ollama + Qwen 2.5 7B，完全离线

## 前置要求

1. 安装 [Ollama](https://ollama.ai)
2. 下载 Qwen 模型：
```bash
ollama pull qwen2.5:7b
```

## 安装

```bash
git clone https://github.com/yourusername/flirt-wingman.git
cd flirt-wingman
npm install
npm run dev
```

访问 http://localhost:3000

## 使用方法

1. 确保 Ollama 正在运行（`ollama serve`）
2. 创建新会话
3. 点击「+ 她的消息」添加对方消息
4. 点击「+ 我的消息」添加你的消息
5. 点击「分析对话并生成回复」
6. 选择喜欢的回复，或手动输入

### 回复引用

- **悬浮图标** — 鼠标悬停在消息上，点击回复箭头
- **右键菜单** — 右键点击消息，选择「回复」
- **右滑** — 在消息上向右滑动（触屏设备）

### 回复 AI 选项

AI 为每条未回复的消息生成单独的回复选项，显示在输入框上方。点击即可使用。

## 技术栈

- Next.js 16
- React
- Tailwind CSS v4
- TypeScript
- Ollama (本地 LLM)
- Qwen 2.5 7B

## 项目结构

```
flirt-wingman/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # AI 分析 + 回复生成
│   │   └── regenerate/route.ts # 重新生成回复
│   └── page.tsx                # 主页面
├── components/
│   ├── ChatInput.tsx           # 聊天输入 + 消息显示
│   ├── LanguageSwitch.tsx      # 语言切换
│   └── SessionList.tsx         # 会话列表
├── lib/
│   ├── agent.ts                # AI prompt 构建 + 解析
│   ├── i18n.ts                 # 国际化翻译
│   ├── storage.ts              # localStorage 持久化
│   └── userStyle.ts            # 用户风格检测
└── types/
    └── index.ts                # TypeScript 类型定义
```

## 许可证

MIT
