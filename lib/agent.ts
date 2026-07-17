import { Gender, Language, UserStyle, AgentAnalysis, ReplyOption, ChatMessage } from '@/types'
import { styleToInstructions } from '@/lib/userStyle'

const ANALYSIS_PROMPT_ZH = `你是聊天军师+心理分析师。分析下面的对话，用JSON返回分析结果。

注意：对话中可能包含网络用语、缩写、emoji、 Gen Z 用语，你需要理解这些表达的真实含义。
常见网络用语参考：
- yyds = 永远的神
- 绝绝子 = 太绝了
- 破防了 = 被触动/感动/受伤
- emmm = 犹豫/无语
- 哈哈哈/笑死 = 觉得好笑
- 哈 = 敷衍的笑
- 666 = 厉害
- xswl = 笑死我了
- awsl = 啊我死了（太可爱了）
- dbq = 对不起
- pyq = 朋友圈
- ？？？ = 不理解/震惊
- ... = 无语/不想回
- 嗯/哦 = 敷衍
- 在吗/在干嘛 = 想聊天
- 吃饭了吗 = 关心你
- 晚安 = 想你/结束对话
- hhh = 笑
- ！ = 兴奋/强调
- 哈哈哈少来 = 傲娇/撒娇
- 讨厌 = 喜欢（反话）
- 你好烦 = 喜欢你
- 谁要你管 = 想让你管

分析维度：
1. tone - 对方的语气（playful/serious/dry/warm/cold）
2. interestLevel - 对方对你有意思没（high/medium/low）
3. emotionalState - 对方现在啥心情
4. relationshipStage - 你们啥关系（strangers/acquaintances/flirting/dating）
5. subtext - 对方嘴上说的和心里想的差多远（用中文回答）

所有字段值都必须用中文。只返回JSON，不要其他内容。`

const ANALYSIS_PROMPT_EN = `You are a dating chat analyst + psychological profiler. Analyze the chat below and return results in JSON.

CRITICAL RULE: You MUST respond entirely in English. Every single field value MUST be in English. No Chinese characters allowed anywhere in your response.

IMPORTANT: The chat may contain internet slang, abbreviations, and Gen Z text speak. You MUST understand these:
- wyd = what (are) you doing
- hbu = how about you
- idk = I don't know
- lol = laughing out loud
- lmao = laughing my ass off
- omg = oh my god
- tbh = to be honest
- ngl = not gonna lie
- fr = for real
- imo = in my opinion
- brb = be right back
- gtg = got to go
- sup = what's up
- hey/hi/hello = greeting
- k/ok/okay = okay
- np = no problem
- ty = thank you
- yw = you're welcome
- ily = I love you
- smh = shaking my head
- fwiw = for what it's worth
- afaik = as far as I know
- eta = estimated time of arrival
- btw = by the way
- rn = right now
- ttyl = talk to you later
- xoxo = hugs and kisses
- <3 = heart
- ;) = flirting/wink
- :P = playful/tongue out
- lmk = let me know
- nvm = never mind
- ofc = of course
- pls/plz = please
- ur = your/you're
- r = are
- u = you
- 2 = to/too
- 4 = for
- b4 = before
- gr8 = great
- l8r = later
-msg = message
- thx/tnx = thanks
- np = no problem
- wyd = what you doing
- hmu = hit me up
- ngl = not gonna lie
- istg = I swear to god
- lowkey = somewhat/slightly
- highkey = very much
- vibes = mood/energy
- aesthetic = visually pleasing
- slay = doing great
- periodt = emphasis/end of discussion
- no cap = no lie/for real
- bet = okay/sure/alright
- sus = suspicious
- mid = mediocre
- rent free = can't stop thinking about
- main character = center of attention
- touch grass = go outside
- based = agreeable/admirable
- cringe = embarrassing

Analysis dimensions:

1. tone - Their texting tone (playful/serious/dry/warm/cold)
2. interestLevel - Interest level in you (high/medium/low)
3. emotionalState - Their current emotional state (in English, e.g. "happy", "excited", "bored")
4. relationshipStage - Your relationship stage (strangers/acquaintances/flirting/dating)
5. subtext - Gap between what they say and what they mean (write this ENTIRELY in English)

REMEMBER: Every value including subtext MUST be written in English. No Chinese characters. Return ONLY the JSON.`

