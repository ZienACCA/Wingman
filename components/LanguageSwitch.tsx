'use client'

import { Language } from '@/types'

interface LanguageSwitchProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export function LanguageSwitch({ language, onLanguageChange }: LanguageSwitchProps) {
  return (
    <div className="flex gap-1 bg-white/80 rounded-xl p-1">
      <button
        onClick={() => onLanguageChange('zh')}
        className={`px-3 py-1 rounded-lg text-sm transition-all ${
          language === 'zh' ? 'bg-pink-500 text-white' : 'text-gray-600'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1 rounded-lg text-sm transition-all ${
          language === 'en' ? 'bg-pink-500 text-white' : 'text-gray-600'
        }`}
      >
        EN
      </button>
    </div>
  )
}
