'use client'

import type { SendMessageDto } from '@repo/api/chat/dto/send-message.dto'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Bot, Send, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

interface Message {
	id: string
	content: string
	sender: 'user' | 'assistant'
	timestamp: Date
}

export function ChatInterface() {
	const [messages, setMessages] = useState<Message[]>([])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [sessionId, setSessionId] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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

	return (
		<div className="w-full h-[80vh] relative">
			<div className="mx-auto max-w-4xl px-4">
				<Card className="h-[80vh] flex flex-col">
					<CardContent className="flex-1 flex flex-col p-0">
						<ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
							<div className="space-y-4 pb-4 pt-6">
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
									>
										<div className="flex-shrink-0">
											{message.sender === 'user' ? (
												<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
													<User className="w-4 h-4 text-primary-foreground" />
												</div>
											) : (
												<div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
													<Bot className="w-4 h-4 text-secondary-foreground" />
												</div>
											)}
										</div>
										{/* Merged Message Content */}
										<div
											className={`px-4 py-2 rounded-lg ${
												message.sender === 'user'
													? 'max-w-xs lg:max-w-md xl:max-w-lg bg-primary text-primary-foreground ml-auto'
													: 'w-full max-w-2xl bg-muted'
											}`}
										>
											{/* Message Text Content */}
											{message.content && (
												<>
													<div className="text-sm markdown-content">
														{message.sender === 'user' ? (
															<p>{message.content}</p>
														) : (
															<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{message.content}</ReactMarkdown>
														)}
													</div>

													{/* Timestamp */}
													<p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
						<div className="p-6 pt-4 border-t">
							<div className="flex gap-2">
								<input
									ref={inputRef}
									type="text"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Tapez votre message..."
									className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									disabled={isLoading}
								/>
								<Button
									className="w-10 h-10 flex justify-center items-center px-2 rounded-full"
									onClick={handleSendMessage}
									disabled={!inputValue.trim() || isLoading}
									size="icon"
								>
									<Send className="w-5 h-5" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
