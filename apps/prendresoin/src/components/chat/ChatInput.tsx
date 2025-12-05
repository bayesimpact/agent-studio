import { Input } from '@codegouvfr/react-dsfr/Input'
import { useEffect, useRef, useState } from 'react'
import { useApiUrl } from '../../hooks/use-api-url'
import { ChatInputSubmitButton } from './ChatInputSubmitButton'
import { useChat } from './context/hook'
import { createLoadingMessage, createUserMessage } from './helpers'
import { createSSEUrl, useSSE } from '../../hooks/use-sse';

export function ChatInput() {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [inputValue, setInputValue] = useState('')
	const apiUrl = useApiUrl()
	const { sessionId, setMessages } = useChat()

	const { handleSSEConnection } = useSSE({ setMessages, isLoading, setIsLoading })

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

		const { id: loadingMessageId, message: loadingMessage } = createLoadingMessage()
		setMessages((prev) => [...prev, loadingMessage])

		const eventSource = new EventSource(createSSEUrl(apiUrl, sessionId, userMessage.content))

		handleSSEConnection(eventSource, loadingMessageId)
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
