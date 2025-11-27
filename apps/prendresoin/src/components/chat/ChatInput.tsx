import { Input } from '@codegouvfr/react-dsfr/Input'
import type { SendMessageDto } from '@repo/api/chat/dto/send-message.dto'
import { useEffect, useRef, useState } from 'react'
import { useApiUrl } from '../../hooks/use-api-url'
import type { Message } from '../types'
import { ChatInputSubmitButton } from './ChatInputSubmitButton'
import { useChat } from './context/hook'
import { createBotMessage, createUserMessage } from './helpers'

export function ChatInput() {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [inputValue, setInputValue] = useState('')
	const apiUrl = useApiUrl()
	const { sessionId, setMessages } = useChat()

	// Auto-focus input when AI finishes responding
	useEffect(() => {
		if (!isLoading && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isLoading])

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading || !sessionId) return

		const userMessage = createUserMessage({ content: inputValue })

		setMessages((prev) => [...prev, userMessage])
		setInputValue('')
		setIsLoading(true)

		// Add immediate loading indicator
		const loadingMessageId = `loading-${Date.now()}`
		setMessages((prev) => [
			...prev,
			createBotMessage({
				id: loadingMessageId,
				content: '',
				isInitializing: true,
			}),
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
										? createBotMessage({
												id: currentMessageId,
												content: '',
												timestamp: new Date(data.timestamp),
												isInitializing: false,
											})
										: msg,
								),
							)
							break

						case 'chunk':
							currentContent += data.content
							// Update the message with accumulated content and stop processing indicator
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === data.messageId
										? ({ ...msg, content: currentContent, isProcessingFunctions: false } satisfies Message)
										: msg,
								),
							)
							break

						case 'end':
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === data.messageId
										? ({ ...msg, isFinished: true, isProcessingFunctions: false } satisfies Message)
										: msg,
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
								createBotMessage({
									id: Date.now().toString(),
									content: data.error,
									isFinished: true,
								}),
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
					const errorMessage = createBotMessage({ content: 'Erreur' })
					setMessages((prev) => [...prev, errorMessage])
					setIsLoading(false)
				}
			}
		} catch (error) {
			console.error('Failed to send message:', error)
			const errorMessage = createBotMessage({ content: 'Erreur' })
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

	const isSubmitButtonDisabled = !inputValue.trim() || isLoading

	return (
		<Input
			ref={inputRef}
			className="w-full"
			nativeInputProps={{
				type: 'text',
				value: inputValue,
				onChange: (e) => setInputValue(e.target.value),
				onKeyDown: handleKeyDown,
				placeholder: 'Tapez votre message...',
				autoFocus: true,
			}}
			disabled={isLoading}
			addon={<ChatInputSubmitButton disabled={isSubmitButtonDisabled} onClick={handleSendMessage} />}
			label="Poser une question"
			state="default"
			stateRelatedMessage="Text de validation / d'explication de l'erreur"
		/>
	)
}
