# Reply-to-Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp/Instagram-style reply-to-message with swipe, right-click, and hover triggers, preview above input, and quote bubbles in sent messages.

**Architecture:** Extend ChatMessage type with optional reply fields. Add three trigger mechanisms (swipe, right-click, hover) to ChatInput. Show reply preview above input. Render quote bubbles in sent messages.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript

---

## File Structure

| File | Purpose |
|------|---------|
| `types/index.ts` | Add `replyToId`, `replyToText` to `ChatMessage` |
| `components/ChatInput.tsx` | Add reply state, triggers, preview, quote display |
| `lib/i18n.ts` | Add "Reply" translation |

---

### Task 1: Extend ChatMessage Type

**Files:**
- Modify: `types/index.ts:16-21`

- [ ] **Step 1: Add reply fields to ChatMessage**

```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'girl'
  text: string
  timestamp: number
  replyToId?: string
  replyToText?: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: extend ChatMessage with reply fields"
```

---

### Task 2: Add i18n Translation

**Files:**
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add "reply" translation**

Find the translations object and add:

```typescript
reply: { zh: '回复', en: 'Reply' },
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add reply translation"
```

---

### Task 3: Add Reply State and Cancel Handler

**Files:**
- Modify: `components/ChatInput.tsx:18-20`

- [ ] **Step 1: Add replyTo state**

After the existing `editingId` state, add:

```typescript
const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
```

- [ ] **Step 2: Add cancelReply handler**

After the `removeMessage` function, add:

```typescript
const cancelReply = () => setReplyTo(null)
```

- [ ] **Step 3: Add onReply callback prop**

Update the interface:

```typescript
interface ChatInputProps {
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  isLoading: boolean
  language: Language
  replies: ReplyOption[]
  onReplyClick: (text: string, messageId: string) => void
  analysis: AgentAnalysis | null
  gender: Gender
}
```

No change needed — the existing `onReplyClick` already handles reply text. We'll add a separate `onReply` for triggering the reply state.

Actually, we need a new prop for triggering reply state. Update the interface:

```typescript
interface ChatInputProps {
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  isLoading: boolean
  language: Language
  replies: ReplyOption[]
  onReplyClick: (text: string, messageId: string) => void
  analysis: AgentAnalysis | null
  gender: Gender
}
```

Wait, we don't need a new prop. The reply state is internal to ChatInput. The `onReplyClick` already handles sending replies. We just need to:

1. When user triggers reply → set `replyTo` state
2. When user clicks AI reply option → send message with `replyTo` info
3. When user types and sends → send message with `replyTo` info

So we need to modify `onReplyClick` to include reply context, or add internal handling.

Let me reconsider. The `onReplyClick` is called when user clicks an AI-generated reply option. It receives `(text, messageId)`. We need to also pass the reply context.

Actually, the simplest approach:
1. `replyTo` state tracks which message is being replied to
2. When sending (via AI reply click or manual send), include `replyToId` and `replyToText` in the new message
3. Clear `replyTo` after sending

So we need to modify the send logic to include reply context.

- [ ] **Step 3: Update handleReplyClick to include reply context**

Find the `onReplyClick` usage in the reply options section. Currently:

```typescript
onClick={() => onReplyClick(reply.text, reply.messageId)}
```

This calls the parent's `handleReplyClick`. We need to also pass reply context.

Actually, let me reconsider the architecture. The `onReplyClick` in page.tsx creates a new message and clears replies. We need to also include `replyToId` and `replyToText`.

The cleanest approach: modify `onReplyClick` signature to include reply context, or handle it internally in ChatInput.

Let me go with internal handling: when user clicks an AI reply option, ChatInput creates the message directly with reply context, then calls `onMessagesChange`.

Wait, but `onReplyClick` is defined in page.tsx and handles the message creation. Let me check.

Looking at page.tsx:
```typescript
const handleReplyClick = (replyText: string, messageId: string) => {
  if (!activeSessionId || !activeSession) return
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'user',
    text: replyText,
    timestamp: Date.now(),
  }
  handleMessagesChange([...activeSession.messages, newMsg])
}
```

So the parent creates the message. We need to pass `replyTo` context to the parent.

