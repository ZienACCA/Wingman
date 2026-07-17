# Reply-to-Message Feature Design

## Overview

Add WhatsApp/Instagram-style reply-to-message functionality. Users can reply to specific messages in the chat, with visual quote bubbles and a preview above the input.

## Requirements

1. **Three trigger methods:** Swipe right, right-click context menu, hover icon
2. **Reply preview:** Show quoted message above input with cancel button
3. **Quote bubble:** Sent messages show the original message as a quote inside the bubble

## Data Model Changes

### ChatMessage (types/index.ts)

Add two optional fields:

```ts
replyToId?: string    // ID of the message being replied to
replyToText?: string  // Text of the quoted message (snapshot)
```

## Component Changes

### ChatInput.tsx

#### State

- `replyTo: ChatMessage | null` — the message being replied to
- `contextMenu: { x: number; y: number; message: ChatMessage } | null` — right-click menu position

#### Trigger: Swipe Right

- On `pointerdown` on a message bubble → track start position
- On `pointermove` → calculate horizontal delta
- If delta > 80px right → call `onReply(message)`
- Show a reply icon that slides in from the left during drag
- On `pointerup` → reset drag state

#### Trigger: Right-Click Context Menu

- On `contextmenu` on a message bubble → prevent default, set `contextMenu` state
- Render a small popup menu at cursor position with "Reply" option
- Click on "Reply" → call `onReply(message)`, close menu
- Click outside → close menu

#### Trigger: Hover Icon

- On message hover → show a small reply arrow icon (→) on the left side of the bubble
- Click icon → call `onReply(message)`

#### Reply Preview

When `replyTo` is set, render above the input area:

```
┌─────────────────────────────────┐
│ ✕  She: "original message text" │  ← gray bar with cancel button
├─────────────────────────────────┤
│ [message input area]            │
└─────────────────────────────────┘
```

- Clicking ✕ clears `replyTo` state
- Label uses gender-aware labels (她/He/She/他)

#### Quote Bubble in Sent Message

When a message has `replyToText`, render it as a quote inside the bubble:

```
┌──────────────────────────┐
│ ┃ She: "original text"   │  ← thin accent bar + smaller gray text
│                          │
│ my reply text here       │  ← normal message text
└──────────────────────────┘
```

- Quote section has left border accent color
- Quote text is smaller and gray
- Normal message text below

## i18n Changes

### lib/i18n.ts

Add translations:
- `reply`: "回复" (zh) / "Reply" (en)

## Files to Modify

1. `types/index.ts` — add `replyToId`, `replyToText` to `ChatMessage`
2. `components/ChatInput.tsx` — add reply state, 3 triggers, preview bar, quote display
3. `lib/i18n.ts` — add "Reply" label

## Edge Cases

- Reply preview persists until user sends or cancels
- Multiple rapid replies: only the last one counts
- Empty messages can be replied to (shows placeholder text)
- Swipe threshold: 80px to avoid accidental triggers
- Context menu closes on outside click or Escape key