const GENDER_INSTRUCTIONS: Record<Gender, string> = {
  male: '你是帮男生追女生的聊天搭子。回复要自然有趣，别舔狗，要有自己的态度。',
  female: '你是帮女生追男生的聊天搭子。回复要可爱自然，别太主动，要有分寸感。',
}

export function buildAnalysisPrompt(chatText: string, language: Language, gender: Gender): string {
  const prompt = language === 'zh' ? ANALYSIS_PROMPT_ZH : ANALYSIS_PROMPT_EN
  const context = gender === 'male'
    ? '用户是男生，正在和一个女生聊天。分析女生的语气和心理。'
    : '用户是女生，正在和一个男生聊天。分析男生的语气和心理。'
  return `${prompt}\n\n${context}\n\nChat content:\n${chatText}`
}

export function buildReplyPrompt(
  chatText: string,
  analysis: AgentAnalysis,
  gender: Gender,
  language: Language,
  userStyle: UserStyle,
  sampleMessages: string[] = [],
  targetMessages: ChatMessage[] = []
): string {
  const genderInst = GENDER_INSTRUCTIONS[gender]
  const styleInstructions = styleToInstructions(userStyle, language, sampleMessages)
  const analysisBlock = `- Tone: ${analysis.tone}
- Interest level: ${analysis.interestLevel}
- Emotional state: ${analysis.emotionalState}
- Relationship stage: ${analysis.relationshipStage}
- Subtext: ${analysis.subtext}`

  if (language === 'zh') {
    const lines = chatText.split('\n').filter(l => l.trim())
    const otherPrefix = gender === 'male' ? '她：' : '他：'
    const imLabel = gender === 'male' ? '男生（"我"）' : '女生（"我"）'
    const otherLabel = gender === 'male' ? '女生（"她"）' : '男生（"他"）'

    // Build context: split chat into "already replied" and "need reply"
    const lastUserIdx = [...lines].reverse().findIndex(l => l.startsWith('我：'))
    const lastUserPos = lastUserIdx >= 0 ? lines.length - 1 - lastUserIdx : -1
    const contextLines = lines.slice(0, lastUserPos + 1)
    const unrepliedLines = lines.slice(lastUserPos + 1).filter(l => l.startsWith(otherPrefix))

    const contextBlock = contextLines.length > 0 ? contextLines.join('\n') : '（没有之前的消息）'
    const targetBlock = targetMessages.length > 0
      ? targetMessages.map((m, i) => `[需要回复 - 消息${i + 1}] ${m.text}`).join('\n')
      : unrepliedLines.length > 0
        ? unrepliedLines.map((l, i) => `[需要回复 - 消息${i + 1}] ${l.replace(otherPrefix, '').trim()}`).join('\n')
        : '（没有未回复的消息）'

    return `你是聊天高手。根据对话历史生成回复选项。

## 角色设定
你是帮"我"（${imLabel}）回复对方（${otherLabel}）的聊天搭子。
${genderInst}

## 对话历史（仅参考上下文——不要为这些消息生成回复）
${contextBlock}

## ⚠️ 只回复这些消息（为每条消息单独生成回复）
${targetBlock}

你的任务：为上面每条"需要回复"的消息，生成2-3个回复选项。所有消息的回复必须放在同一个JSON数组中。

## 分析结果
${analysisBlock}

## 用户打字风格
${styleInstructions}

## 关系阶段策略
- strangers: 先破冰，找共同话题，别太热情
- acquaintances: 建立舒适感，展示有趣的一面
- flirting: 可以推进，制造暧昧感，但别表白
- dating: 可以更亲密，但保持新鲜感

## 回复规则（必须遵守）
1. 你的身份是"我"（${imLabel}），正在回复对方（${otherLabel}）
2. ⚠️ 对方（${otherLabel}）说了"需要回复"的消息，你要帮"我"（${imLabel}）回复
3. 为每条"需要回复"的消息单独生成回复，不要混合不同消息的回复
4. ⚠️ 每条回复必须直接回应对应消息的内容，不能张冠李戴
5. 分析对方在做什么：
   - 如果对方要求你做某事（发照片/发位置/分享），你要回复你会不会做/怎么做
   - 如果对方问你问题，你要回答问题
   - 如果对方在表达情绪，你要回应情绪
   - 绝对不能反过来要求对方做同样的事
6. 每个回复简短（1-2句话，别啰嗦）
7. 严格模仿用户的打字风格（长度、emoji、正式程度、幽默程度）
8. 要像真人打字，有生活气息
9. 别用"您"，用"你"
10. 回复要匹配对方的说话节奏

## 返回格式
返回一个JSON数组，包含所有消息的回复。每个元素有id（消息编号）和reply（回复内容）：
[{{"id": "1", "reply": "回复1"}}, {{"id": "1", "reply": "回复2"}}, {{"id": "2", "reply": "回复3"}}]

⚠️ 必须是单个数组，不能分成多个数组！

示例：
消息1："发给我看看"
消息2："你在哪里"
正确：[{{"id": "1", "reply": "好 我发你"}}, {{"id": "1", "reply": "等下 我找找"}}, {{"id": "2", "reply": "在家"}}]
错误：[{{"id": "1", "reply": "好"}}], [{{"id": "2", "reply": "在家"}}] ← 这是两个数组，不是一个！

只返回JSON数组，不要其他内容。`
  }

  const lines = chatText.split('\n').filter(l => l.trim())
  const otherPrefix = gender === 'male' ? '她：' : '他：'
  const imLabel = gender === 'male' ? 'a guy' : 'a girl'
  const otherLabel = gender === 'male' ? 'a girl' : 'a guy'

  // Build context: split chat into "already replied" and "need reply"
  const lastUserIdx = [...lines].reverse().findIndex(l => l.startsWith('我：'))
  const lastUserPos = lastUserIdx >= 0 ? lines.length - 1 - lastUserIdx : -1
  const contextLines = lines.slice(0, lastUserPos + 1)
  const unrepliedLines = lines.slice(lastUserPos + 1).filter(l => l.startsWith(otherPrefix))

  const contextBlock = contextLines.length > 0 ? contextLines.join('\n') : '(no prior context)'
  const targetBlock = targetMessages.length > 0
    ? targetMessages.map((m, i) => `[NEEDS REPLY - Message ${i + 1}] ${m.text}`).join('\n')
    : unrepliedLines.length > 0
      ? unrepliedLines.map((l, i) => `[NEEDS REPLY - Message ${i + 1}] ${l.replace(otherPrefix, '').trim()}`).join('\n')
      : '(no unreplied messages)'

  return `You are a dating chat expert. Generate reply options based on the chat history.

## Role
You are a chat wingman helping "me" (${imLabel}) reply to their crush (${otherLabel}).
${gender === 'male' ? 'You are a confident, charming guy. You are smooth, witty, and never try too hard.' : 'You are a fun, magnetic girl. You are playful, warm, and know how to keep things exciting.'}

## Chat history (for context only — DO NOT generate replies for these)
${contextBlock}

## ⚠️ REPLY ONLY TO THESE MESSAGES (generate separate replies for EACH one)
${targetBlock}

Your task: For EACH message marked "NEEDS REPLY" above, generate 2-3 separate reply options. All replies for ALL messages must be in ONE single JSON array — do NOT return separate arrays per message.

## Analysis
${analysisBlock}

## Your texting style (MUST match this exactly)
${styleInstructions}

## Relationship stage strategy
- strangers: Break the ice, find common ground, don't be too eager
- acquaintances: Build comfort, show your fun side
- flirting: Push the vibe, create romantic tension, but don't confess
- dating: Be more intimate, but keep the spark alive

## CRITICAL: How people actually text
- NO complete sentences. Fragments only.
- NO proper punctuation. Only ? or ! or ... at the end. Never period.
- ALL lowercase always.
- Text like you're typing fast on your phone
- Think: how does a 22 year old actually text their crush?

## Internet slang reference (use these naturally)
- wyd = what (are) you doing
- hbu = how about you
- idk = I don't know
- tbh = to be honest
- ngl = not gonna lie
- fr = for real
- imo = in my opinion
- sup = what's up
- np = no problem
- ty = thank you
- lmk = let me know
- nvm = never mind
- ofc = of course
- pls/plz = please
- ur = your/you're
- r = are
- u = you
- 2 = to/too
- 4 = for
- b4 = before
- gr8 = great
- l8r = later
- thx/tnx = thanks
- hmu = hit me up
- istg = I swear to god
- lowkey = somewhat
- highkey = very much
- vibes = mood/energy
- slay = doing great
- no cap = no lie/for real
- bet = okay/sure
- sus = suspicious
- mid = mediocre
- <3 = heart
- ;) = flirting
- :P = playful
- xoxo = hugs and kisses

## CRITICAL: Language rule
- You MUST reply in English ONLY
- NO Chinese characters allowed anywhere in your reply
- Translate any Chinese concepts to English slang

## Reply rules (MUST follow)
1. Your identity is "me" (${imLabel}), replying to the crush (${otherLabel})
2. ⚠️ The crush (${otherLabel}) said the "NEEDS REPLY" messages — you are helping "me" (${imLabel}) reply TO THEM
3. For EACH "NEEDS REPLY" message, generate separate replies
4. ⚠️ Each reply MUST directly address the content of its corresponding message — do NOT mix up messages
5. If they ask YOU to do something, reply about whether you'll do it
6. If they ask a question, answer it
7. If they express emotion, respond to the emotion
8. NEVER ask them to do the same thing back
9. 1 sentence max. Half sentences are better.
10. NO periods. Only ? ! or ... or nothing
11. All lowercase

## Return format
Return ONE JSON array containing replies for ALL messages. Each element has "id" (message number) and "reply":
[{{"id": "1", "reply": "reply 1"}}, {{"id": "1", "reply": "reply 2"}}, {{"id": "2", "reply": "reply 3"}}]

⚠️ MUST be a SINGLE array — do NOT return separate arrays per message!

Example:
Message 1: "send me pics"
Message 2: "when i become rich"
Correct: [{{"id": "1", "reply": "sure hold on"}}, {{"id": "1", "reply": "lemme find it"}}, {{"id": "2", "reply": "ill be waiting"}}, {{"id": "2", "reply": "buy me something then"}}]
Wrong: [{{"id": "1", "reply": "sure"}}], [{{"id": "2", "reply": "ok"}}] ← this is TWO arrays, not ONE!

Return ONLY the JSON array.`
}

