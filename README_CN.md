# Wingman 撩妹助手

> 你的 crush 发了个 "k"。你慌了。Wingman 分析氛围，读懂言外之意，帮你生成真正有效的回复。支持男女视角，中英文双语，100% 本地运行。无云端，无数据泄露，无尬聊。只有更好的对话。

[English](README.md)

## 什么是 Wingman？

Wingman 是一个 WhatsApp 风格的 AI 聊天助手，帮你打造更好的回复。它分析对话上下文，检测情绪和关系动态，然后生成自然、符合语境的回复选项——全部在你的电脑上本地运行。

**核心理念：**
- 🔒 **隐私优先** — 一切通过 Ollama 本地运行，你的对话永远不会离开你的设备。
- 🎯 **语境感知** — AI 理解语气、兴趣度、情绪状态和关系阶段。
- 💬 **多会话** — 同时和多人聊天，每个会话独立分析。
- 🌍 **双语支持** — 完整的中英文支持，每个会话可独立设置语言。

## 演示

![Wingman Demo](screenshots/demo.png)

> 📸 **想看看实际效果？** 上图展示了 Wingman 分析对话并生成上下文相关回复的过程。

## 功能

| 功能 | 描述 |
|------|------|
| **AI 分析** | 自动检测语气、兴趣度、情绪状态、关系阶段和潜台词 |
| **智能回复** | 为每条未回复消息生成 2-3 个符合语境的回复选项 |
| **回复引用** | 通过右键菜单、悬浮图标或滑动引用特定消息 |
| **多会话** | 管理多个对话，每个有独立分析 |
| **性别切换** | 在男性/女性视角间切换，AI 相应调整风格 |
| **用户风格检测** | 分析你的打字模式，AI 模仿你的语气 |
| **中英文** | 完整的双语支持，每个会话可独立设置语言 |
| **社交资料** | 获取 Instagram 个人资料，让 AI 了解对方风格——分析简介获取沟通方式、兴趣和性格特征 |

## 🆕 新功能

### 社交资料上下文

获取公开 Instagram 个人资料，为 AI 提供聊天的对方画像：

| 功能 | 描述 |
|------|------|
| **一键获取** | 粘贴 Instagram 链接 → 自动提取昵称和简介 |
| **自动分析** | 保存资料后 → AI 分析简介，提取沟通风格、兴趣和性格特征 |
| **会话独立** | 每个会话拥有独立的资料配置 |
| **Ego lite** | 使用你真实的登录浏览器会话，可靠访问 Instagram |
| **可编辑** | 昵称和简介可在保存前手动修改 |

资料数据会注入 AI prompt，帮助 Wingman 根据对方风格量身定制回复。

### 截图上传识别

上传 WhatsApp 聊天截图，自动识别并提取消息内容：

| 功能 | 描述 |
|------|------|
| **一键上传** | 点击输入框旁的相机图标上传截图 |
| **OCR 识别** | 使用 PaddleOCR 精确提取中英文文本 |
| **智能分段** | 自动将长截图分段处理，确保完整提取 |
| **边距填充** | 添加边距处理，识别边缘文字 |
| **发送者识别** | 根据消息位置自动判断发送方（左/右） |
| **回复链接** | 自动识别回复模式（"You replied to…" / "对方回复了你"），匹配引用文本并添加回复引用条 |
| **历史消息匹配** | 将引用文本与现有聊天记录匹配，实现准确的回复链接 |
| **批量确认** | 弹窗预览所有识别结果，可选择性添加 |
| **中英文支持** | 支持中文和英文聊天截图 |

**使用方法：**
1. 点击输入框旁的📷相机图标，**或** 直接将图片拖拽到聊天区域
2. 选择 WhatsApp 聊天截图
3. 等待 OCR 识别（约 30 秒）
4. 预览识别结果，选择要添加的消息
5. 点击「添加选中」或「添加全部」

## 快速开始

```bash
git clone https://github.com/ZienACCA/Wingman.git
cd Wingman
./setup.sh
```

一条命令搞定一切：安装 Ollama，安装 PaddleOCR，下载模型，启动应用，打开浏览器。

### 安装脚本会做什么：

