# Social Profile Context

**Date:** 2026-07-20
**Status:** Draft
**Feature:** Inject social media profile context into AI prompts for personalized reply generation

## Problem

Wingman generates replies based only on chat conversation text. It has no context about the person being chatted with — their personality, interests, bio, or public posts. This limits how personalized the generated replies can be.

## Solution

Allow users to paste a social media profile link (Instagram or Xiaohongshu) per session. Wingman automatically scrapes publicly available profile data (display name, bio, recent posts) using Playwright, stores it with the session, and injects it into AI prompts for both analysis and reply generation.

## Architecture

### New Data Model

```typescript
interface SocialProfile {
  platform: 'instagram' | 'xiaohongshu'
  url: string
  displayName: string
  bio: string
  recentPosts: string[]
  lastFetched?: number
}
```

Added to `SessionData` as an optional `profile` field.

### New API Route: `POST /api/profile/fetch`

**Request:**
```json
{
  "url": "https://instagram.com/username"
}
```

**Response (success):**
```json
{
  "platform": "instagram",
  "url": "https://instagram.com/username",
  "displayName": "Jane Doe",
  "bio": "24 | coffee addict | travel",
  "recentPosts": ["sunsets in bali 🌅", "new coffee shop alert"]
}
```

**Response (error):**
```json
{
  "error": "Could not fetch profile. The account may be private or the URL is invalid."
}
```

**Implementation:**
- Detects platform from URL domain
- Launches Playwright headless Chromium
- Navigates to the profile URL
- Waits for page to load (JS rendered)
- Extracts visible text content
- Parses for display name, bio, and up to 5 most recent visible post captions
- Closes browser
- On failure → return error message (user can still manually fill)

### Sidebar UI Changes (SessionList.tsx)

A collapsible "Profile" section in the sidebar, below the session name. Collapsed by default.

- **URL input field** with placeholder text
- **"Fetch" button** — triggers the fetch API
- **Loading spinner** during fetch
- **Result display:**
  - Display name (editable text input)
  - Bio (editable textarea)
  - Recent posts (editable textarea, one per line)
  - "Update" button to save manual edits
  - Timestamp of last fetch
- **Error state:** Error message displayed, user can still manually enter data
- **Delete profile button** — removes profile data from session

### Storage (lib/storage.ts)

- Save/load `profile` as part of `SessionData`
- Persisted in localStorage alongside other session data
- Profile is serialized and deserialized with session save/load

### Prompt Injection (lib/agent.ts)

When a session has profile data, inject it into the system prompt:

```
[Profile Context]
Name: {displayName}
Bio: {bio}
Recent posts:
- {post1}
- {post2}

Consider this profile information when analyzing the conversation and generating replies. 
Use it to understand their personality, interests, and communication style.
```

Injected into:
- Analysis prompt (for more accurate tone/interest/stage detection)
- Reply generation prompt (for more personalized reply options)

No toggle — automatically injected when `profile` exists on the session.

### Platform Detection

URL pattern matching:

| Platform | URL Pattern |
|----------|-------------|
| Instagram | `instagram.com/username` or `instagr.am/username` |
| Xiaohongshu | `xiaohongshu.com/user/profile/...` or `xhslink.com/...` |

## Data Flow

```
Sidebar URL input → "Fetch" button
  → POST /api/profile/fetch { url }
    → Playwright opens headless Chrome
    → Navigates to profile URL
    → Extracts displayName, bio, posts
    → Returns StructuredSocialProfile
  → Sidebar shows fetched data (editable)
  → User saves → localStorage.setItem(sessionId, { ...profile })
  → User adds messages → "Analyze"
    → lib/agent.ts reads session profile
    → Injects profile context into prompts
    → AI generates context-aware replies
```

## Limitations

- **Public profiles only** — Private accounts will show limited/no data
- **Instagram logged-out restrictions** — Instagram heavily restricts what's visible without login. May only get display name and limited bio. Recent posts may not be accessible.
- **Xiaohongshu restrictions** — Similar logged-out restrictions apply
- **Rate limiting** — No rate limiting on the fetch endpoint (low risk for single-user local app)
- **Token usage** — Profile data adds to prompt context. Qwen 2.5 7B has 32K context, profile adds ~200-500 tokens which is negligible.

## UI Mockup

```
┌─────────────────────┐
│ 👤 Profile          │ ← collapsible header
│                     │
│ Instagram URL:      │
│ [____________] [🔍] │ ← input + fetch button
│                     │
│ Display Name:       │
│ [Jane Doe      ]    │ ← editable
│                     │
│ Bio:                │
│ [24 | coffee addict]│ ← editable textarea
│                     │
│ Recent Posts:       │
│ [sunsets in bali    │ ← editable textarea
│  new coffee shop   ]│   (one per line)
│                     │
│ [💾 Update] [🗑️]   │ ← save/delete buttons
│                     │
│ Last fetched: 2m ago│
└─────────────────────┘
```

## Error Handling

| Scenario | UX |
|----------|-----|
| Invalid URL | Inline error: "Please enter a valid Instagram or Xiaohongshu URL" |
| Private account | Inline message: "This profile is private. You can still enter info manually." |
| Network error | Inline error: "Could not reach the profile. Check the URL or try again." |
| fetch API fails | Error displayed in sidebar, user can still type info manually |
| Playwright not available | Error: "Browser automation unavailable. Enter profile info manually." |

## Out of Scope

- TikTok / Twitter / LinkedIn profiles (future)
- Automatic re-fetch on schedule
- Multiple profiles per session
- Profile image download/display
- Sentiment analysis of profile posts
