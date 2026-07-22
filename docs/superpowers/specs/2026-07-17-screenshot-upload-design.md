# Chat Screenshot Upload Feature Design

## Overview

Allow users to upload chat screenshots, extract messages via OCR (Ollama llava model), review/edit them, and add to the chat for analysis.

## Requirements

1. Upload button next to message input
2. Server-side OCR using Ollama's llava vision model
3. Review modal with editable extracted messages
4. Add selected messages to current session

## Architecture

### Flow

```
User clicks upload → File picker → Image sent to /api/ocr → 
Ollama llava processes image → Returns extracted messages → 
Review modal shown → User edits/selects → Messages added to chat
```

### Components

1. **Upload Button** — Next to input area, opens file picker
2. **OCR API Route** — `/api/ocr` receives image, calls Ollama llava
3. **Review Modal** — Shows extracted messages with checkboxes and edit capability
4. **Message Integration** — Adds selected messages to active session

## Data Flow

### Upload Process

1. User clicks upload icon
2. File picker opens (accepts .png, .jpg, .webp)
3. Image converted to base64
4. POST to `/api/ocr` with base64 image
5. Server sends to Ollama llava with extraction prompt
6. Returns JSON array of messages
7. Modal opens with extracted messages

### OCR Prompt

```
Extract all chat messages from this screenshot. For each message:
- Identify who sent it (left side = "her", right side = "me")
- Extract the message text exactly as written
- Ignore timestamps, status indicators, and UI elements

Return as JSON array:
[{"sender": "her", "text": "message"}, {"sender": "me", "text": "reply"}]
```

### Review Modal

- Shows each extracted message with checkbox
- Click message text to edit
- "Select All" / "Deselect All" buttons
- "Add to Chat" button adds selected messages
- Close button dismisses without adding

## API Design

### POST /api/ocr

**Request:**
```json
{
  "image": "base64-encoded-image"
}
```

**Response:**
```json
{
  "messages": [
    { "sender": "her", "text": "hey what are you doing" },
    { "sender": "me", "text": "not much hbu" }
  ]
}
```

**Error:**
```json
{
  "error": "Failed to extract messages"
}
```

## UI Changes

### ChatInput.tsx

- Add upload icon button next to input
- Add loading state during OCR
- Add modal state for review
- Add message selection/editing state

### New Component: ScreenshotReviewModal

- Modal overlay with extracted messages
- Checkbox for each message
- Editable text fields
- Select All / Deselect All buttons
- Add to Chat button
- Close button

## Files to Create/Modify

1. `app/api/ocr/route.ts` — New OCR API endpoint
2. `components/ChatInput.tsx` — Add upload button and modal
3. `components/ScreenshotReviewModal.tsx` — New review modal component
4. `lib/i18n.ts` — Add new translation keys

## Prerequisites

- Ollama with llava model installed (`ollama pull llava`)
- The app should check if llava is available and show a message if not

## Edge Cases

- Invalid image format → Show error message
- OCR fails to extract messages → Show "No messages found" message
- Empty extraction → Close modal, no messages added
- Large images → Compress before sending to OCR
- Multiple screenshots → Each upload replaces previous extraction (no stacking)
