'use client'

import { useState, useEffect } from 'react'
import { SocialProfile, Language } from '@/types'
import { t } from '@/lib/i18n'

interface SocialProfilePanelProps {
  profile?: SocialProfile
  language: Language
  onSave: (profile: SocialProfile) => void
  onDelete: () => void
}

export function SocialProfilePanel({ profile, language, onSave, onDelete }: SocialProfilePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState(profile?.url || '')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [postsText, setPostsText] = useState(profile?.recentPosts?.join('\n') || '')
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState('')
  const [hasFetched, setHasFetched] = useState(!!profile)

  useEffect(() => {
    if (profile) {
      setUrl(profile.url)
      setDisplayName(profile.displayName)
      setBio(profile.bio)
      setPostsText(profile.recentPosts?.join('\n') || '')
      setHasFetched(true)
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

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to fetch profile')
        setIsFetching(false)
        return
      }

      setDisplayName(data.displayName || '')
      setBio(data.bio || '')
      setPostsText((data.recentPosts || []).join('\n'))
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
      recentPosts: postsText.split('\n').filter(l => l.trim()).map(l => l.trim()),
      lastFetched: Date.now(),
    })
  }

  return (
    <div className="border-t border-[#313d45]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-[#d1d7db] hover:bg-[#202c33] transition-colors text-sm font-medium"
      >
        <span className="text-[#8696a0]">👤</span>
        {t(language, 'profile.title')}
        {profile && <span className="text-[#00a884] text-xs ml-auto">●</span>}
        <svg
          className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2 text-sm">
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

              <div>
                <label className="text-[#8696a0] text-xs block mb-0.5">{t(language, 'profile.recentPosts')}</label>
                <textarea
                  value={postsText}
                  onChange={(e) => setPostsText(e.target.value)}
                  rows={3}
                  placeholder={t(language, 'profile.postsPlaceholder')}
                  className="w-full px-3 py-2 bg-[#2a3942] text-white rounded-lg outline-none text-sm resize-none placeholder:text-[#8696a0]"
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
                  onClick={onDelete}
                  className="py-1.5 px-3 bg-[#2a3942] hover:bg-[#3b4d57] text-[#8696a0] rounded-lg text-sm transition-colors"
                >
                  🗑️
                </button>
              </div>

              {profile?.lastFetched && (
                <p className="text-[#8696a0] text-xs">
                  {t(language, 'profile.lastFetched')}{' '}
                  {new Date(profile.lastFetched).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
