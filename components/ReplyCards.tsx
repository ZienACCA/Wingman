'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ReplyOption, Language } from '@/types'
import { t } from '@/lib/i18n'

interface ReplyCardsProps {
  replies: ReplyOption[]
  language: Language
}

export function ReplyCards({ replies, language }: ReplyCardsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)

  const handleCopy = async (reply: ReplyOption) => {
    await navigator.clipboard.writeText(reply.text)
    setCopiedId(reply.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#00a884] text-center">
        {t(language, 'selectReply')}
      </h3>
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="p-3 bg-[#202c33] rounded-lg"
        >
          <p className="text-[#e9edef] text-sm mb-3">{reply.text}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(reply)}
              className="flex-1 py-1.5 bg-[#005c4b] text-white rounded-lg text-sm font-medium hover:bg-[#007a5c] transition-colors"
            >
              {copiedId === reply.id ? t(language, 'copied') : t(language, 'copy')}
            </button>
            <button
              onClick={() => setShowQR(showQR === reply.id ? null : reply.id)}
              className="py-1.5 px-4 bg-[#2a3942] text-[#d1d7db] rounded-lg text-sm font-medium hover:bg-[#3b4d57] transition-colors"
            >
              {t(language, 'qr')}
            </button>
          </div>
          {showQR === reply.id && (
            <div className="mt-3 flex justify-center p-3 bg-white rounded-lg">
              <QRCodeSVG value={reply.text} size={120} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
