# Flirt Wingman 撩妹助手

AI 驱动的聊天助手，帮你生成高情商回复。

## 功能

- 粘贴聊天记录，AI 分析对话
- 5 种风格选择：撩、逗、冲、暖、酷
- 生成多个回复选项
- 一键复制 / QR 码传送到手机
- 聊天历史记录
- 双主题切换
- 中英文支持

## 前置要求

1. 安装 [Ollama](https://ollama.ai)
2. 下载 Qwen 模型：
```bash
ollama pull qwen2.5:7b
```

## 安装

```bash
git clone <your-repo>
cd flirt-wingman
npm install
npm run dev
```

访问 http://localhost:3000

## 使用方法

1. 确保 Ollama 正在运行
2. 选择聊天风格
3. 粘贴聊天记录
4. 点击「生成回复」
5. 复制喜欢的回复，或扫描 QR 码到手机
