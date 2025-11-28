import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { Message } from '../../types'

export type ChatContextType = {
	messages: Message[]
	sessionId: string | null
	setMessages: Dispatch<SetStateAction<Message[]>>
}

export const ChatContext = createContext<ChatContextType | null>(null)
