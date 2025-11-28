export interface Message {
	id: string
	content: string
	sender: 'user' | 'assistant'
	timestamp: Date
	isProcessingFunctions?: boolean
	isInitializing?: boolean
	isFinished?: boolean
}

export type MessageEventData = MessageEvent<{
	type: 'start' | 'chunk' | 'end' | 'error'
	messageId: string
	timestamp: string
	content?: string
	error?: string
}>['data']
