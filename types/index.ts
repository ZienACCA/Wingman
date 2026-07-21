export type Gender = 'male' | 'female'
export type Language = 'zh' | 'en'

export interface UserStyle {
  formality: number    // 0=casual slang, 1=formal
  humor: number        // 0=serious, 1=very funny
  directness: number   // 0=indirect/hinting, 1=direct/blunt
  warmth: number       // 0=cold/detached, 1=warm/caring
  emojiUsage: number   // 0=no emoji, 1=heavy emoji
  messageLength: number // 0=short fragments, 1=longer messages
  avgLength: number
  sampleMessages: string[]
  lastUpdated: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'girl'
  text: string
  timestamp: number
  replyToId?: string
  replyToText?: string
  replyToRole?: 'user' | 'girl'
}

export interface SocialProfile {
  platform: 'instagram' | 'xiaohongshu'
  url: string
  displayName: string
  bio: string
  recentPosts: string[]
  lastFetched?: number
}

export interface Session {
  id: string
  name: string
  messages: ChatMessage[]
  gender: Gender
  language: Language
  replies: ReplyOption[]
  repliesEN?: ReplyOption[]
  analysis?: AgentAnalysis
  analysisEN?: AgentAnalysis
  sampleMessages: string[]
  createdAt: number
  updatedAt: number
  profile?: SocialProfile
}

export interface ReplyOption {
  id: string
  text: string
  explanation?: string
  messageId: string
}

export interface AgentAnalysis {
  tone: string
  interestLevel: 'high' | 'medium' | 'low'
  emotionalState: string
  relationshipStage: string
  subtext: string
}
