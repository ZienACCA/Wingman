'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text.trim())
    }
  }

  return (
    <div className="w-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴聊天记录到这里...&#10;&#10;例如：&#10;她：在干嘛&#10;我：在想你啊 😏&#10;她：哈哈哈少来"
        className="w-full h-40 p-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none resize-none bg-white/80"
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
        className="mt-4 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
      >
        {isLoading ? '分析中...' : '生成回复'}
      </button>
    </div>
  )
}
