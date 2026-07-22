# Chat Screenshot Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ability to upload chat screenshots, extract messages via OCR, review/edit them, and add to chat for analysis.

**Architecture:** Upload button → API route → Ollama llava OCR → Review modal → Add to chat. Server-side processing with client-side review.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript, Ollama (llava model)

---

## File Structure

| File | Purpose |
|------|---------|
| `app/api/ocr/route.ts` | New OCR API endpoint |
| `components/ScreenshotReviewModal.tsx` | New review modal component |
| `components/ChatInput.tsx` | Add upload button and modal trigger |
| `lib/i18n.ts` | Add new translation keys |

---

### Task 1: Add i18n Keys

**Files:**
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add screenshot-related translations**

Find the translations object and add these keys to both language sections:

```typescript
// In the zh section:
uploadScreenshot: '上传截图',
extractingMessages: '正在提取消息...',
noMessagesFound: '未找到消息',
reviewExtracted: '检查提取的消息',
selectAll: '全选',
deselectAll: '取消全选',
addToChat: '添加到聊天',
editMessage: '编辑消息',
uploadError: '上传失败，请重试',
llavaNotInstalled: '需要安装 llava 模型，请运行: ollama pull llava',

// In the en section:
uploadScreenshot: 'Upload Screenshot',
extractingMessages: 'Extracting messages...',
noMessagesFound: 'No messages found',
reviewExtracted: 'Review Extracted Messages',
selectAll: 'Select All',
deselectAll: 'Deselect All',
addToChat: 'Add to Chat',
editMessage: 'Edit message',
uploadError: 'Upload failed, please try again',
llavaNotInstalled: 'llava model required. Run: ollama pull llava',
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in the project directory
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add screenshot upload translation keys"
```

---

### Task 2: Create OCR API Route

**Files:**
- Create: `app/api/ocr/route.ts`

- [ ] **Step 1: Create the OCR API route**

Create `app/api/ocr/route.ts` with the following content:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    // Check if llava model is available
    const tagsResponse = await fetch(`${ollamaUrl}/api/tags`)
    const tagsData = await tagsResponse.json()
    const hasLlava = tagsData.models?.some((m: { name: string }) => m.name.includes('llava'))

    if (!hasLlava) {
      return NextResponse.json(
        { error: 'llava model required. Run: ollama pull llava' },
        { status: 400 }
      )
    }

    // Send image to llava for extraction
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: `Extract all chat messages from this screenshot. For each message:
- Identify who sent it (left side = "her", right side = "me")
- Extract the message text exactly as written
- Ignore timestamps, status indicators, and UI elements

Return ONLY a JSON array in this exact format:
[{"sender": "her", "text": "message"}, {"sender": "me", "text": "reply"}]

Do not include any other text or explanation.`,
        images: [image],
        stream: false,
      }),
    })

    const data = await response.json()

    // Parse the response - try to extract JSON array
    const jsonMatch = data.response?.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ messages: [] })
    }

    const messages = JSON.parse(jsonMatch[0])
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ error: 'Failed to extract messages' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in the project directory
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/ocr/route.ts
git commit -m "feat: add OCR API route with llava model"
```

---

### Task 3: Create Screenshot Review Modal

**Files:**
- Create: `components/ScreenshotReviewModal.tsx`

- [ ] **Step 1: Create the modal component**

Create `components/ScreenshotReviewModal.tsx` with the following content:

```tsx
'use client'

import { useState } from 'react'
import { ChatMessage, Language } from '@/types'
import { t } from '@/lib/i18n'

interface ExtractedMessage {
  sender: 'her' | 'me'
  text: string
}

interface ScreenshotReviewModalProps {
  messages: ExtractedMessage[]
  language: Language
  onAdd: (messages: ChatMessage[]) => void
  onClose: () => void
}

