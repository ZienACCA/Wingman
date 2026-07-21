'use client'

import { useState } from 'react'
import { Session, SocialProfile, Language } from '@/types'
import { SocialProfilePanel } from './SocialProfilePanel'
import { updateSessionProfile, deleteSessionProfile } from '@/lib/storage'
import { t } from '@/lib/i18n'

interface SessionListProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  language: Language
  activeSession?: Session
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  language,
  activeSession,
}: SessionListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      onRename(id, editingName.trim())
    }
    setEditingId(null)
  }

  const startEditing = (session: Session) => {
    setEditingId(session.id)
    setEditingName(session.name)
  }

  return (
    <div className="w-80 bg-[#111b21] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-[#202c33] flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">{t(language, 'title')}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="text-[#00a884] hover:text-[#06cf9c] transition-colors text-2xl leading-none"
          title={t(language, 'newSession')}
        >
          +
        </button>
      </div>

      {/* New session input */}
      {isCreating && (
        <div className="p-3 bg-[#202c33] border-b border-[#313d45]">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setIsCreating(false)
            }}
            onBlur={() => {
              if (!newName.trim()) setIsCreating(false)
            }}
            placeholder={t(language, 'sessionPlaceholder')}
            className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm placeholder:text-[#8696a0]"
          />
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && !isCreating && (
          <p className="text-[#8696a0] text-sm text-center py-8 px-4">
            {t(language, 'newSession')} — {t(language, 'emptyChat')}
          </p>
        )}

        {sessions.map((session) => {
          const lastMsg = session.messages[session.messages.length - 1]
          const isActive = session.id === activeSessionId
          const isEditing = editingId === session.id
          const displayName = session.name || t(language, 'newSession')

          return (
            <div
              key={session.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
              }`}
              onClick={() => onSelect(session.id)}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(session.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={() => handleRename(session.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#2a3942] text-white text-sm font-medium px-2 py-0.5 rounded outline-none border border-[#00a884] min-w-0 flex-1"
                    />
                  ) : (
                    <span
                      className="text-white font-medium truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startEditing(session)
                      }}
                    >
                      {displayName}
                    </span>
                  )}
                  <span className="text-[#8696a0] text-xs flex-shrink-0 ml-2">
                    {new Date(session.updatedAt).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[#8696a0] text-sm truncate mt-0.5">
                  {lastMsg?.text || t(language, 'empty')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startEditing(session)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8696a0] hover:text-[#00a884] text-sm p-1"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8696a0] hover:text-red-400 text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {activeSession && (
        <SocialProfilePanel
          profile={activeSession.profile}
          language={language}
          onSave={(profile) => updateSessionProfile(activeSession.id, profile)}
          onDelete={() => deleteSessionProfile(activeSession.id)}
        />
      )}
    </div>
  )
}