export function parseReplies(response: string, targetMessages: ChatMessage[] = []): ReplyOption[] {
  try {
    let cleaned = response.replace(/```json\n?|\n?```/g, '').trim()

    // Handle comma-separated arrays: [...], [...] → [[...], [...]]
    if (cleaned.startsWith('[{') && cleaned.includes('], [')) {
      try {
        const parts = JSON.parse('[' + cleaned + ']')
        if (Array.isArray(parts) && parts.every(Array.isArray)) {
          cleaned = JSON.stringify(parts.flat())
        }
      } catch { /* fall through to normal parse */ }
    }

    const parsed = JSON.parse(cleaned)

    // Map "1", "2" etc to actual message IDs
    const idMap: Record<string, string> = {}
    targetMessages.forEach((m, i) => { idMap[String(i + 1)] = m.id })

    // Flat array format: [{"id": "1", "reply": "text"}, ...]
    if (Array.isArray(parsed)) {
      const replies: ReplyOption[] = []
      for (const item of parsed) {
        if (item && typeof item === 'object' && item.id && item.reply) {
          const rawId = String(item.id)
          replies.push({
            id: `reply-${Date.now()}-${replies.length}`,
            text: String(item.reply),
            messageId: idMap[rawId] || rawId,
          })
        }
      }
      if (replies.length > 0) return replies

      // Legacy format: plain array of strings
      return parsed.map((text: string, i: number) => ({
        id: `reply-${Date.now()}-${i}`,
        text: String(text),
        messageId: targetMessages[0]?.id || 'legacy',
      }))
    }

    // Old object format fallback
    if (parsed && typeof parsed === 'object') {
      const replies: ReplyOption[] = []
      for (const [key, texts] of Object.entries(parsed)) {
        if (Array.isArray(texts)) {
          const mappedId = idMap[key] || key
          texts.forEach((text: string, i: number) => {
            replies.push({
              id: `reply-${Date.now()}-${key}-${i}`,
              text: String(text),
              messageId: mappedId,
            })
          })
        }
      }
      if (replies.length > 0) return replies
    }

    return [{ id: `reply-${Date.now()}`, text: response, messageId: targetMessages[0]?.id || 'legacy' }]
  } catch {
    return [{ id: `reply-${Date.now()}`, text: response, messageId: targetMessages[0]?.id || 'legacy' }]
  }
}

