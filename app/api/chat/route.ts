import { streamText } from 'ai'
import { ollama } from 'ai-sdk-ollama'
import { buildAnalysisPrompt, buildReplyPrompt, parseReplies, parseAnalysis } from '@/lib/agent'
import { Vibe } from '@/types'

const model = ollama(process.env.OLLAMA_MODEL || 'qwen2.5:7b')

export async function POST(req: Request) {
  const { chatText, vibe } = await req.json() as { chatText: string; vibe: Vibe }

  // Step 1: Analyze the conversation
  const analysisPrompt = buildAnalysisPrompt(chatText)
  const analysisResponse = await streamText({
    model,
    prompt: analysisPrompt,
  })

  let analysisText = ''
  for await (const chunk of analysisResponse.textStream) {
    analysisText += chunk
  }

  const analysis = parseAnalysis(analysisText)

  // Step 2: Generate replies based on analysis
  const replyPrompt = buildReplyPrompt(chatText, analysis, vibe)
  const replyResponse = await streamText({
    model,
    prompt: replyPrompt,
  })

  let replyText = ''
  for await (const chunk of replyResponse.textStream) {
    replyText += chunk
  }

  const replies = parseReplies(replyText)

  return Response.json({ analysis, replies })
}
