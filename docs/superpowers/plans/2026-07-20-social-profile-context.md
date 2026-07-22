# Social Profile Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-session social media profile panel that scrapes IG/Xiaohongshu data via Playwright and injects it into AI prompts.

**Architecture:** New `SocialProfilePanel` component in sidebar below session list. New `POST /api/profile/fetch` route using Playwright headless Chrome to scrape public profile data. Profile data stored in session via localStorage, injected into `buildAnalysisPrompt` and `buildReplyPrompt` in `lib/agent.ts`.

**Tech Stack:** Next.js 16 API route, Playwright (already available), React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Add SocialProfile type and update Session

**Files:**
- Modify: `types/index.ts:16-39`

- [ ] **Step 1: Add SocialProfile interface and profile field to Session**

Add the new type after `ChatMessage` and add `profile` field to `Session`:

```typescript
export interface SocialProfile {
  platform: 'instagram' | 'xiaohongshu'
  url: string
  displayName: string
  bio: string
  recentPosts: string[]
  lastFetched?: number
}
```

Add to `Session`:
```typescript
export interface Session {
  id: string
  name: string
  messages: ChatMessage[]
  gender: Gender
  language: Language
  replies: ReplyOption[]
  repliesEN?: ReplyOption[]
  analysis?: AgentAnalysis
  analysisEN?: AgentAnalysis
  sampleMessages: string[]
  createdAt: number
  updatedAt: number
  profile?: SocialProfile
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "types: add SocialProfile and profile field to Session"
```

---

### Task 2: Add profile update function to storage

**Files:**
- Modify: `lib/storage.ts:1-20`

- [ ] **Step 1: Add updateSessionProfile**

Add after `deleteConversation`:

