import { UserStyle, ChatMessage } from '@/types'

const STYLE_KEY = 'flirt-wingman-user-style'

export function loadUserStyle(): UserStyle {
  if (typeof window === 'undefined') return defaultStyle()
  const data = localStorage.getItem(STYLE_KEY)
  if (data) return JSON.parse(data)
  return defaultStyle()
}

export function saveUserStyle(style: UserStyle) {
  localStorage.setItem(STYLE_KEY, JSON.stringify(style))
}

function defaultStyle(): UserStyle {
  return {
    formality: 0.3,
    humor: 0.5,
    directness: 0.5,
    warmth: 0.5,
    emojiUsage: 0.3,
    messageLength: 0.3,
    avgLength: 20,
    sampleMessages: [],
    lastUpdated: Date.now(),
  }
}

const FORMAL_MARKERS = /您|请|谢谢|感谢|不好意思|麻烦|打扰|抱歉|好的呢|嗯嗯/
const CASUAL_MARKERS = /哈哈哈|hhh|lol|lmao|bruh|omg|ngl|tbh|istg|lowkey|highkey|yo|sup|nah|yep|nope|yea|kk|gg|btw|smh|imo|imho|fml|af|ngl|deadass|no cap|fr|bussin|slay|vibe|flex|cap|sus|mid|rent free|main character|periodt|slay|goat|big brain|touch grass|based|cringe| cope | seethe | dilate | ratio | W | L | + | - | cope | kek | pepe | monka | pog | champ | copium | hopium/
const HUMOR_MARKERS = /哈哈哈|hhh|lol|lmao|xswl|hahaha|笑死|😂|🤣|逗|好笑|绝了|离谱|666|草|awsl/
const DIRECT_MARKERS = /好|行|可以|不行|不要|必须|一定|肯定|当然|必须的|没门|算了|随便|无所谓|你来|我来|走|冲|上/
const WARM_MARKERS = /想你|喜欢|爱|心疼|担心|关心|在乎|记得|想你了|晚安|早安|么么|亲|宝贝|亲爱的|乖|心疼你|照顾好自己/
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu

export function analyzeUserStyle(messages: ChatMessage[], currentStyle: UserStyle): { style: UserStyle; sampleMessages: string[] } {
  const myMessages = messages.filter(m => m.role === 'user' && m.text.trim())
  if (myMessages.length === 0) return { style: currentStyle, sampleMessages: [] }

  const texts = myMessages.map(m => m.text.trim())
  const allText = texts.join(' ')

  const avgLen = texts.reduce((sum, t) => sum + t.length, 0) / texts.length

  const formalityScore = (FORMAL_MARKERS.test(allText) ? 0.7 : 0.2) +
    (avgLen > 30 ? 0.2 : avgLen < 10 ? -0.1 : 0)

  const humorScore = (HUMOR_MARKERS.test(allText) ? 0.7 : 0.2) +
    (allText.includes('haha') || allText.includes('hhh') ? 0.3 : 0)

  const directScore = (DIRECT_MARKERS.test(allText) ? 0.6 : 0.3) +
    (texts.some(t => t.length < 5) ? 0.2 : 0)

  const warmScore = (WARM_MARKERS.test(allText) ? 0.7 : 0.3)

  const emojiMatches = allText.match(EMOJI_REGEX)
  const emojiCount = emojiMatches ? emojiMatches.length : 0
  const emojiScore = Math.min(emojiCount / Math.max(texts.length, 1) * 2, 1)

  const lengthScore = Math.min(avgLen / 50, 1)

  const sampleMsgs = texts.slice(-5)

  const newStyle: UserStyle = {
    formality: clamp(formalityScore),
    humor: clamp(humorScore),
    directness: clamp(directScore),
    warmth: clamp(warmScore),
    emojiUsage: clamp(emojiScore),
    messageLength: clamp(lengthScore),
    avgLength: avgLen,
    sampleMessages: [],
    lastUpdated: Date.now(),
  }

  return { style: blend(currentStyle, newStyle, 0.3), sampleMessages: sampleMsgs }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function blend(old: UserStyle, fresh: UserStyle, weight: number): UserStyle {
  return {
    formality: old.formality * (1 - weight) + fresh.formality * weight,
    humor: old.humor * (1 - weight) + fresh.humor * weight,
    directness: old.directness * (1 - weight) + fresh.directness * weight,
    warmth: old.warmth * (1 - weight) + fresh.warmth * weight,
    emojiUsage: old.emojiUsage * (1 - weight) + fresh.emojiUsage * weight,
    messageLength: old.messageLength * (1 - weight) + fresh.messageLength * weight,
    avgLength: fresh.avgLength,
    sampleMessages: fresh.sampleMessages,
    lastUpdated: Date.now(),
  }
}

export function styleToInstructions(style: UserStyle, language: string, sampleMessages: string[]): string {
  const lines: string[] = []

  if (language === 'zh') {
    lines.push(`模仿用户的打字风格：`)
    if (style.formality < 0.3) lines.push(`- 用口语化表达，别用书面语`)
    if (style.formality > 0.7) lines.push(`- 可以稍微正式一点`)
    if (style.humor > 0.6) lines.push(`- 多加幽默和梗`)
    if (style.directness > 0.6) lines.push(`- 直接表达，别绕弯`)
    if (style.directness < 0.3) lines.push(`- 委婉暗示，别太直接`)
    if (style.warmth > 0.6) lines.push(`- 温暖贴心，多关心对方`)
    if (style.emojiUsage > 0.5) lines.push(`- 多用emoji`)
    if (style.emojiUsage < 0.2) lines.push(`- 少用emoji或不用`)
    if (style.avgLength < 15) lines.push(`- 回复要短，几秒钟能打完`)
    if (style.avgLength > 30) lines.push(`- 可以稍微长一点，但别太长`)
  } else {
    lines.push(`Match the user's texting style:`)
    if (style.formality < 0.3) lines.push(`- Use casual slang, never formal`)
    if (style.formality > 0.7) lines.push(`- Slightly more polished`)
    if (style.humor > 0.6) lines.push(`- Add more humor and jokes`)
    if (style.directness > 0.6) lines.push(`- Be direct, don't beat around the bush`)
    if (style.directness < 0.3) lines.push(`- Be subtle and hint, don't be too direct`)
    if (style.warmth > 0.6) lines.push(`- Be warm and caring`)
    if (style.emojiUsage > 0.5) lines.push(`- Use more emojis`)
    if (style.emojiUsage < 0.2) lines.push(`- Few or no emojis`)
    if (style.avgLength < 15) lines.push(`- Keep it very short, few seconds to type`)
    if (style.avgLength > 30) lines.push(`- Can be slightly longer but not too much`)
  }

  if (sampleMessages.length > 0) {
    if (language === 'zh') {
      lines.push(`- 参考用户当前对话中的发消息风格：`)
    } else {
      lines.push(`- Reference the user's messages in this conversation for style:`)
    }
    sampleMessages.forEach(msg => {
      lines.push(`  "${msg}"`)
    })
  }

  return lines.join('\n')
}