export function ScreenshotReviewModal({ messages, language, onAdd, onClose }: ScreenshotReviewModalProps) {
  const [editedMessages, setEditedMessages] = useState(
    messages.map((m, i) => ({ ...m, id: i, checked: true, editing: false }))
  )

  const toggleCheck = (id: number) => {
    setEditedMessages(prev =>
      prev.map(m => m.id === id ? { ...m, checked: !m.checked } : m)
    )
  }

  const toggleEdit = (id: number) => {
    setEditedMessages(prev =>
      prev.map(m => m.id === id ? { ...m, editing: !m.editing } : m)
    )
  }

  const updateText = (id: number, text: string) => {
    setEditedMessages(prev =>
      prev.map(m => m.id === id ? { ...m, text } : m)
    )
  }

  const selectAll = () => {
    setEditedMessages(prev => prev.map(m => ({ ...m, checked: true })))
  }

  const deselectAll = () => {
    setEditedMessages(prev => prev.map(m => ({ ...m, checked: false })))
  }

  const handleAdd = () => {
    const selected = editedMessages
      .filter(m => m.checked && m.text.trim())
      .map(m => ({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: m.sender === 'her' ? 'girl' as const : 'user' as const,
        text: m.text.trim(),
        timestamp: Date.now(),
      }))
    onAdd(selected)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1a2830] rounded-lg shadow-xl border border-[#313d45] w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#313d45] flex items-center justify-between">
          <h3 className="text-white font-medium">
            {t(language, 'reviewExtracted')}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {editedMessages.length === 0 ? (
            <p className="text-[#8696a0] text-sm text-center">
              {t(language, 'noMessagesFound')}
            </p>
          ) : (
            editedMessages.map(msg => (
              <div
                key={msg.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#202c33] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={msg.checked}
                  onChange={() => toggleCheck(msg.id)}
                  className="mt-1 accent-[#00a884]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#00a884] text-xs font-medium">
                      {msg.sender === 'her' ? (language === 'en' ? 'Her' : '她') : (language === 'en' ? 'Me' : '我')}
                    </span>
                    <button
                      onClick={() => toggleEdit(msg.id)}
                      className="text-[#8696a0] hover:text-white text-xs"
                    >
                      {t(language, 'editMessage')}
                    </button>
                  </div>
                  {msg.editing ? (
                    <input
                      type="text"
                      value={msg.text}
                      onChange={(e) => updateText(msg.id, e.target.value)}
                      className="w-full bg-[#2a3942] text-white text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-[#00a884]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-[#d1d7db] text-sm">{msg.text}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#313d45] flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs text-[#8696a0] hover:text-white transition-colors"
          >
            {t(language, 'selectAll')}
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs text-[#8696a0] hover:text-white transition-colors"
          >
            {t(language, 'deselectAll')}
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#8696a0] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t(language, 'addToChat')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in the project directory
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ScreenshotReviewModal.tsx
git commit -m "feat: add screenshot review modal component"
```

---

### Task 4: Add Upload Button to ChatInput

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add imports and state**

At the top of the file, add the import for the modal:

```typescript
import { ScreenshotReviewModal } from './ScreenshotReviewModal'
```

Inside the component, add new state variables:

```typescript
const [isUploading, setIsUploading] = useState(false)
const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
const [extractedMessages, setExtractedMessages] = useState<{ sender: 'her' | 'me'; text: string }[] | null>(null)
```

- [ ] **Step 2: Add upload handler**

After the existing handlers, add:

```typescript
const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert(t(language, 'uploadError'))
    return
  }

  setIsUploading(true)

  try {
    // Convert to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]

      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || t(language, 'uploadError'))
          setIsUploading(false)
          return
        }

        setExtractedMessages(data.messages)
      } catch {
        alert(t(language, 'uploadError'))
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  } catch {
    alert(t(language, 'uploadError'))
    setIsUploading(false)
  }

  // Reset input
  e.target.value = ''
}
```

- [ ] **Step 3: Add handleAddExtractedMessages function**

After the upload handler, add:

```typescript
const handleAddExtractedMessages = (msgs: ChatMessage[]) => {
  onMessagesChange([...messages, ...msgs])
  setExtractedMessages(null)
}
```

- [ ] **Step 4: Add upload button to UI**

Find the input area section (the `px-4 py-2 bg-[#202c33] flex gap-2 border-t border-[#313d45]` div).

Before the existing buttons, add the upload button:

```tsx
{/* Upload screenshot button */}
<div className="relative">
  <input
    type="file"
    accept="image/*"
    onChange={handleScreenshotUpload}
    className="hidden"
    id="screenshot-upload"
  />
  <label
    htmlFor="screenshot-upload"
    className={`flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors ${
      isUploading
        ? 'bg-[#2a3942] text-[#8696a0] cursor-wait'
        : 'bg-[#2a3942] hover:bg-[#3b4d57] text-[#d1d7db]'
    }`}
  >
    {isUploading ? (
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    )}
  </label>
</div>
```

- [ ] **Step 5: Add modal to JSX**

Before the closing `</div>` of the component (at the very end), add:

```tsx
{/* Screenshot review modal */}
{extractedMessages && (
  <ScreenshotReviewModal
    messages={extractedMessages}
    language={language}
    onAdd={handleAddExtractedMessages}
    onClose={() => setExtractedMessages(null)}
  />
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in the project directory
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add screenshot upload button and modal integration"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Manual test**

1. Ensure Ollama is running with llava model (`ollama pull llava`)
2. Open app in browser
3. Click the upload icon next to input
4. Select a chat screenshot
5. Wait for OCR processing
6. Review extracted messages in modal
7. Edit a message, uncheck one, select all/deselect all
8. Click "Add to Chat"
9. Verify messages appear in chat
10. Click "Analyze & Generate Replies" to verify analysis works

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete screenshot upload feature"
```
