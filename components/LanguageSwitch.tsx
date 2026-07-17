'use client'

import { Language } from '@/types'

interface LanguageSwitchProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export function LanguageSwitch({ language, onLanguageChange }: LanguageSwitchProps) {
  return (
    <div className="flex gap-1 bg-[#2a3942] rounded-lg p-1">
      <button
        onClick={() => onLanguageChange('zh')}
        className={`px-2 py-1 rounded text-xs transition-all ${
          language === 'zh' ? 'bg-[#00a884] text-white' : 'text-[#8696a0] hover:text-white'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-2 py-1 rounded text-xs transition-all ${
          language === 'en' ? 'bg-[#00a884] text-white' : 'text-[#8696a0] hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
