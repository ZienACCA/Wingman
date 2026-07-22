import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { isEgoBrowserAvailable, fetchProfileWithEgoBrowser } from '@/lib/ego-browser'

const COOKIE_DIR = path.join(process.cwd(), 'session')

function getCookiePath(url: string): string {
  const domain = url.includes('instagram') || url.includes('instagr.am') ? 'instagram' : 'xiaohongshu'
  return path.join(COOKIE_DIR, `cookies_${domain}.json`)
}

const UI_FILTER = /\b(log\s*[iI]n|sign\s*[uU]p|about|blog|jobs|help|api|privacy|terms|language|meta|top|accounts|hashtags|english|download|app|instagram|threads|contact|upload|locations|popular|threads|lite)\b/i

// Common Instagram footer / navigation keywords — single-word lines that aren't posts
const INSTAGRAM_FOOTER = /^(meta|about|blog|jobs|help|api|privacy|terms|locations|popular|languages?|threads?|contact|upload|switch|setting|suggestion|show\s*more\s*posts)/i

// Language names likely to appear in Instagram's language picker
const LANGUAGE_NAMES = /^(afrikaans|العربية|čeština|dansk|deutsch|ελληνικά|español|فارسی|suomi|français|עברית|bahasa\s*indonesia|italiano|日本語|한국어|bahasa\s*melayu|norsk|polski|português|română|русский|slovenčina|svenska|ไทย|tagalog|türkçe|українська|tiếng\s*việt|中文|english|nederlands|magyar|हिन्दी|বাংলা|ગુજરાતી|ಕನ್ನಡ|മലയാളം|मराठी|नेपाली|ਪੰਜਾਬੀ|සිංහල|தமிழ்|తెలుగు|اردو|kiswahili|català|galego|euskara|cрпски|hrvatski|slovenščina|latviešu|lietuvių|eesti|isiXhosa|isiZulu|íslenska|føroyskt|客家语|монгол|azərbaycan|o'zbek)\s*$/i

function filterUILines(lines: string[]): string[] {
  return lines.filter(l => !UI_FILTER.test(l))
}

function parseProfileText(pageText: string, platform: string, url: string): { platform: string; url: string; displayName: string; bio: string; recentPosts: string[]; rawLines: string[] } | null {
  let lines = pageText.split('\n').filter((l: string) => l.trim())
  lines = filterUILines(lines)

  if (lines.length < 3) return null

  // Strip leading "Log In" / "Sign Up" banners — Instagram shows these even when profile loads
  const loginBanner = /^(log\s*in|sign\s*up|register|登录|注册)$/i
  while (lines.length > 0 && loginBanner.test(lines[0].trim())) {
    lines.shift()
  }

  // If after stripping login banner there's nothing real, it's a true login wall
  if (lines.length < 3) return null

  const displayName = lines[0] || 'Unknown'
  let bio = ''
  const recentPosts: string[] = []

  if (platform === 'instagram') {
    // Find stats section: short lines starting with a digit (posts/followers/following)
    const statsIdx = lines.findIndex((l: string) => /^\d/.test(l.trim()) && l.trim().length < 60)

    if (statsIdx > 0 && statsIdx < lines.length - 1) {
      // Count consecutive stat lines
      let statLines = 0
      for (let i = statsIdx; i < lines.length && /^\d/.test(lines[i].trim()) && lines[i].trim().length < 60; i++) {
        statLines++
      }
      // Bio starts after the stats block, collects all lines until footer/action buttons
      const bioStart = Math.min(statsIdx + statLines, lines.length - 1)
      const bioLines: string[] = []
      let postStart = lines.length
      for (let i = bioStart; i < lines.length; i++) {
        const line = lines[i].trim()

        // Stop at action buttons
        if (/^(follow|message|edit|suggest|setting|view)/i.test(line) && line.length < 25) {
          postStart = i + 1
          break
        }

        // Stop at footer / "Show more posts" / location header
        if (INSTAGRAM_FOOTER.test(line) || /^show\s+more\s+posts/i.test(line)) break

        // Stop at single uppercase words (likely nav heading)
        if (/^[A-Z][a-z]{2,14}$/.test(line) && !/^[A-Z][a-z]+$/.test(line)) break
        if (line === 'Locations') break

        // Exclude known UI elements
        if (!/^🖊️|✏️|edit|setting/i.test(line)) {
          bioLines.push(line)
        }
      }
      bio = bioLines.join(' ').trim()
      // Remove trailing 🖊️ if it slipped through
      bio = bio.replace(/🖊️\s*$/, '').trim()

      // Posts — stop at Instagram footer markers
      for (let i = postStart; i < Math.min(lines.length, postStart + 25); i++) {
        const line = lines[i].trim()
        if (INSTAGRAM_FOOTER.test(line)) break
        if (LANGUAGE_NAMES.test(line)) break
        if (/^[A-Z][a-z]{2,14}$/.test(line) && !/^(cosplay|travel|fashion|photo|art|music|food|fitness|gaming|nature|beauty)$/i.test(line)) break
        if (line.length > 6 && !/follow|message|edit|suggest|more|profile|setting|show|meta|about|blog|jobs|help|api|privacy|terms|location|popular/i.test(line)) {
          recentPosts.push(line)
          if (recentPosts.length >= 5) break
        }
      }
    } else {
      bio = lines.slice(1, Math.min(8, lines.length)).join(' ').trim()
    }
  } else {
    bio = lines.slice(1, 4).join(' ').trim()
    for (let i = 2; i < Math.min(lines.length, 12); i++) {
      const line = lines[i].trim()
      if (line.length > 8 && !/note|follower|follow|like|edit|profile/i.test(line)) {
        recentPosts.push(line)
        if (recentPosts.length >= 5) break
      }
    }
  }

  return {
    platform,
    url,
    displayName: displayName || 'Unknown',
    bio: bio || 'No bio available',
    recentPosts,
    rawLines: lines.slice(0, 40),
  }
}

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

    // Try ego-browser first (uses user's real logged-in browser state)
    if (isEgoBrowserAvailable()) {
      const profileData = fetchProfileWithEgoBrowser(url)
      if (profileData.pageText) {
        const result = parseProfileText(profileData.pageText, platform, url)
        if (result) {
          ;(result as any)._source = 'ego-browser'
          result.recentPosts = profileData.captions.length > 0 ? profileData.captions : result.recentPosts
          ;(result as any)._egoDebug = profileData.debug
          if (profileData.error) (result as any)._egoError = profileData.error
          return NextResponse.json(result)
        }
      }
      // Ego-browser failed - include error info in a fallback response
      if (profileData.error || profileData.debug.length > 0) {
        return NextResponse.json({
          error: profileData.error || 'ego-browser returned no page text',
          platform,
          url,
          displayName: '',
          bio: '',
          recentPosts: [],
          rawLines: [],
          _source: 'ego-browser-error',
          _egoDebug: profileData.debug,
        }, { status: 422 })
      }
    }

    // Fallback: use Playwright to scrape
    const { chromium } = require('playwright-core')
    const hasCookies = fs.existsSync(getCookiePath(url))
    const browser = await chromium.launch({ headless: !hasCookies })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()

    // Load saved cookies if available
    const cookiePath = getCookiePath(url)
    if (fs.existsSync(cookiePath)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'))
        await context.addCookies(cookies)
      } catch {}
    }

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(5000)

      // Click any "...more" / "更多" buttons to expand truncated text
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, span, div, a')
        for (const el of buttons) {
          if (/\.\.\.\s*more|…\s*more|更多/i.test(el.textContent || '')) {
            (el as HTMLElement).click()
          }
        }
      })
      await page.waitForTimeout(1000)

      const pageText = await page.evaluate(() => document.body.innerText)

      const result = parseProfileText(pageText, platform, url)
      if (!result) {
        await browser.close()
        // If it looks like a login wall, flag it
        if (platform === 'instagram') {
          const lines = pageText.split('\n').filter((l: string) => l.trim()).slice(0, 3)
          if (lines.length < 3 || /log\s*in|登录|注册|sign\s*up/i.test(lines.join(' '))) {
            return NextResponse.json({ error: 'Instagram requires login to view this profile.', needLogin: true }, { status: 422 })
          }
        }
        return NextResponse.json({ error: 'Could not parse profile. The page structure may have changed.' }, { status: 422 })
      }

      await browser.close()
      return NextResponse.json(result)
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