Options:
1. Modify `onReplyClick` to accept optional reply context
2. Add a new prop `onReplyWithContext`
3. Handle message creation in ChatInput

I think option 1 is cleanest. Modify `onReplyClick` signature:

```typescript
onReplyClick: (text: string, messageId: string, replyToId?: string, replyToText?: string) => void
```

- [ ] **Step 4: Update onReplyClick signature in page.tsx**

In `app/page.tsx`, update `handleReplyClick`:

```typescript
const handleReplyClick = (replyText: string, messageId: string, replyToId?: string, replyToText?: string) => {
  if (!activeSessionId || !activeSession) return
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'user',
    text: replyText,
    timestamp: Date.now(),
    replyToId,
    replyToText,
  }
  handleMessagesChange([...activeSession.messages, newMsg])
}
```

- [ ] **Step 5: Update ChatInput interface**

```typescript
onReplyClick: (text: string, messageId: string, replyToId?: string, replyToText?: string) => void
```

- [ ] **Step 6: Update AI reply click handler**

In ChatInput, find the AI reply option click handler:

```typescript
onClick={() => onReplyClick(reply.text, reply.messageId)}
```

Update to:

```typescript
onClick={() => {
  onReplyClick(reply.text, reply.messageId, replyTo?.id, replyTo?.text)
  setReplyTo(null)
}}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add components/ChatInput.tsx app/page.tsx
git commit -m "feat: add reply state and context propagation"
```

---

### Task 4: Add Reply Preview Bar

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add preview bar above input**

Find the input area section (the `px-4 py-2 bg-[#202c33]` div). Before it, add the preview bar:

```tsx
{/* Reply preview */}
{replyTo && (
  <div className="px-4 py-2 bg-[#1a2830] border-t border-[#313d45] flex items-center gap-2">
    <button
      onClick={cancelReply}
      className="text-[#8696a0] hover:text-white transition-colors"
    >
      ✕
    </button>
    <div className="flex-1 min-w-0">
      <div className="text-[#00a884] text-xs font-medium">
        {language === 'en'
          ? (gender === 'male' ? 'She' : 'He')
          : (gender === 'male' ? '她' : '他')}
      </div>
      <div className="text-[#8696a0] text-xs truncate">
        {replyTo.text || t(language, 'emptyChat')}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add reply preview bar above input"
```

---

### Task 5: Add Hover Reply Icon

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add hover icon to message bubble**

In the message rendering section, find the bubble div. Add a reply icon that shows on hover:

Inside the message wrapper div (the `flex ${isHer ? 'justify-start' : 'justify-end'} group` div), add before the bubble:

```tsx
{/* Reply icon on hover */}
<button
  onClick={(e) => {
    e.stopPropagation()
    setReplyTo(msg)
  }}
  className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-[#8696a0] hover:text-white"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 17l-5-5 5-5" />
    <path d="M4 12h11a4 4 0 0 1 0 8h-1" />
  </svg>
</button>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add hover reply icon to messages"
```

---

### Task 6: Add Right-Click Context Menu

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add contextMenu state**

After the `replyTo` state, add:

```typescript
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: ChatMessage } | null>(null)
```

- [ ] **Step 2: Add contextMenu handler**

After the `cancelReply` function, add:

```typescript
const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
  e.preventDefault()
  e.stopPropagation()
  setContextMenu({ x: e.clientX, y: e.clientY, message: msg })
}
```

- [ ] **Step 3: Add onContextMenu to message bubble**

Find the bubble div's onClick handler. Add onContextMenu:

```tsx
onContextMenu={(e) => handleContextMenu(e, msg)}
```

- [ ] **Step 4: Add context menu popup**

After the message rendering section (before the AI reply suggestions), add:

```tsx
{/* Context menu */}
{contextMenu && (
  <>
    <div
      className="fixed inset-0 z-50"
      onClick={() => setContextMenu(null)}
    />
    <div
      className="fixed z-50 bg-[#233146] rounded-lg shadow-lg border border-[#313d45] py-1 min-w-[120px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button
        onClick={() => {
          setReplyTo(contextMenu.message)
          setContextMenu(null)
        }}
        className="w-full px-4 py-2 text-left text-sm text-[#d1d7db] hover:bg-[#2a3942] transition-colors"
      >
        {t(language, 'reply')}
      </button>
    </div>
  </>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add right-click context menu with reply option"
```

