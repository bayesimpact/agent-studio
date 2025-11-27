import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { Card, CardContent } from '@repo/ui/card'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { useChat } from '../hooks/use-chat'

export function ChatInterface() {
	const { messages, inputValue, setInputValue, handleSendMessage, handleKeyDown, inputRef, scrollAreaRef, isLoading } =
		useChat()

	return (
		<div className="relative h-[80vh] w-full">
			<div className="mx-auto max-w-4xl px-4">
				<Card className="flex h-[80vh] flex-col">
					<CardContent className="flex flex-1 flex-col p-0">
						<ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
							<div className="space-y-4 pt-6 pb-4">
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
									>
										<div className="flex-shrink-0">
											{message.sender === 'user' ? (
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
													<User className="h-4 w-4 text-primary-foreground" />
												</div>
											) : (
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
													<Bot className="h-4 w-4 text-secondary-foreground" />
												</div>
											)}
										</div>
										{/* Merged Message Content */}
										<div
											className={`rounded-lg px-4 py-2 ${
												message.sender === 'user'
													? 'ml-auto max-w-xs bg-primary text-primary-foreground lg:max-w-md xl:max-w-lg'
													: 'w-full max-w-2xl bg-muted'
											}`}
										>
											{/* Message Text Content */}
											{message.content && (
												<>
													<div className="markdown-content text-sm">
														{message.sender === 'user' ? (
															<p>{message.content}</p>
														) : (
															<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{message.content}</ReactMarkdown>
														)}
													</div>

													{/* Timestamp */}
													<p className="mt-1 text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
						<div className="border-t p-6 pt-4">
							<div className="flex gap-2">
								<Input
									ref={inputRef}
									className="w-full"
									nativeInputProps={{
										type: 'text',
										value: inputValue,
										onChange: (e) => setInputValue(e.target.value),
										onKeyDown: handleKeyDown,
										placeholder: 'Tapez votre message...',
									}}
									disabled={isLoading}
									addon={
										<Button disabled={!inputValue.trim() || isLoading} onClick={handleSendMessage}>
											Envoyer
										</Button>
									}
									label="Poser une question"
									state="default"
									stateRelatedMessage="Text de validation / d'explication de l'erreur"
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
