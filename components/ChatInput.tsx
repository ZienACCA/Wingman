'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, ReplyOption, Language, AgentAnalysis, Gender } from '@/types'
import { t, translateAnalysis, addMsgLabel } from '@/lib/i18n'

interface ChatInputProps {
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  isLoading: boolean
  language: Language
  replies: ReplyOption[]
  onReplyClick: (text: string, messageId: string, replyToId?: string, replyToText?: string) => void
  analysis: AgentAnalysis | null
  gender: Gender
}

export function ChatInput({ messages, onMessagesChange, isLoading, language, replies, onReplyClick, analysis, gender }: ChatInputProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, replies])

  const addMessage = (role: 'her' | 'my') => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: role === 'her' ? 'girl' : 'user',
      text: '',
      timestamp: Date.now(),
    }
    onMessagesChange([...messages, newMsg])
    setEditingId(newMsg.id)
  }

  const updateMessage = (id: string, text: string) => {
    onMessagesChange(messages.map((m) => (m.id === id ? { ...m, text } : m)))
  }

  const removeMessage = (id: string) => {
    onMessagesChange(messages.filter((m) => m.id !== id))
  }

  const cancelReply = () => setReplyTo(null)

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setEditingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && !analysis && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#8696a0] text-sm">{t(language, 'emptyChat')}</p>
          </div>
        )}

        {/* Analysis card at top */}
        {analysis && (
          <div className="mx-auto max-w-[85%] mb-3 p-3 bg-[#1a2830] rounded-lg border border-[#313d45]">
            <h4 className="text-[#00a884] font-bold text-xs mb-1.5">
              {t(language, 'analysisTitle')}
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs text-[#d1d7db]">
              <div>{t(language, 'tone')}: {translateAnalysis(language, analysis.tone)}</div>
              <div>{t(language, 'interest')}: {translateAnalysis(language, analysis.interestLevel)}</div>
              <div>{t(language, 'emotion')}: {translateAnalysis(language, analysis.emotionalState)}</div>
              <div>{t(language, 'stage')}: {translateAnalysis(language, analysis.relationshipStage)}</div>
            </div>
            <p className="mt-1.5 text-xs text-[#8696a0]">
              {t(language, 'subtext')}: {analysis.subtext}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isHer = msg.role === 'girl'
          const isEditing = editingId === msg.id

          return (
            <div
              key={msg.id}
              className={`flex ${isHer ? 'justify-start' : 'justify-end'} group`}
            >
              <div
                className={`relative max-w-[75%] px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  isHer
                    ? 'bg-[#202c33] text-white rounded-tl-none'
                    : 'bg-[#005c4b] text-white rounded-tr-none'
                } ${isEditing ? 'ring-1 ring-[#00a884]' : ''}`}
                onClick={() => setEditingId(msg.id)}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={msg.text}
                    onChange={(e) => {
                      updateMessage(msg.id, e.target.value)
                    }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement
                      t.style.height = 'auto'
                      t.style.height = t.scrollHeight + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => setEditingId(null)}
                    rows={1}
                    className="w-full min-w-[320px] max-w-[75vw] bg-transparent outline-none text-white resize-none leading-snug box-border overflow-hidden"
                    placeholder={isHer ? addMsgLabel(language, gender, 'her') : addMsgLabel(language, gender, 'my')}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto'
                        el.style.height = el.scrollHeight + 'px'
                      }
                    }}
                  />
                ) : (
                  <span className="whitespace-pre-wrap break-words text-sm">
                    {msg.text || (isHer ? addMsgLabel(language, gender, 'her') : addMsgLabel(language, gender, 'my'))}
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMessage(msg.id)
                  }}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}

        {/* AI reply suggestions grouped by message */}
        {replies.length > 0 && (() => {
          // Group replies by messageId
          const grouped = replies.reduce<Record<string, ReplyOption[]>>((acc, reply) => {
            if (!acc[reply.messageId]) acc[reply.messageId] = []
            acc[reply.messageId].push(reply)
            return acc
          }, {})

          const otherLabel = language === 'en'
            ? (gender === 'male' ? 'She' : 'He')
            : (gender === 'male' ? '她' : '他')

          return (
            <div className="space-y-3 mt-2">
              <div className="text-center text-[#8696a0] text-xs mb-1">
                {language === 'zh' ? '💡 点击直接使用' : '💡 Click to use'}
              </div>
              {Object.entries(grouped).map(([msgId, msgReplies]) => {
                // Find the original message text
                const originalMsg = messages.find(m => m.id === msgId)
                const msgText = originalMsg?.text || ''

                return (
                  <div key={msgId} className="space-y-1">
                    {/* Show the message being replied to */}
                    {msgText && (
                      <div className="flex items-start gap-2 px-2">
                        <span className="text-[#8696a0] text-xs shrink-0 mt-0.5">
                          {otherLabel}:
                        </span>
                        <span className="text-[#d1d7db] text-xs leading-relaxed">
                          {msgText}
                        </span>
                      </div>
                    )}
                    {/* Reply options for this message */}
                    {msgReplies.map((reply) => (
                      <div key={reply.id} className="flex justify-end">
                        <button
                          onClick={() => {
                            onReplyClick(reply.text, reply.messageId, replyTo?.id, replyTo?.text)
                            setReplyTo(null)
                          }}
                          className="max-w-[85%] px-3 py-2 bg-[#005c4b]/60 hover:bg-[#005c4b] text-white rounded-lg rounded-tr-none text-left text-sm transition-colors border border-[#00a884]/30 hover:border-[#00a884]"
                        >
                          {reply.text}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })()}

        <div ref={chatEndRef} />
      </div>

      {/* Add message buttons */}
      <div className="px-4 py-2 bg-[#202c33] flex gap-2 border-t border-[#313d45]">
        <button
          onClick={() => addMessage('her')}
          className="flex-1 py-2 bg-[#2a3942] hover:bg-[#3b4d57] text-[#d1d7db] rounded-lg font-medium transition-colors text-sm"
        >
          {addMsgLabel(language, gender, 'her')}
        </button>
        <button
          onClick={() => addMessage('my')}
          className="flex-1 py-2 bg-[#005c4b] hover:bg-[#007a5c] text-white rounded-lg font-medium transition-colors text-sm"
        >
          {addMsgLabel(language, gender, 'my')}
        </button>
      </div>
    </div>
  )
}
