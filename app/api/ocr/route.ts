import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OCR_VISION_MODEL = process.env.OCR_VISION_MODEL || 'llava'
const OCR_PARSE_MODEL = process.env.OCR_PARSE_MODEL || 'qwen2.5'
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB

const OCR_PROMPT = `You are a text extraction expert. Extract ALL visible text from this WhatsApp chat screenshot. Output EXACTLY the text as shown, preserving order from top to bottom. Do NOT add commentary, descriptions, or interpretations. Just output the raw text lines.`

function buildParsePrompt(ocrText: string): string {
  return `Given raw text from a WhatsApp chat screenshot, extract each message as {sender, text} pairs. Use "unknown" if sender name is unclear. Return a JSON array. Only output JSON, no commentary.
Raw text:
${ocrText}`
}

interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
}

interface ExtractedMessage {
  sender: string
  text: string
}

async function callOllamaChat(
  messages: OllamaChatMessage[],
  model: string
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image must be a base64 string' },
        { status: 400 }
      )
    }

    // Validate base64 image size (rough check: base64 is ~33% larger than raw)
    const imageSizeBytes = Math.ceil((image.length * 3) / 4)
    if (imageSizeBytes > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image exceeds 20MB limit' },
        { status: 400 }
      )
    }

    // Step 1: Extract raw text using llava vision model
    const ocrText = await callOllamaChat(
      [
        {
          role: 'user',
          content: OCR_PROMPT,
          images: [image],
        },
      ],
      OCR_VISION_MODEL
    )

    if (!ocrText.trim()) {
      return NextResponse.json({ messages: [] })
    }

    // Step 2: Parse extracted text into structured messages using qwen
    const parseResponse = await callOllamaChat(
      [
        {
          role: 'user',
          content: buildParsePrompt(ocrText),
        },
      ],
      OCR_PARSE_MODEL
    )

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = parseResponse.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse model response as JSON', raw: jsonStr },
        { status: 500 }
      )
    }

    if (!Array.isArray(parsed) || !parsed.every(
      (m): m is ExtractedMessage =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as ExtractedMessage).sender === 'string' &&
        typeof (m as ExtractedMessage).text === 'string'
    )) {
      return NextResponse.json(
        { error: 'Model returned invalid message format', raw: jsonStr },
        { status: 500 }
      )
    }

    const messages: ExtractedMessage[] = parsed

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: 'Failed to extract messages' },
      { status: 500 }
    )
  }
}
