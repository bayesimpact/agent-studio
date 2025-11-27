import type { SendMessageDto } from '@repo/api/chat/dto/send-message.dto'
import { useEffect, useRef, useState } from 'react'
import type { Message } from '../components/types'

export function useChat() {
	const [messages, setMessages] = useState<Message[]>([])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [sessionId, setSessionId] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	const apiUrl = 'http://localhost:3000'

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
		inputRef.current?.focus()
	}, [apiUrl])

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading || !sessionId) return

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputValue.trim(),
			sender: 'user',
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInputValue('')
		setIsLoading(true)

		// Add immediate loading indicator
		const loadingMessageId = `loading-${Date.now()}`
		setMessages((prev) => [
			...prev,
			{
				id: loadingMessageId,
				content: '',
				sender: 'assistant',
				timestamp: new Date(),
				isInitializing: true,
			},
		])

		try {
			const payload: SendMessageDto = {
				sessionId,
				content: userMessage.content,
			}

			// Use EventSource for SSE
			const eventSource = new EventSource(
				`${apiUrl}/prendresoin/message-stream?${new URLSearchParams({
					sessionId: payload.sessionId,
					content: payload.content,
				})}`,
			)

			let currentMessageId = ''
			let currentContent = ''

			eventSource.addEventListener('message', (event) => {
				try {
					const data = JSON.parse(event.data)

					switch (data.type) {
						case 'start':
							currentMessageId = data.messageId
							currentContent = ''
							// Replace loading message with actual message
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === loadingMessageId
										? {
												id: currentMessageId,
												content: '',
												sender: 'assistant' as const,
												timestamp: new Date(data.timestamp),
												isInitializing: false,
											}
										: msg,
								),
							)
							break

						case 'chunk':
							currentContent += data.content
							// Update the message with accumulated content and stop processing indicator
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === data.messageId ? { ...msg, content: currentContent, isProcessingFunctions: false } : msg,
								),
							)
							break

						case 'end':
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === data.messageId ? { ...msg, isFinished: true, isProcessingFunctions: false } : msg,
								),
							)
							eventSource.close()
							setIsLoading(false)
							break

						case 'error':
							console.error('Stream error:', data.error)
							eventSource.close()
							setMessages((prev) => [
								...prev,
								{
									id: Date.now().toString(),
									content: data.error,
									sender: 'assistant',
									timestamp: new Date(),
									isFinished: true,
								},
							])
							setIsLoading(false)
							break
					}
				} catch (error) {
					console.error('Error parsing SSE data:', error)
				}
			})

			eventSource.onerror = (error) => {
				console.error('EventSource error:', error)
				eventSource.close()
				if (isLoading) {
					const errorMessage: Message = {
						id: Date.now().toString(),
						content: 'Erreur',
						sender: 'assistant',
						timestamp: new Date(),
					}
					setMessages((prev) => [...prev, errorMessage])
					setIsLoading(false)
				}
			}
		} catch (error) {
			console.error('Failed to send message:', error)
			const errorMessage: Message = {
				id: Date.now().toString(),
				content: 'Erreur',
				sender: 'assistant',
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, errorMessage])
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [messages])

	// Auto-focus input when AI finishes responding
	useEffect(() => {
		if (!isLoading && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isLoading])

	return {
		handleKeyDown,
		inputRef,
		scrollAreaRef,
		messages,
		inputValue,
		setInputValue,
		isLoading,
		handleSendMessage,
	}
}