---

### Task 7: Add Swipe Right Trigger

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add swipe state**

After the `contextMenu` state, add:

```typescript
const [swipeStart, setSwipeStart] = useState<{ x: number; messageId: string } | null>(null)
const [swipeDelta, setSwipeDelta] = useState(0)
```

- [ ] **Step 2: Add swipe handlers**

After the `handleContextMenu` function, add:

```typescript
const handleSwipeStart = (e: React.PointerEvent, msgId: string) => {
  setSwipeStart({ x: e.clientX, messageId: msgId })
}

const handleSwipeMove = (e: React.PointerEvent) => {
  if (!swipeStart) return
  const delta = e.clientX - swipeStart.x
  if (delta > 0) setSwipeDelta(delta)
}

const handleSwipeEnd = () => {
  if (swipeStart && swipeDelta > 80) {
    const msg = messages.find(m => m.id === swipeStart.messageId)
    if (msg) setReplyTo(msg)
  }
  setSwipeStart(null)
  setSwipeDelta(0)
}
```

- [ ] **Step 3: Add swipe event handlers to message bubble**

Find the message wrapper div. Add pointer event handlers:

```tsx
onPointerDown={(e) => handleSwipeStart(e, msg.id)}
onPointerMove={handleSwipeMove}
onPointerUp={handleSwipeEnd}
onPointerLeave={handleSwipeEnd}
```

- [ ] **Step 4: Add swipe visual feedback**

Find the bubble div. Add a transform style:

```tsx
style={swipeStart?.messageId === msg.id && swipeDelta > 0
  ? { transform: `translateX(${Math.min(swipeDelta * 0.5, 40)}px)` }
  : undefined}
```

Add a reply icon that shows during swipe:

```tsx
{swipeStart?.messageId === msg.id && swipeDelta > 20 && (
  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 text-[#00a884]">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17l-5-5 5-5" />
      <path d="M4 12h11a4 4 0 0 1 0 8h-1" />
    </svg>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add swipe right trigger for reply"
```

---

### Task 8: Add Quote Bubble in Sent Messages

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add quote rendering inside message bubble**

Find the message content section (where `msg.text` is displayed). Wrap it to show quote when `replyToText` exists:

```tsx
{msg.replyToText && (
  <div className="border-l-2 border-[#00a884] pl-2 mb-1">
    <div className="text-[#8696a0] text-xs">
      {msg.role === 'girl'
        ? (gender === 'male' ? '她' : '他')
        : (gender === 'male' ? '我' : '我')}
      : {msg.replyToText}
    </div>
  </div>
)}
<span className="whitespace-pre-wrap break-words text-sm">
  {msg.text || (isHer ? addMsgLabel(language, gender, 'her') : addMsgLabel(language, gender, 'my'))}
</span>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add quote bubble in sent messages"
```

---

### Task 9: Test Manual Input with Reply Context

**Files:**
- Modify: `components/ChatInput.tsx`

- [ ] **Step 1: Add send handler with reply context**

Find the input area. We need to handle manual message submission with reply context.

Currently, messages are added via `addMessage` function. We need to modify it to include reply context when `replyTo` is set.

Update the `addMessage` function:

```typescript
const addMessage = (role: 'her' | 'my') => {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: role === 'her' ? 'girl' : 'user',
    text: '',
    timestamp: Date.now(),
    replyToId: replyTo?.id,
    replyToText: replyTo?.text,
  }
  onMessagesChange([...messages, newMsg])
  setEditingId(newMsg.id)
  setReplyTo(null)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: include reply context in manual message creation"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Manual test**

1. Open app in browser
2. Add messages from "her" and "me"
3. Test hover icon: hover over a message, click reply icon
4. Test right-click: right-click a message, click "Reply"
5. Test swipe: drag a message right, release
6. Verify preview shows above input
7. Click AI reply option, verify quote bubble appears
8. Type manual message with reply context, verify quote bubble
9. Click ✕ on preview to cancel reply
10. Verify all three triggers work correctly

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete reply-to-message feature"
```
