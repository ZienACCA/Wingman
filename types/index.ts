export type Vibe = 'smooth' | 'funny' | 'bold' | 'sweet' | 'cool'

export interface VibeOption {
  id: Vibe
  name: string
  nameEn: string
  emoji: string
  description: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'girl'
  text: string
  timestamp: number
}

export interface Conversation {
  id: string
  messages: ChatMessage[]
  selectedVibe: Vibe
  replies: ReplyOption[]
  createdAt: number
}

export interface ReplyOption {
  id: string
  text: string
  explanation?: string
}

export interface AgentAnalysis {
  tone: string
  interestLevel: 'high' | 'medium' | 'low'
  emotionalState: string
  relationshipStage: string
  subtext: string
}

export type Theme = 'playful' | 'cute'
export type Language = 'zh' | 'en'
