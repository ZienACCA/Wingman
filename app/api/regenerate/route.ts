import { streamText } from 'ai'
import { ollama } from 'ai-sdk-ollama'
import { buildReplyPrompt, parseReplies } from '@/lib/agent'
import { AgentAnalysis, Gender, Language, UserStyle, ChatMessage, SocialProfile } from '@/types'

const model = ollama(process.env.OLLAMA_MODEL || 'qwen2.5:7b')

export async function POST(req: Request) {
  const { chatText, analysis, gender, language, userStyle, sampleMessages, messages, profile } = await req.json() as {
    chatText: string
    analysis: AgentAnalysis
    gender: Gender
    language: Language
    userStyle: UserStyle
    sampleMessages: string[]
    messages: ChatMessage[]
    profile?: SocialProfile
  }

  const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user')
  const lastUserPos = lastUserIdx >= 0 ? messages.length - 1 - lastUserIdx : -1
  const targetMessages = (messages || []).filter(
    (m, i) => m.role === 'girl' && m.text.trim() && i > lastUserPos
  )
  const replyPrompt = buildReplyPrompt(chatText, analysis, gender, language, userStyle, sampleMessages, targetMessages, profile)
  const replyResponse = await streamText({ model, prompt: replyPrompt })

  let replyText = ''
  for await (const chunk of replyResponse.textStream) {
    replyText += chunk
  }

  return Response.json({ replies: parseReplies(replyText, targetMessages) })
}