export function parseAnalysis(response: string): AgentAnalysis {
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      tone: parsed.tone || 'unknown',
      interestLevel: parsed.interestLevel || 'medium',
      emotionalState: parsed.emotionalState || 'unknown',
      relationshipStage: parsed.relationshipStage || 'unknown',
      subtext: parsed.subtext || 'unknown',
    }
  } catch {
    return {
      tone: 'unknown',
      interestLevel: 'medium',
      emotionalState: 'unknown',
      relationshipStage: 'unknown',
      subtext: '无法分析',
    }
  }
}

export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

const TRANSLATE_PROMPT = `Translate the following Chinese text to English. Return ONLY the translation, nothing else.

Chinese: {text}
English:`

export function buildTranslatePrompt(text: string): string {
  return TRANSLATE_PROMPT.replace('{text}', text)
}

const FILTER_PROMPT_ZH = `你是聊天过滤器。分析下面对方发来的消息，判断每条消息是否需要回复。

判断规则：
- 需要回复：对方问了问题、要求你做某事、表达了需要回应的情绪、开启新话题
- 不需要回复：单纯的情绪表达（哈哈哈/笑死/666）、单字回应（好/嗯/哦）、纯表情/sticker、敷衍的回应

对方消息列表：
{messages}

返回JSON数组，格式：[{{"messageId": "xxx", "needsReply": true/false, "reason": "简短原因"}}]
只返回JSON，不要其他内容。`

const FILTER_PROMPT_EN = `You are a message filter. Analyze the messages from the other person below and determine which ones need a reply.

Rules:
- Needs reply: They asked a question, requested you to do something, expressed emotion needing response, started a new topic
- No reply needed: Pure emotional reactions (hahaha/lol/666), single-word responses (ok/yeah/k), pure emoji/sticker, dismissive responses

Messages list:
{messages}

Return a JSON array: [{{"messageId": "xxx", "needsReply": true/false, "reason": "brief reason"}}]
Return ONLY the JSON.`

export function buildFilterPrompt(messages: ChatMessage[], language: Language, gender: Gender): string {
  const otherLabel = gender === 'male' ? '她' : 'she'
  const formatted = messages.map(m => `[${m.id}] ${otherLabel}: ${m.text}`).join('\n')
  const prompt = language === 'zh' ? FILTER_PROMPT_ZH : FILTER_PROMPT_EN
  return prompt.replace('{messages}', formatted)
}

export interface FilterResult {
  messageId: string
  needsReply: boolean
  reason: string
}

export function parseFilterResponse(response: string): FilterResult[] {
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}