```typescript
export function updateSessionProfile(sessionId: string, profile: SocialProfile): void {
  const history = getHistory()
  const idx = history.findIndex((c) => c.id === sessionId)
  if (idx >= 0) {
    history[idx] = { ...history[idx], profile, updatedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }
}

export function deleteSessionProfile(sessionId: string): void {
  const history = getHistory()
  const idx = history.findIndex((c) => c.id === sessionId)
  if (idx >= 0) {
    const { profile, ...rest } = history[idx]
    history[idx] = { ...rest, updatedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }
}
```

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts types/index.ts
git commit -m "storage: add updateSessionProfile and deleteSessionProfile"
```

---

### Task 3: Create profile fetch API route

**Files:**
- Create: `app/api/profile/fetch/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Detect platform
    let platform: 'instagram' | 'xiaohongshu' | null = null
    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
      platform = 'instagram'
    } else if (lowerUrl.includes('xiaohongshu.com') || lowerUrl.includes('xhslink.com')) {
      platform = 'xiaohongshu'
    }

    if (!platform) {
      return NextResponse.json({ error: 'Unsupported platform. Please use an Instagram or Xiaohongshu URL.' }, { status: 400 })
    }

    // Use Playwright to scrape
    const { chromium } = require('playwright-core')
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(2000)

      const pageText = await page.evaluate(() => document.body.innerText)

      let displayName = ''
      let bio = ''
      const recentPosts: string[] = []

      if (platform === 'instagram') {
        // Instagram: first line is often display name, bio follows
        const lines = pageText.split('\n').filter(l => l.trim())
        displayName = lines[0] || ''
        // Bio is typically after display name, before follower count
        const bioStart = 1
        const bioEnd = lines.findIndex((l, i) => i > bioStart && /follower|post/i.test(l))
        bio = bioEnd > bioStart ? lines.slice(bioStart, bioEnd).join(' ').trim() : lines.slice(bioStart, 5).join(' ').trim()
        // Recent posts: look for post-like text after bio
        const postsStart = bioEnd > 0 ? bioEnd + 2 : 5
        for (let i = postsStart; i < Math.min(lines.length, postsStart + 10); i++) {
          const line = lines[i].trim()
          if (line.length > 10 && !/follow|post|follower|following|edit|profile/i.test(line)) {
            recentPosts.push(line)
            if (recentPosts.length >= 5) break
          }
        }
      } else {
        // Xiaohongshu
        const lines = pageText.split('\n').filter(l => l.trim())
        displayName = lines[0] || ''
        bio = lines.slice(1, 4).join(' ').trim()
        for (let i = 2; i < Math.min(lines.length, 12); i++) {
          const line = lines[i].trim()
          if (line.length > 8 && !/note|follower|follow|like|edit|profile/i.test(line)) {
            recentPosts.push(line)
            if (recentPosts.length >= 5) break
          }
        }
      }

      await browser.close()

      return NextResponse.json({
        platform,
        url,
        displayName: displayName || 'Unknown',
        bio: bio || 'No bio available',
        recentPosts,
      })
    } catch {
      await browser.close()
      return NextResponse.json({
        error: 'Could not fetch profile. The account may be private or the URL is invalid.',
      }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Build check**

Run: `cd /Users/masonsay/Desktop/Github-project/flirt-wingman && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/fetch/route.ts
git commit -m "api: add profile fetch endpoint with Playwright scraping"
```

---

### Task 4: Create SocialProfilePanel component

**Files:**
- Create: `components/SocialProfilePanel.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { SocialProfile, Language } from '@/types'
import { t } from '@/lib/i18n'

interface SocialProfilePanelProps {
  profile?: SocialProfile
  language: Language
  onSave: (profile: SocialProfile) => void
  onDelete: () => void
}

export function SocialProfilePanel({ profile, language, onSave, onDelete }: SocialProfilePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState(profile?.url || '')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [postsText, setPostsText] = useState(profile?.recentPosts?.join('\n') || '')
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState('')
  const [hasFetched, setHasFetched] = useState(!!profile)

  useEffect(() => {
    if (profile) {
      setUrl(profile.url)
      setDisplayName(profile.displayName)
      setBio(profile.bio)
      setPostsText(profile.recentPosts?.join('\n') || '')
      setHasFetched(true)
    }
  }, [profile])

  const handleFetch = async () => {
    if (!url.trim()) return
    setIsFetching(true)
    setError('')

    try {
      const res = await fetch('/api/profile/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to fetch profile')
        setIsFetching(false)
        return
      }

      setDisplayName(data.displayName || '')
      setBio(data.bio || '')
      setPostsText((data.recentPosts || []).join('\n'))
      setHasFetched(true)
    } catch {
      setError(t(language, 'profile.fetchError'))
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = () => {
    if (!url.trim()) return
    onSave({
      platform: url.toLowerCase().includes('xiaohongshu') || url.toLowerCase().includes('xhslink') ? 'xiaohongshu' : 'instagram',
      url: url.trim(),
      displayName: displayName.trim(),
      bio: bio.trim(),
      recentPosts: postsText.split('\n').filter(l => l.trim()).map(l => l.trim()),
      lastFetched: Date.now(),
    })
  }

  return (
    <div className="border-t border-[#313d45]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-[#d1d7db] hover:bg-[#202c33] transition-colors text-sm font-medium"
      >
        <span className="text-[#8696a0]">👤</span>
        {t(language, 'profile.title')}
        {profile && <span className="text-[#00a884] text-xs ml-auto">●</span>}
        <svg
          className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2 text-sm">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t(language, 'profile.urlPlaceholder')}
            className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm placeholder:text-[#8696a0]"
          />

          <button
            onClick={handleFetch}
            disabled={isFetching || !url.trim()}
            className="w-full py-1.5 bg-[#005c4b] hover:bg-[#007a5c] disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
          >
            {isFetching ? t(language, 'profile.fetching') : t(language, 'profile.fetch')}
          </button>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {hasFetched && (
            <>
              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.displayName')}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.recentPosts')}</label>
                <textarea
                  value={postsText}
                  onChange={(e) => setPostsText(e.target.value)}
                  rows={3}
                  placeholder={t(language, 'profile.postsPlaceholder')}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm resize-none placeholder:text-[#8696a0]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg text-sm transition-colors"
                >
                  {t(language, 'profile.save')}
                </button>
                <button
                  onClick={onDelete}
                  className="py-1.5 px-3 bg-[#2a3942] hover:bg-[#3b4d57] text-[#8696a0] rounded-lg text-sm transition-colors"
                >
                  🗑️
                </button>
              </div>

              {profile?.lastFetched && (
                <p className="text-[#8696a0] text-xs">
                  {t(language, 'profile.lastFetched')}{' '}
                  {new Date(profile.lastFetched).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/SocialProfilePanel.tsx
git commit -m "feat: add SocialProfilePanel component"
```

---

### Task 5: Integrate SocialProfilePanel into sidebar

**Files:**
- Modify: `components/SessionList.tsx`

- [ ] **Step 1: Add SocialProfilePanel to SessionList**

Update imports:
```typescript
import { SocialProfile } from '@/types'
import { SocialProfilePanel } from './SocialProfilePanel'
import { updateSessionProfile, deleteSessionProfile } from '@/lib/storage'
```

Add new props to `SessionListProps`:
```typescript
interface SessionListProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  language: Language
  activeSession?: Session  // add this — full active session object for profile
}
```

Add after the session list div (`<div className="flex-1 overflow-y-auto">...`) and before closing `</div>` of the sidebar:

```typescript
{activeSession && (
  <SocialProfilePanel
    profile={activeSession.profile}
    language={language}
    onSave={(profile) => updateSessionProfile(activeSession.id, profile)}
    onDelete={() => deleteSessionProfile(activeSession.id)}
  />
)}
```

- [ ] **Step 2: Update parent page to pass activeSession**

In `app/page.tsx`, add `activeSession` prop to `SessionList`:

```typescript
<SessionList
  sessions={sessions}
  activeSessionId={activeSessionId}
  onSelect={setActiveSessionId}
  onCreate={handleCreateSession}
  onRename={handleRenameSession}
  onDelete={handleDeleteSession}
  language={language}
  activeSession={activeSession}  // add this line
/>
```

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/SessionList.tsx app/page.tsx
git commit -m "feat: integrate SocialProfilePanel into sidebar"
```

---

### Task 6: Add profile translations

**Files:**
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add profile keys to zh and en**

Add after `upload` block in zh:
```typescript
profile: {
  title: '个人资料',
  urlPlaceholder: '粘贴 Instagram / 小红书链接',
  fetch: '获取资料',
  fetching: '获取中...',
  displayName: '昵称',
  bio: '简介',
  recentPosts: '最近动态',
  postsPlaceholder: '每行一条，可编辑修改',
  save: '保存',
  lastFetched: '上次获取：',
  fetchError: '获取失败，请检查链接后重试',
},
```

Add after `upload` block in en:
```typescript
profile: {
  title: 'Profile',
  urlPlaceholder: 'Paste Instagram / Xiaohongshu link',
  fetch: 'Fetch Profile',
  fetching: 'Fetching...',
  displayName: 'Display Name',
  bio: 'Bio',
  recentPosts: 'Recent Posts',
  postsPlaceholder: 'One per line, editable',
  save: 'Save',
  lastFetched: 'Last fetched: ',
  fetchError: 'Failed to fetch. Check the link and try again.',
},
```

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "i18n: add profile translations"
```

---

### Task 7: Inject profile context into AI prompts

**Files:**
- Modify: `lib/agent.ts`

- [ ] **Step 1: Add profile injection to buildAnalysisPrompt**

Update signature and add profile block:

```typescript
export function buildAnalysisPrompt(
  chatText: string,
  language: Language,
  gender: Gender,
  profile?: SocialProfile
): string {
  let prompt = language === 'zh' ? ANALYSIS_PROMPT_ZH : ANALYSIS_PROMPT_EN
  const context = gender === 'male'
    ? '用户是男生，正在和一个女生聊天。分析女生的语气和心理。'
    : '用户是女生，正在和一个男生聊天。分析男生的语气和心理。'

  let profileBlock = ''
  if (profile) {
    profileBlock = language === 'zh'
      ? `\n\n## 对方个人资料\n昵称：${profile.displayName}\n简介：${profile.bio}\n${profile.recentPosts.length > 0 ? '最近动态：\n- ' + profile.recentPosts.join('\n- ') : ''}\n\n根据这些资料更准确地分析对方的性格和兴趣。`
      : `\n\n## Their Profile\nDisplay Name: ${profile.displayName}\nBio: ${profile.bio}\n${profile.recentPosts.length > 0 ? 'Recent posts:\n- ' + profile.recentPosts.join('\n- ') : ''}\n\nUse this profile to better understand their personality and interests.`
  }

  return `${prompt}${profileBlock}\n\n${context}\n\nChat content:\n${chatText}`
}
```

- [ ] **Step 2: Add profile injection to buildReplyPrompt**

Update signature and add profile block:

```typescript
export function buildReplyPrompt(
  chatText: string,
  analysis: AgentAnalysis,
  gender: Gender,
  language: Language,
  userStyle: UserStyle,
  sampleMessages: string[] = [],
  targetMessages: ChatMessage[] = [],
  profile?: SocialProfile
): string {
  // ... (existing code stays the same)
```

Add import at top of file:
```typescript
import { Gender, Language, UserStyle, AgentAnalysis, ReplyOption, ChatMessage, SocialProfile } from '@/types'
```

Add profile block construction after `styleInstructions` and before the language-specific branches:

```typescript
let profileBlock = ''
if (profile) {
  profileBlock = language === 'zh'
    ? `\n\n## 对方个人资料（用于个性化回复）\n昵称：${profile.displayName}\n简介：${profile.bio}\n${profile.recentPosts.length > 0 ? '最近动态：\n- ' + profile.recentPosts.join('\n- ') : ''}\n\n根据这些资料，回复要贴合对方的兴趣和个性。`
    : `\n\n## Their Profile (for personalized replies)\nDisplay Name: ${profile.displayName}\nBio: ${profile.bio}\n${profile.recentPosts.length > 0 ? 'Recent posts:\n- ' + profile.recentPosts.join('\n- ') : ''}\n\nUse this profile context to tailor replies to their personality and interests.`
}
```

In the zh branch, insert `profileBlock` after the `## 角色设定` section (after `${genderInst}`):
```typescript
return `你是聊天高手。根据对话历史生成回复选项。

## 角色设定
你是帮"我"（${imLabel}）回复对方（${otherLabel}）的聊天搭子。
${genderInst}
${profileBlock}

## 对话历史...
```

In the en branch, insert `profileBlock` after the `## Role` section:
```typescript
return `You are a dating chat expert. Generate reply options based on the chat history.

## Role
You are a chat wingman helping "me" (${imLabel}) reply to their crush (${otherLabel}).
${gender === 'male' ? 'You are a confident, charming guy...' : 'You are a fun, magnetic girl...'}
${profileBlock}

## Chat history...
```

- [ ] **Step 3: Update callers to pass profile**

Add `SocialProfile` to the import in both `app/api/chat/route.ts` and `app/api/regenerate/route.ts`:

```typescript
// chat/route.ts — update from:
import { Gender, UserStyle, ChatMessage } from '@/types'
// to:
import { Gender, UserStyle, ChatMessage, SocialProfile } from '@/types'

// regenerate/route.ts — update from:
import { AgentAnalysis, Gender, Language, UserStyle, ChatMessage } from '@/types'
// to:
import { AgentAnalysis, Gender, Language, UserStyle, ChatMessage, SocialProfile } from '@/types'
```

**`app/api/chat/route.ts`** — accept `profile` param and pass to prompts:

Update the JSON destructuring:
```typescript
const { chatText, gender, userStyle, sampleMessages, messages, profile } = await req.json() as {
  chatText: string
  gender: Gender
  userStyle: UserStyle
  sampleMessages: string[]
  messages: ChatMessage[]
  profile?: SocialProfile
}
```

Update the `buildAnalysisPrompt` calls:
```typescript
const analysisPromptZH = buildAnalysisPrompt(chatText, 'zh', gender, profile)
const analysisPromptEN = buildAnalysisPrompt(chatText, 'en', gender, profile)
```

Update the `buildReplyPrompt` calls:
```typescript
const replyPromptZH = buildReplyPrompt(chatText, analysisZH, gender, 'zh', userStyle, sampleMessages, targetMessages, profile)
const replyPromptEN = buildReplyPrompt(chatText, analysisEN, gender, 'en', userStyle, sampleMessages, targetMessages, profile)
```

**`app/api/regenerate/route.ts`** — accept `profile` param and pass to prompt:

Update the JSON destructuring:
```typescript
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
```

Update the `buildReplyPrompt` call:
```typescript
const replyPrompt = buildReplyPrompt(chatText, analysis, gender, language, userStyle, sampleMessages, targetMessages, profile)
```

**`app/page.tsx`** — pass profile to API calls:

In `handleSubmit`, add `profile` to the fetch body:
```typescript
body: JSON.stringify({
  chatText: formatted,
  gender: activeSession.gender,
  userStyle,
  sampleMessages: activeSession.sampleMessages || [],
  messages: activeSession.messages,
  profile: activeSession.profile,  // add this
})
```

In `handleRegenerate`, add `profile` to both fetch bodies:
```typescript
body: JSON.stringify({
  chatText: formatted,
  analysis: analysisZH,
  gender: activeSession.gender,
  language: 'zh',
  userStyle,
  sampleMessages: activeSession.sampleMessages || [],
  messages: activeSession.messages,
  profile: activeSession.profile,  // add this
}),
```

```typescript
body: JSON.stringify({
  chatText: formatted,
  analysis: analysisEN || analysisZH,
  gender: activeSession.gender,
  language: 'en',
  userStyle,
  sampleMessages: activeSession.sampleMessages || [],
  messages: activeSession.messages,
  profile: activeSession.profile,  // add this
}),
```

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/agent.ts app/api/chat/route.ts app/api/regenerate/route.ts
git commit -m "feat: inject social profile context into AI prompts"
```

---

### Task 8: Verify end-to-end

- [ ] **Step 1: Start app and test**

Run: `npm run dev`
Expected: App starts on http://localhost:3000

- [ ] **Step 2: Manual test flow**

1. Create a new session
2. In sidebar, click "👤 Profile" to expand
3. Paste an Instagram URL (e.g., `https://instagram.com/example`)
4. Click "Fetch Profile"
5. Verify loading spinner appears and data fills in
6. Edit any field
7. Click "Save"
8. Verify profile shows green indicator dot
9. Add some messages, analyze — verify profile context appears in prompts (check app logs or generated reply quality)
10. Delete profile — verify indicator dot disappears

- [ ] **Step 3: Save final commit**

```bash
git add -A
git commit -m "chore: final tweaks after end-to-end verification"
```
