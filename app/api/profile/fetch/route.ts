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
        const lines = pageText.split('\n').filter((l: string) => l.trim())
        displayName = lines[0] || ''
        const bioStart = 1
        const bioEnd = lines.findIndex((l: string, i: number) => i > bioStart && /follower|post/i.test(l))
        bio = bioEnd > bioStart ? lines.slice(bioStart, bioEnd).join(' ').trim() : lines.slice(bioStart, 5).join(' ').trim()
        const postsStart = bioEnd > 0 ? bioEnd + 2 : 5
        for (let i = postsStart; i < Math.min(lines.length, postsStart + 10); i++) {
          const line = lines[i].trim()
          if (line.length > 10 && !/follow|post|follower|following|edit|profile/i.test(line)) {
            recentPosts.push(line)
            if (recentPosts.length >= 5) break
          }
        }
      } else {
        const lines = pageText.split('\n').filter((l: string) => l.trim())
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
