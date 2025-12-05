import { useEffect, useState } from 'react'
import type { Message } from '../components/types'

export function useSession({ apiUrl }: { apiUrl: string }) {
	const [messages, setMessages] = useState<Message[]>([])

	const [sessionId, setSessionId] = useState<string | null>(null)

	useEffect(() => {
		const initializeSession = async () => {
			try {
				const response = await fetch(`${apiUrl}/prendresoin/create-session`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				})
				const data = await response.json()
				setSessionId(data.sessionId)
				setMessages([
					{
						id: data.message.id,
						content: data.message.content,
						sender: data.message.sender,
						timestamp: new Date(data.message.timestamp),
					},
				])
			} catch (error) {
				console.error('Failed to create session:', error)
				setMessages([
					{
						id: '1',
						content: 'Impossible erreur',
						sender: 'assistant',
						timestamp: new Date(),
					},
				])
			}
		}
		initializeSession()
	}, [apiUrl])

	return {
		sessionId,
		messages,
		setMessages,
		apiUrl,
	}
}
