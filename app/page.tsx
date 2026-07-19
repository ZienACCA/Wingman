'use client'

import { useState, useEffect, useCallback } from 'react'
import { SessionList } from '@/components/SessionList'
import { ChatInput } from '@/components/ChatInput'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Session, Gender, ChatMessage, Language, AgentAnalysis, UserStyle } from '@/types'
import { t, translateAnalysis } from '@/lib/i18n'
import { loadUserStyle, saveUserStyle, analyzeUserStyle } from '@/lib/userStyle'

const STORAGE_KEY = 'flirt-wingman-sessions'

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  const parsed = JSON.parse(data)
  // Migration: add language field to sessions that don't have it
  return parsed.map((s: Session) => s.language ? s : { ...s, language: 'zh' })
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function createDefaultSession(): Session {
  return {
    id: `session-${Date.now()}`,
    name: '',
    messages: [],
    gender: 'male',
    language: 'zh',
    replies: [],
    sampleMessages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userStyle, setUserStyle] = useState<UserStyle>(defaultUserStyle())

  function defaultUserStyle(): UserStyle {
    return {
      formality: 0.3, humor: 0.5, directness: 0.5, warmth: 0.5,
      emojiUsage: 0.3, messageLength: 0.3, avgLength: 20,
      sampleMessages: [], lastUpdated: Date.now(),
    }
  }

  useEffect(() => {
    setUserStyle(loadUserStyle())
    const loaded = loadSessions()
    if (loaded.length === 0) {
      const defaultSession = createDefaultSession()
      setSessions([defaultSession])
      setActiveSessionId(defaultSession.id)
      saveSessions([defaultSession])
    } else {
      setSessions(loaded)
      setActiveSessionId(loaded[0].id)
    }
  }, [])

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const language = activeSession?.language || 'zh'

  const currentAnalysis = language === 'zh'
    ? activeSession?.analysis
    : activeSession?.analysisEN || activeSession?.analysis

  const currentReplies = language === 'zh'
    ? activeSession?.replies || []
    : activeSession?.repliesEN || activeSession?.replies || []

  const updateSession = useCallback(
    (id: string, updates: Partial<Session>) => {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
        )
        saveSessions(next)
        return next
      })
    },
    []
  )

  const handleCreateSession = (name: string) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name,
      messages: [],
      gender: 'male',
      language: 'zh',
      replies: [],
      sampleMessages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const next = [newSession, ...sessions]
    setSessions(next)
    setActiveSessionId(newSession.id)
    saveSessions(next)
  }

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id)
    if (next.length === 0) {
      const defaultSession = createDefaultSession()
      next.push(defaultSession)
      setActiveSessionId(defaultSession.id)
    } else if (activeSessionId === id) {
      setActiveSessionId(next[0].id)
    }
    setSessions(next)
    saveSessions(next)
  }

  const handleRenameSession = (id: string, name: string) => {
    updateSession(id, { name })
  }

  const handleGenderToggle = () => {
    if (activeSessionId && activeSession) {
      updateSession(activeSessionId, {
        gender: activeSession.gender === 'male' ? 'female' : 'male',
      })
    }
  }

  const handleLanguageChange = (lang: Language) => {
    if (activeSessionId) {
      updateSession(activeSessionId, { language: lang })
    }
  }

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
    // Only clear replies for this specific message
    updateSession(activeSessionId, {
      replies: activeSession.replies.filter(r => r.messageId !== messageId),
      repliesEN: activeSession.repliesEN?.filter(r => r.messageId !== messageId),
    })
  }

  const handleMessagesChange = (msgs: ChatMessage[]) => {
    if (activeSessionId) {
      const { style, sampleMessages } = analyzeUserStyle(msgs, userStyle)
      updateSession(activeSessionId, { messages: msgs, sampleMessages })
      setUserStyle(style)
      saveUserStyle(style)
    }
  }

  const handleSubmit = async () => {
    if (!activeSession || !activeSessionId) return

    const filled = activeSession.messages.filter((m) => m.text.trim())
    if (filled.length === 0) return

    setIsLoading(true)

    const otherLabel = activeSession.gender === 'male' ? '她' : '他'
    const formatted = filled
      .map((m) => `${m.role === 'girl' ? otherLabel : '我'}：${m.text.trim()}`)
      .join('\n')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatText: formatted,
          gender: activeSession.gender,
          userStyle,
          sampleMessages: activeSession.sampleMessages || [],
          messages: activeSession.messages,
        }),
      })

      const data = await response.json()
      updateSession(activeSessionId, {
        analysis: data.analysisZH,
        analysisEN: data.analysisEN,
        replies: data.repliesZH,
        repliesEN: data.repliesEN,
      })
    } catch (error) {
      console.error('Error:', error)
      alert('生成失败，请检查 Ollama 是否运行')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!activeSession || !activeSessionId) return

    const filled = activeSession.messages.filter((m) => m.text.trim())
    if (filled.length === 0) return

    const analysisZH = activeSession.analysis
    const analysisEN = activeSession.analysisEN
    if (!analysisZH) return

    setIsLoading(true)

    const otherLabel = activeSession.gender === 'male' ? '她' : '他'
    const formatted = filled
      .map((m) => `${m.role === 'girl' ? otherLabel : '我'}：${m.text.trim()}`)
      .join('\n')

    try {
      const [resZH, resEN] = await Promise.all([
        fetch('/api/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatText: formatted,
            analysis: analysisZH,
            gender: activeSession.gender,
            language: 'zh',
            userStyle,
            sampleMessages: activeSession.sampleMessages || [],
            messages: activeSession.messages,
          }),
        }).then(r => r.json()),
        fetch('/api/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatText: formatted,
            analysis: analysisEN || analysisZH,
            gender: activeSession.gender,
            language: 'en',
            userStyle,
            sampleMessages: activeSession.sampleMessages || [],
            messages: activeSession.messages,
          }),
        }).then(r => r.json()),
      ])

      updateSession(activeSessionId, {
        replies: resZH.replies,
        repliesEN: resEN.replies,
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={setActiveSessionId}
        onCreate={handleCreateSession}
        onRename={handleRenameSession}
        onDelete={handleDeleteSession}
        language={language}
      />

      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {activeSession ? (
          <>
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#313d45]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold">
                  {(activeSession.name || t(language, 'newSession')).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {activeSession.name || t(language, 'newSession')}
                  </h3>
                  <p className="text-[#8696a0] text-xs">
                    {activeSession.gender === 'male' ? t(language, 'genderMale') : t(language, 'genderFemale')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitch language={language} onLanguageChange={handleLanguageChange} />
                <button
                  onClick={handleGenderToggle}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSession.gender === 'male'
                      ? 'bg-[#005c4b] text-white'
                      : 'bg-[#6b4fa0] text-white'
                  }`}
                >
                  {activeSession.gender === 'male' ? '🧑' : '👩'}{' '}
                  {activeSession.gender === 'male' ? t(language, 'genderMale') : t(language, 'genderFemale')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatInput
                messages={activeSession.messages}
                onMessagesChange={handleMessagesChange}
                isLoading={isLoading}
                language={language}
                replies={currentReplies}
                onReplyClick={handleReplyClick}
                analysis={currentAnalysis || null}
                gender={activeSession.gender}
                sessionName={activeSession.name}
              />
            </div>

            <div className="px-4 py-3 bg-[#202c33] border-t border-[#313d45]">
              <button
                onClick={handleSubmit}
                disabled={
                  activeSession.messages.filter((m) => m.text.trim()).length === 0 || isLoading
                }
                className="w-full py-3 bg-[#00a884] hover:bg-[#06cf9c] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t(language, 'analyzing') : t(language, 'analyze')}
              </button>
              {currentReplies.length > 0 && !isLoading && (
                <button
                  onClick={handleRegenerate}
                  className="w-full mt-2 py-2 bg-[#2a3942] hover:bg-[#3b4d57] text-[#d1d7db] rounded-lg text-sm font-medium transition-colors"
                >
                  {language === 'zh' ? '🔄 换一批回复' : '🔄 Regenerate replies'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#8696a0]">{t(language, 'newSession')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
