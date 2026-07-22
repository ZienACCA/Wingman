'use client'

import { useState, useEffect } from 'react'
import { SocialProfile, Language } from '@/types'
import { t } from '@/lib/i18n'

interface SocialProfilePanelProps {
  profile?: SocialProfile
  language: Language
  onSave: (profile: SocialProfile) => void
  onDelete: () => void
  noBorder?: boolean
  compact?: boolean
}

export function SocialProfilePanel({ profile, language, onSave, onDelete, noBorder, compact }: SocialProfilePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState(profile?.url || '')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState('')
  const [hasFetched, setHasFetched] = useState(!!profile)
  const [statusMsg, setStatusMsg] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (profile) {
      setUrl(profile.url)
      setDisplayName(profile.displayName)
      setBio(profile.bio)
      setHasFetched(true)
      if (profile.displayName || profile.bio) {
        handleAnalyze(profile.displayName, profile.bio)
      }
    } else {
      setUrl('')
      setDisplayName('')
      setBio('')
      setHasFetched(false)
      setError('')
      setAnalysis('')
    }
  }, [profile])

  const handleFetch = async () => {
    if (!url.trim()) return
    setIsFetching(true)
    setError('')

    try {
      const res = await fetch('/api/profile/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        if (res.status === 422) {
          setHasFetched(true)
        }
        setIsFetching(false)
        return
      }

      setDisplayName(data.displayName || '')
      setBio(data.bio || '')
      setHasFetched(true)
    } catch {
      setError(t(language, 'profile.fetchError'))
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = () => {
    if (!url.trim()) return
    onSave({
      platform: url.toLowerCase().includes('xiaohongshu') || url.toLowerCase().includes('xhslink') ? 'xiaohongshu' : 'instagram',
      url: url.trim(),
      displayName: displayName.trim(),
      bio: bio.trim(),
      recentPosts: [],
      lastFetched: Date.now(),
    })
    setStatusMsg(language === 'zh' ? '✅ 已保存' : '✅ Saved')
    setTimeout(() => setStatusMsg(''), 2000)
    handleAnalyze(displayName, bio)
  }

  const handleAnalyze = async (name?: string, bioText?: string) => {
    const n = name || displayName
    const b = bioText || bio
    if (!n.trim() && !b.trim()) return
    setIsAnalyzing(true)
    setAnalysis('')

    try {
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: n.trim(),
          bio: b.trim(),
          recentPosts: [],
          language,
        }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch {
      // silent
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className={noBorder ? '' : 'border-t border-[#313d45]'}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-[#d1d7db] hover:text-white transition-colors text-xs ${
          compact ? 'px-0 py-0.5' : 'w-full px-4 py-3 hover:bg-[#202c33] text-sm font-medium'
        }`}
      >
        <span className="text-[#8696a0]">👤</span>
        {profile && <span className="text-[#00a884] text-xs ml-auto">●</span>}
        <svg
          className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={`space-y-2 text-sm ${compact ? 'px-0 pb-2' : 'px-4 pb-4'}`}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t(language, 'profile.urlPlaceholder')}
            className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm placeholder:text-[#8696a0]"
          />

          <button
            onClick={handleFetch}
            disabled={isFetching || !url.trim()}
            className="w-full py-1.5 bg-[#005c4b] hover:bg-[#007a5c] disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
          >
            {isFetching ? t(language, 'profile.fetching') : t(language, 'profile.fetch')}
          </button>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {hasFetched && (
            <>
              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.displayName')}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg text-sm transition-colors"
                >
                  {t(language, 'profile.save')}
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setStatusMsg(language === 'zh' ? '🗑️ 已删除' : '🗑️ Deleted')
                    setTimeout(() => setStatusMsg(''), 2000)
                  }}
                  className="py-1.5 px-3 bg-[#2a3942] hover:bg-[#3b4d57] text-[#8696a0] rounded-lg text-sm transition-colors"
                >
                  🗑️
                </button>
              </div>

              {(displayName.trim() || bio.trim()) && (
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  className="w-full py-1.5 bg-[#2a3942] hover:bg-[#3b4d57] disabled:opacity-50 text-[#d1d7db] rounded-lg text-sm transition-colors"
                >
                  {isAnalyzing
                    ? (language === 'zh' ? '🔍 分析中...' : '🔍 Analyzing...')
                    : (language === 'zh' ? '🔍 分析个人资料' : '🔍 Analyze Profile')}
                </button>
              )}

              {analysis && (
                <div className="bg-[#1f2c33] rounded-lg p-2.5 text-xs text-[#d1d7db] leading-relaxed">
                  {analysis}
                </div>
              )}

              {profile?.lastFetched && (
                <p className="text-[#8696a0] text-xs">
                  {t(language, 'profile.lastFetched')}{' '}
                  {new Date(profile.lastFetched).toLocaleString()}
                </p>
              )}
              {statusMsg && (
                <p className="text-[#00a884] text-xs">{statusMsg}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
