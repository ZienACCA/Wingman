import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB

interface ExtractedMessage {
  sender: string
  text: string
  replyTo?: string
  replyToRole?: string
}

interface PreviousMessage {
  text: string
  role?: string
}

async function runOcr(imagePath: string, previousMessages?: PreviousMessage[]): Promise<ExtractedMessage[]> {
  const scriptPath = join(process.cwd(), 'scripts', 'ocr.py')
  const args = [scriptPath, imagePath]
  
  // Pass previous messages for reply linking
  if (previousMessages && previousMessages.length > 0) {
    args.push(JSON.stringify(previousMessages))
  }
  
  const { stdout, stderr } = await execFileAsync('python3', args, {
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  })

  if (stderr) {
    console.error('[OCR] Python stderr:', stderr)
  }

  const result = JSON.parse(stdout)

  if (result.error) {
    throw new Error(result.error)
  }

  return result.map((m: { text: string; sender: string; replyTo?: string; replyToRole?: string }) => ({
    text: m.text,
    sender: m.sender,
    replyTo: m.replyTo,
    replyToRole: m.replyToRole,
  }))
}

export async function POST(request: NextRequest) {
  let tempFile: string | null = null

  try {
    let image: unknown
    let previousMessages: { text: string }[] | undefined
    try {
      const body = await request.json()
      image = body?.image
      previousMessages = body?.previousMessages
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image must be a base64 string' },
        { status: 400 }
      )
    }

    const imageSizeBytes = Math.ceil((image.length * 3) / 4)
    console.log('[OCR] Image size:', (imageSizeBytes / 1024 / 1024).toFixed(2), 'MB')
    if (imageSizeBytes > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image exceeds 20MB limit' },
        { status: 400 }
      )
    }

    const imageBuffer = Buffer.from(image, 'base64')
    tempFile = join(tmpdir(), 'ocr-' + Date.now() + '.png')
    await writeFile(tempFile, imageBuffer)
    console.log('[OCR] Saved temp file:', tempFile)

    // Single step: OCR + Layout Parser (all in Python, no AI model needed)
    console.log('[OCR] Running PaddleOCR + Layout Parser...')
    const messages = await runOcr(tempFile, previousMessages)
    console.log('[OCR] Result:', messages.length, 'messages')

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: 'Failed to extract messages' },
      { status: 500 }
    )
  } finally {
    if (tempFile) {
      await unlink(tempFile).catch(() => {})
    }
  }
}
