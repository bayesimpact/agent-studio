import { type Dispatch, type SetStateAction, useCallback } from 'react'
import { createBotMessage } from '../components/chat/helpers'
import type { Message, MessageEventData } from '../components/types'

export function useSSE({
	setMessages,
	isLoading,
	setIsLoading,
}: {
	setMessages: Dispatch<SetStateAction<Message[]>>
	isLoading: boolean
	setIsLoading: Dispatch<SetStateAction<boolean>>
}) {
	const handleStartEvent = useCallback(
		(data: MessageEventData, loadingMessageId: string) => {
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === loadingMessageId
						? createBotMessage({
								id: data.messageId,
								content: '...',
								timestamp: new Date(data.timestamp),
								isInitializing: false,
							})
						: msg,
				),
			)
			// Replace the loading message with the actual bot message when the start event is received
			return { messageId: data.messageId, content: '' }
		},
		[setMessages],
	)

	const handleChunkEvent = useCallback(
		(data: MessageEventData, currentContent: string) => {
			const newContent = currentContent + data.content
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === data.messageId
						? ({ ...msg, content: newContent, isProcessingFunctions: false } satisfies Message)
						: msg,
				),
			)
			return { messageId: data.messageId, content: newContent }
		},
		[setMessages],
	)

	const handleEndEvent = useCallback(
		(data: MessageEventData, eventSource: EventSource) => {
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === data.messageId
						? ({ ...msg, isFinished: true, isProcessingFunctions: false } satisfies Message)
						: msg,
				),
			)
			eventSource.close()
			setIsLoading(false)
		},
		[setMessages, setIsLoading],
	)

	const handleErrorEvent = useCallback(
		(data: MessageEventData, eventSource: EventSource) => {
			console.error('Stream error:', data.error)
			eventSource.close()
			setMessages((prev) => {
				if (!data.error) return prev
				return [
					...prev,
					createBotMessage({
						id: Date.now().toString(),
						content: data.error,
						isFinished: true,
					}),
				]
			})
			setIsLoading(false)
		},
		[setMessages, setIsLoading],
	)

	const handleSSEError = useCallback(() => {
		if (isLoading) {
			const errorMessage = createBotMessage({ content: 'Erreur' })
			setMessages((prev) => [...prev, errorMessage])
			setIsLoading(false)
		}
	}, [isLoading, setIsLoading, setMessages])

	const createSSEEventHandler = useCallback(
		(loadingMessageId: string, messageId: string, content: string) => {
			return (event: MessageEvent, eventSource: EventSource) => {
				try {
					const data: MessageEventData = JSON.parse(event.data)

					switch (data.type) {
						case 'start':
							return handleStartEvent(data, loadingMessageId)
						case 'chunk':
							return handleChunkEvent(data, content)
						case 'end':
							handleEndEvent(data, eventSource)
							return null
						case 'error':
							handleErrorEvent(data, eventSource)
							return null
						default:
							return { messageId, content }
					}
				} catch (error) {
					console.error('Error parsing SSE data:', error)
					return { messageId, content }
				}
			}
		},
		[handleStartEvent, handleChunkEvent, handleEndEvent, handleErrorEvent],
	)

	const handleSSEConnection = useCallback(
		(eventSource: EventSource, loadingMessageId: string) => {
			let currentMessageId = ''
			let currentContent = ''

			eventSource.addEventListener('message', (event) => {
				const handler = createSSEEventHandler(loadingMessageId, currentMessageId, currentContent)
				const result = handler(event, eventSource)

				if (result) {
					currentMessageId = result.messageId
					currentContent = result.content
				}
			})

			eventSource.onerror = (error) => {
				console.error('EventSource error:', error)
				eventSource.close()
				handleSSEError()
			}
		},
		[handleSSEError, createSSEEventHandler],
	)

	return { handleSSEConnection }
}

export const createSSEUrl = (apiUrl: string, sessionId: string, content: string): string => {
	const params = new URLSearchParams({ sessionId, content })
	return `${apiUrl}/prendresoin/message-stream?${params}`
}
