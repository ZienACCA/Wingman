import { streamText } from 'ai'
import { ollama } from 'ai-sdk-ollama'
import { buildAnalysisPrompt, buildReplyPrompt, parseReplies, parseAnalysis, hasChinese, buildTranslatePrompt } from '@/lib/agent'
import { Gender, UserStyle, ChatMessage } from '@/types'

const model = ollama(process.env.OLLAMA_MODEL || 'qwen2.5:7b')

export async function POST(req: Request) {
  const { chatText, gender, userStyle, sampleMessages, messages } = await req.json() as {
    chatText: string
    gender: Gender
    userStyle: UserStyle
    sampleMessages: string[]
    messages: ChatMessage[]
  }

  // Step 1: Analysis (ZH + EN)
  const analysisPromptZH = buildAnalysisPrompt(chatText, 'zh', gender)
  const analysisResponseZH = await streamText({ model, prompt: analysisPromptZH })
  let analysisTextZH = ''
  for await (const chunk of analysisResponseZH.textStream) {
    analysisTextZH += chunk
  }

  const analysisPromptEN = buildAnalysisPrompt(chatText, 'en', gender)
  const analysisResponseEN = await streamText({ model, prompt: analysisPromptEN })
  let analysisTextEN = ''
  for await (const chunk of analysisResponseEN.textStream) {
    analysisTextEN += chunk
  }

  const analysisZH = parseAnalysis(analysisTextZH)
  let analysisEN = parseAnalysis(analysisTextEN)

  // If EN subtext is Chinese, translate it
  if (hasChinese(analysisEN.subtext)) {
    const translatePrompt = buildTranslatePrompt(analysisEN.subtext)
    const translateResponse = await streamText({ model, prompt: translatePrompt })
    let translatedText = ''
    for await (const chunk of translateResponse.textStream) {
      translatedText += chunk
    }
    analysisEN = { ...analysisEN, subtext: translatedText.trim() }
  }

  // Step 2: Get unreplied girl messages (messages after the last user message)
  const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user')
  const lastUserPos = lastUserIdx >= 0 ? messages.length - 1 - lastUserIdx : -1
  const targetMessages = (messages || []).filter(
    (m, i) => m.role === 'girl' && m.text.trim() && i > lastUserPos
  )

  // Step 3: Generate replies per-message
  const replyPromptZH = buildReplyPrompt(chatText, analysisZH, gender, 'zh', userStyle, sampleMessages, targetMessages)
  const replyResponseZH = await streamText({ model, prompt: replyPromptZH })
  let replyTextZH = ''
  for await (const chunk of replyResponseZH.textStream) {
    replyTextZH += chunk
  }

  const replyPromptEN = buildReplyPrompt(chatText, analysisEN, gender, 'en', userStyle, sampleMessages, targetMessages)
  const replyResponseEN = await streamText({ model, prompt: replyPromptEN })
  let replyTextEN = ''
  for await (const chunk of replyResponseEN.textStream) {
    replyTextEN += chunk
  }

  return Response.json({
    analysisZH,
    analysisEN,
    repliesZH: parseReplies(replyTextZH, targetMessages),
    repliesEN: parseReplies(replyTextEN, targetMessages),
  })
}
