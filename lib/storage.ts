import { Session } from '@/types'

const STORAGE_KEY = 'flirt-wingman-sessions'

export function getHistory(): Session[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveConversation(conv: Session): void {
  const history = getHistory()
  history.unshift(conv)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)))
}

export function deleteConversation(id: string): void {
  const history = getHistory().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}
