import type { ReactNode } from 'react'
import { ChatContext } from '.'
import { useApiUrl } from '../../../hooks/use-api-url'
import { useSession } from '../../../hooks/use-session'

export function Provider({ children }: { children: ReactNode }) {
	const apiUrl = useApiUrl()
	const { messages, setMessages, sessionId } = useSession({ apiUrl })
	return <ChatContext.Provider value={{ messages, setMessages, sessionId }}>{children}</ChatContext.Provider>
}
