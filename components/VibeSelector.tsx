'use client'

import { Vibe, VibeOption } from '@/types'

const VIBES: VibeOption[] = [
  { id: 'smooth', name: '撩', nameEn: 'Smooth', emoji: '😏', description: '自信有魅力' },
  { id: 'funny', name: '逗', nameEn: 'Funny', emoji: '😂', description: '幽默有趣' },
  { id: 'bold', name: '冲', nameEn: 'Bold', emoji: '🔥', description: '直接大胆' },
  { id: 'sweet', name: '暖', nameEn: 'Sweet', emoji: '🌸', description: '温暖真诚' },
  { id: 'cool', name: '酷', nameEn: 'Cool', emoji: '🧊', description: '轻松淡定' },
]

interface VibeSelectorProps {
  selected: Vibe | null
  onSelect: (vibe: Vibe) => void
}

export function VibeSelector({ selected, onSelect }: VibeSelectorProps) {
  return (
    <div className="flex gap-3 justify-center">
      {VIBES.map((vibe) => (
        <button
          key={vibe.id}
          onClick={() => onSelect(vibe.id)}
          className={`
            flex flex-col items-center p-4 rounded-2xl transition-all
            ${selected === vibe.id
              ? 'bg-pink-500 text-white scale-110 shadow-lg'
              : 'bg-white/80 hover:bg-white hover:scale-105'
            }
          `}
        >
          <span className="text-3xl">{vibe.emoji}</span>
          <span className="mt-1 font-bold">{vibe.name}</span>
          <span className="text-xs opacity-75">{vibe.description}</span>
        </button>
      ))}
    </div>
  )
}
