'use client'

import { useState, useEffect } from 'react'
import { Conversation } from '@/types'
import { getHistory, deleteConversation } from '@/lib/storage'

interface HistoryPanelProps {
  onSelect: (conv: Conversation) => void
}

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [history, setHistory] = useState<Conversation[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleDelete = (id: string) => {
    deleteConversation(id)
    setHistory(getHistory())
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        📋
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-80 bg-white h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">历史记录</h3>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500">暂无历史记录</p>
            ) : (
              <div className="space-y-2">
                {history.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      onSelect(conv)
                      setIsOpen(false)
                    }}
                  >
                    <p className="text-sm truncate">
                      {conv.messages[conv.messages.length - 1]?.text || 'Empty'}
                    </p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(conv.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(conv.id)
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
