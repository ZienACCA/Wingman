import { Gender, Language } from '@/types'

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
    delete: '删除',
    empty: '空',
    qr: 'QR',
    addHerMsg: '她说 💬',
    addMyMsg: '我说 💬',
    addHimMsg: '他说 💬',
    vibe_smooth: '撩',
    vibe_smooth_desc: '自信有魅力',
    vibe_funny: '逗',
    vibe_funny_desc: '幽默有梗',
    vibe_bold: '冲',
    vibe_bold_desc: '直接大方',
    vibe_sweet: '暖',
    vibe_sweet_desc: '走心细腻',
    vibe_cool: '酷',
    vibe_cool_desc: '淡定从容',
    emptyChat: '点击下方按钮添加聊天记录',
    clearAll: '清空',
    analyzeHint: '请先添加聊天记录并选择风格',
    herLabel: '她',
    myLabel: '我',
    newSession: '新对话',
    sessionPlaceholder: '给对方起个名字...',
    genderMale: '我是男生',
    genderFemale: '我是女生',
    noReplies: '还没有生成回复',
    analysisTitle: '分析结果',
    tone: '语气',
    interest: '兴趣',
    emotion: '情绪',
    stage: '阶段',
    subtext: '潜台词',
    attachment: '依恋',
    pattern: '冷热',
    boundary: '边界',
    style: '风格',
    reply: '回复',
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
    delete: 'Delete',
    empty: 'Empty',
    qr: 'QR',
    addHerMsg: 'Her 💬',
    addMyMsg: 'Me 💬',
    addHimMsg: 'Him 💬',
    vibe_smooth: 'Smooth',
    vibe_smooth_desc: 'Confident charm',
    vibe_funny: 'Funny',
    vibe_funny_desc: 'Witty & fun',
    vibe_bold: 'Bold',
    vibe_bold_desc: 'Direct & confident',
    vibe_sweet: 'Sweet',
    vibe_sweet_desc: 'Thoughtful & warm',
    vibe_cool: 'Cool',
    vibe_cool_desc: 'Laid-back & chill',
    emptyChat: 'Tap below to add messages',
    clearAll: 'Clear',
    analyzeHint: 'Add messages and pick a vibe first',
    herLabel: 'Her',
    myLabel: 'Me',
    newSession: 'New Chat',
    sessionPlaceholder: 'Name this person...',
    genderMale: "I'm Male",
    genderFemale: "I'm Female",
    noReplies: 'No replies yet',
    analysisTitle: 'Analysis',
    tone: 'Tone',
    interest: 'Interest',
    emotion: 'Emotion',
    stage: 'Stage',
    subtext: 'Subtext',
    attachment: 'Attachment',
    pattern: 'Hot/Cold',
    boundary: 'Boundary',
    style: 'Style',
    reply: 'Reply',
  },
}

export function t(lang: Language, key: keyof typeof translations.zh): string {
  return translations[lang][key] || translations.en[key]
}

const ANALYSIS_TRANSLATIONS: Record<Language, Record<string, string>> = {
  zh: {
    playful: '调皮', serious: '认真', dry: '冷淡', warm: '热情', cold: '冷漠',
    high: '高', medium: '中', low: '低',
    strangers: '陌生人', acquaintances: '认识', flirting: '暧昧', dating: '约会中',
    excited: '兴奋', happy: '开心', sad: '难过', angry: '生气', bored: '无聊',
    confused: '困惑', tired: '累了', shy: '害羞', annoyed: '烦', neutral: '平静',
    relaxed: '放松', anxious: '焦虑', nervous: '紧张', confident: '自信',
    secure: '安全型', 'secure-anxious': '安全焦虑型', avoidant: '回避型', uncertain: '不确定型',
    consistent: '稳定', 'hot-then-cold': '先热后冷', 'cold-then-hot': '先冷后热', chaotic: '混乱',
    loose: '随意', moderate: '适中', strict: '严格', evasive: '回避',
    'short': '短', 'short to medium': '短到中', 'medium to long': '中到长', 'long': '长',
    catchphrases: '口头禅', emojiHabits: 'emoji习惯', messageLength: '消息长度', toneParticles: '语气词',
  },
  en: {
    playful: 'playful', serious: 'serious', dry: 'dry', warm: 'warm', cold: 'cold',
    high: 'high', medium: 'medium', low: 'low',
    strangers: 'strangers', acquaintances: 'acquaintances', flirting: 'flirting', dating: 'dating',
    excited: 'excited', happy: 'happy', sad: 'sad', angry: 'angry', bored: 'bored',
    confused: 'confused', tired: 'tired', shy: 'shy', annoyed: 'annoyed', neutral: 'neutral',
    relaxed: 'relaxed', anxious: 'anxious', nervous: 'nervous', confident: 'confident',
    secure: 'secure', 'secure-anxious': 'secure-anxious', avoidant: 'avoidant', uncertain: 'uncertain',
    consistent: 'consistent', 'hot-then-cold': 'hot-then-cold', 'cold-then-hot': 'cold-then-hot', chaotic: 'chaotic',
    loose: 'loose', moderate: 'moderate', strict: 'strict', evasive: 'evasive',
    'short': 'short', 'short to medium': 'short to medium', 'medium to long': 'medium to long', 'long': 'long',
    catchphrases: 'catchphrases', emojiHabits: 'emoji habits', messageLength: 'msg length', toneParticles: 'tone particles',
  },
}

export function translateAnalysis(lang: Language, value: string): string {
  const lower = value.toLowerCase().trim()
  return ANALYSIS_TRANSLATIONS[lang][lower] || value
}

export function genderLabel(lang: Language, gender: Gender, type: 'her' | 'my'): string {
  if (type === 'my') return t(lang, 'myLabel')
  return gender === 'male' ? t(lang, 'herLabel') : '他'
}

export function addMsgLabel(lang: Language, gender: Gender, type: 'her' | 'my'): string {
  if (type === 'my') return t(lang, 'addMyMsg')
  return gender === 'male' ? t(lang, 'addHerMsg') : t(lang, 'addHimMsg')
}
