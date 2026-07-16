import { Language } from '@/types'

const translations = {
  zh: {
    title: '撩妹助手',
    subtitle: 'AI 帮你聊天',
    placeholder: '粘贴聊天记录到这里...',
    analyze: '生成回复',
    analyzing: '分析中...',
    selectReply: '选择一个回复：',
    copied: '已复制 ✓',
    copy: '复制',
    history: '历史记录',
    noHistory: '暂无历史记录',
  },
  en: {
    title: 'Flirt Wingman',
    subtitle: 'AI Chat Assistant',
    placeholder: 'Paste chat here...',
    analyze: 'Generate Reply',
    analyzing: 'Analyzing...',
    selectReply: 'Pick a reply:',
    copied: 'Copied ✓',
    copy: 'Copy',
    history: 'History',
    noHistory: 'No history yet',
  },
}

export function t(lang: Language, key: keyof typeof translations.zh): string {
  return translations[lang][key] || translations.en[key]
}
