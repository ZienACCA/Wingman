'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ReplyOption } from '@/types'

interface ReplyCardsProps {
  replies: ReplyOption[]
}

export function ReplyCards({ replies }: ReplyCardsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)

  const handleCopy = async (reply: ReplyOption) => {
    await navigator.clipboard.writeText(reply.text)
    setCopiedId(reply.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-center">选择一个回复：</h3>
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <p className="text-gray-800 mb-3">{reply.text}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(reply)}
              className="flex-1 py-2 bg-pink-100 text-pink-600 rounded-xl font-medium hover:bg-pink-200 transition-colors"
            >
              {copiedId === reply.id ? '已复制 ✓' : '复制'}
            </button>
            <button
              onClick={() => setShowQR(showQR === reply.id ? null : reply.id)}
              className="py-2 px-4 bg-purple-100 text-purple-600 rounded-xl font-medium hover:bg-purple-200 transition-colors"
            >
              QR
            </button>
          </div>
          {showQR === reply.id && (
            <div className="mt-3 flex justify-center p-4 bg-white rounded-xl">
              <QRCodeSVG value={reply.text} size={150} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
