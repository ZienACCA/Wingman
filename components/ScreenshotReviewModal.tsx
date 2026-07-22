'use client'

import { useState } from 'react'
import { Language } from '@/types'
import { t } from '@/lib/i18n'

interface ScreenshotReviewModalProps {
  messages: { sender: string; text: string; replyTo?: string; replyToRole?: 'user' | 'girl' }[]
  onAdd: (messages: { sender: string; text: string; replyTo?: string; replyToRole?: 'user' | 'girl' }[]) => void
  onClose: () => void
  language: Language
}

export function ScreenshotReviewModal({ messages, onAdd, onClose, language }: ScreenshotReviewModalProps) {
  const [selected, setSelected] = useState<Record<number, boolean>>(
    () => Object.fromEntries(messages.map((_, i) => [i, true]))
  )

  const selectedCount = Object.values(selected).filter(Boolean).length

  const handleToggle = (index: number) => {
    setSelected(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handleAddAll = () => {
    const selectedMessages = messages.filter((_, i) => selected[i])
    onAdd(selectedMessages)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#0b141a] rounded-xl shadow-xl w-[90vw] max-w-[400px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#313d45]">
          <h3 className="text-white font-semibold text-base">
            {t(language, 'upload.modal.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-[#8696a0] text-sm mb-3">
            {t(language, 'upload.modal.detected')}
          </p>

          {messages.length === 0 ? (
            <p className="text-[#8696a0] text-sm text-center py-4">
              {t(language, 'upload.modal.noMessages')}
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <label
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#202c33] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected[index] ?? true}
                    onChange={() => handleToggle(index)}
                    className="mt-0.5 w-4 h-4 accent-[#00a884] rounded"
                  />
                  <span className="text-white text-sm">
                    <span className="font-medium text-[#00a884]">{msg.sender}:</span>{' '}
                    {msg.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[#313d45]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#8696a0] hover:text-white transition-colors text-sm"
          >
            {t(language, 'upload.modal.cancel')}
          </button>
          <button
            onClick={handleAddAll}
            disabled={selectedCount === 0}
            className="px-4 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            {t(language, 'upload.modal.addAll')} ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  )
}
