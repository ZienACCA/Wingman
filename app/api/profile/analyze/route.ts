import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'

export async function POST(req: NextRequest) {
  try {
    const { displayName, bio, recentPosts, language } = await req.json()
    if (!displayName && !bio && (!recentPosts || recentPosts.length === 0)) {
      return NextResponse.json({ error: 'No profile data to analyze' }, { status: 400 })
    }

    const postsText = recentPosts?.length ? recentPosts.slice(0, 5).join('\n') : ''

    const prompt = language === 'zh'
      ? `分析以下社交媒体个人资料，提取关键特征。回复简短精炼（2-3句话），覆盖：兴趣、沟通风格、性格特点。

昵称：${displayName || '未知'}
简介：${bio || '无'}
${postsText ? `最近动态：\n${postsText}` : ''}

输出格式：兴趣：[总结] | 风格：[总结] | 性格：[总结]`
      : `Analyze this social media profile. Extract key traits. Reply briefly (2-3 sentences), covering: interests, communication style, personality traits.

Display Name: ${displayName || 'Unknown'}
Bio: ${bio || 'None'}
${postsText ? `Recent posts:\n${postsText}` : ''}

Output format: Interests: [summary] | Style: [summary] | Personality: [summary]`

    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'LLM call failed' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ analysis: (data.response || '').trim() })
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
