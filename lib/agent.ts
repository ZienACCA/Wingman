import { Vibe, AgentAnalysis, ReplyOption } from '@/types'

const ANALYSIS_PROMPT = `你是一个聊天分析专家。分析以下对话，返回JSON格式的分析结果。

分析维度：
1. tone - 她的语气（ playful/serious/dry/warm/cold）
2. interestLevel - 她的兴趣程度（high/medium/low）
3. emotionalState - 她的情绪状态
4. relationshipStage - 你们的关系阶段（strangers/acquaintances/flirting/dating）
5. subtext - 她话里真正想表达的意思

只返回JSON，不要其他内容。`

const REPLY_PROMPTS: Record<Vibe, string> = {
  smooth: '生成3-5个自信、有魅力、略带调皮的回复。要自然，不要太刻意。',
  funny: '生成3-5个幽默、有趣、能逗她笑的回复。可以用梗，但不要太冷。',
  bold: '生成3-5个直接、大胆、有进攻性的回复。要自信但不油腻。',
  sweet: '生成3-5个温暖、真诚、让人感到被关心的回复。',
  cool: '生成3-5个轻松、淡定、不刻意的回复。看起来毫不费力。',
}

export function buildAnalysisPrompt(chatText: string): string {
  return `${ANALYSIS_PROMPT}\n\n对话内容：\n${chatText}`
}

export function buildReplyPrompt(
  chatText: string,
  analysis: AgentAnalysis,
  vibe: Vibe
): string {
  return `你是一个撩妹高手。根据以下信息生成回复选项。

## 对话内容
${chatText}

## 分析结果
- 语气: ${analysis.tone}
- 兴趣程度: ${analysis.interestLevel}
- 情绪状态: ${analysis.emotionalState}
- 关系阶段: ${analysis.relationshipStage}
- 潜台词: ${analysis.subtext}

## 回复风格
${REPLY_PROMPTS[vibe]}

## 要求
- 每个回复简短（1-2句话）
- 自然口语化，像真人打字
- 符合当前语境
- 返回JSON数组格式: ["回复1", "回复2", "回复3"]
- 只返回JSON，不要其他内容`
}

export function parseReplies(response: string): ReplyOption[] {
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    const texts = JSON.parse(cleaned)
    return texts.map((text: string, i: number) => ({
      id: `reply-${Date.now()}-${i}`,
      text,
    }))
  } catch {
    return [{ id: `reply-${Date.now()}`, text: response }]
  }
}

export function parseAnalysis(response: string): AgentAnalysis {
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {
      tone: 'unknown',
      interestLevel: 'medium',
      emotionalState: 'unknown',
      relationshipStage: 'unknown',
      subtext: '无法分析',
    }
  }
}