1. ✅ 检查 Python3、pip3 和 Ollama（自动安装 Ollama）
2. ✅ 启动 Ollama 服务
3. ✅ 下载 Qwen 2.5 7B 模型（~4.7GB）
4. ✅ 安装 PaddleOCR Python 依赖（用于截图识别）
5. ✅ 安装 npm 依赖
6. ✅ 打开 http://localhost:3000

## 手动安装

```bash
git clone https://github.com/ZienACCA/Wingman.git
cd Wingman
npm install
npm run dev
```

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.ai) 已安装并运行
- [Python3](https://python.org) + PaddleOCR（用于截图识别）
- [ego lite](https://ego.app) — 浏览器自动化，用于获取 Instagram 资料（推荐但非必需）

```bash
pip install paddlepaddle paddleocr
```

## 工作原理

### 1. 添加消息

粘贴或输入你的聊天对话。添加双方的消息：
- **她的消息** — 对方说了什么
- **我的消息** — 你说了什么（或想说什么）

### 2. 分析

点击「分析对话并生成回复」。Wingman 会：
- 解析对话流程
- 检测情绪和兴趣度
- 识别关系阶段
- 生成符合语境的回复选项

### 3. 回复

从 AI 生成的选项中选择，或自己输入。每条未回复消息都有独立的建议。

### 截图上传

1. 点击输入框旁的📷相机图标
2. 选择 WhatsApp 聊天截图
3. 等待 OCR 识别（约 30 秒）
4. 预览识别结果，选择要添加的消息
5. 点击「添加选中」或「添加全部」

### 回复引用

在回复中引用特定消息：
- **悬浮** — 鼠标悬停时点击回复图标
- **右键** — 从上下文菜单选择「回复」
- **滑动** — 在触屏设备上向右滑动

## 架构

```
wingman/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI 分析 + 回复生成
│   │   ├── ocr/route.ts           # 截图 OCR 识别
│   │   ├── profile/
│   │   │   ├── analyze/route.ts   # 资料分析（基于 Qwen）
│   │   │   └── fetch/route.ts     # Instagram 资料获取
│   │   └── regenerate/route.ts    # 重新生成回复
│   └── page.tsx                   # 主页面
├── components/
│   ├── ChatInput.tsx              # 聊天 UI + 回复支持
│   ├── LanguageSwitch.tsx         # 语言切换
│   ├── ScreenshotReviewModal.tsx  # 截图预览弹窗
│   ├── SessionList.tsx            # 会话侧边栏
│   └── SocialProfilePanel.tsx     # 资料获取 + 分析 UI
├── lib/
│   ├── agent.ts                   # AI prompt 工程 + 解析
│   ├── ego-browser.ts             # ego lite CLI 集成
│   ├── i18n.ts                    # 国际化
│   ├── storage.ts                 # LocalStorage 持久化
│   └── userStyle.ts               # 用户打字风格检测
├── scripts/
│   └── ocr.py                     # PaddleOCR 文本提取
├── setup.sh                       # 一键安装脚本
└── types/
    └── index.ts                   # TypeScript 类型定义
```

## 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 框架 + API 路由 |
| [Tailwind CSS v4](https://tailwindcss.com/) | WhatsApp 风格深色主题 |
| [Ollama](https://ollama.ai) | 本地 LLM 运行时 |
| [Qwen 2.5 7B](https://ollama.ai/library/qwen2.5) | 分析 + 回复的语言模型 |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 截图文本识别 |
| [ego lite](https://ego.app) | 浏览器自动化，用于获取 Instagram 资料 |
| TypeScript | 类型安全 |

## AI Prompt

Wingman 使用精心设计的 prompt：
- 将聊天分为「上下文」和「需要回复」两部分
- 使用编号消息 ID 精确映射回复
- 包含用户检测到的打字风格
- 强制角色清晰（谁回复谁）
- 防止常见 AI 错误（角色混淆、消息错乱）

完整 prompt 工程见 `lib/agent.ts`。

## 许可证

MIT 许可证 - 详情见 [LICENSE](LICENSE)。

---

<p align="center">
  用 ❤️ 为更好的对话而做
</p>
