'use client'

import { useState } from 'react'
import { ChatInput } from '@/components/ChatInput'
import { VibeSelector } from '@/components/VibeSelector'
import { ReplyCards } from '@/components/ReplyCards'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { HistoryPanel } from '@/components/HistoryPanel'
import { Vibe, ReplyOption, Conversation, Language, AgentAnalysis } from '@/types'
import { saveConversation } from '@/lib/storage'
import { useTheme } from '@/lib/theme'
import { t } from '@/lib/i18n'

export default function Home() {
  const [vibe, setVibe] = useState<Vibe | null>(null)
  const [replies, setReplies] = useState<ReplyOption[]>([])
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatText, setChatText] = useState('')
  const [language, setLanguage] = useState<Language>('zh')
  const { theme } = useTheme()

  const handleSubmit = async (text: string) => {
    if (!vibe) {
      alert('请先选择一个风格')
      return
    }

    setChatText(text)
    setIsLoading(true)
    setReplies([])
    setAnalysis(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatText: text, vibe }),
      })

      const data = await response.json()
      setAnalysis(data.analysis)
      setReplies(data.replies)

      // Save to history
      const conv: Conversation = {
        id: `conv-${Date.now()}`,
        messages: [{ id: '1', role: 'user', text, timestamp: Date.now() }],
        selectedVibe: vibe,
        replies: data.replies,
        createdAt: Date.now(),
      }
      saveConversation(conv)
    } catch (error) {
      console.error('Error:', error)
      alert('生成失败，请检查 Ollama 是否运行')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {t(language, 'title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(language, 'subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <LanguageSwitch language={language} onLanguageChange={setLanguage} />
          <ThemeToggle />
        </div>
      </div>

      {/* Vibe Selector */}
      <div className="mb-6">
        <VibeSelector selected={vibe} onSelect={setVibe} />
      </div>

      {/* Chat Input */}
      <div className="mb-6">
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Analysis Display */}
      {analysis && (
        <div className="mb-6 p-4 bg-white/80 rounded-2xl">
          <h3 className="font-bold text-sm text-gray-500 mb-2">分析结果</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>语气: {analysis.tone}</div>
            <div>兴趣: {analysis.interestLevel}</div>
            <div>情绪: {analysis.emotionalState}</div>
            <div>阶段: {analysis.relationshipStage}</div>
          </div>
          <p className="mt-2 text-sm text-gray-600">潜台词: {analysis.subtext}</p>
        </div>
      )}

      {/* Reply Cards */}
      {replies.length > 0 && <ReplyCards replies={replies} />}

      {/* History Panel */}
      <HistoryPanel onSelect={(conv) => {
        setVibe(conv.selectedVibe)
        setReplies(conv.replies)
      }} />
    </main>
  )
}
