'use client'

import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('playful')}
        className={`px-4 py-2 rounded-xl transition-all ${
          theme === 'playful'
            ? 'bg-pink-500 text-white'
            : 'bg-pink-100 text-pink-600'
        }`}
      >
        🎀 Playful
      </button>
      <button
        onClick={() => setTheme('cute')}
        className={`px-4 py-2 rounded-xl transition-all ${
          theme === 'cute'
            ? 'bg-purple-500 text-white'
            : 'bg-purple-100 text-purple-600'
        }`}
      >
        🌈 Cute
      </button>
    </div>
  )
}
