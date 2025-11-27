export interface Message {
	id: string
	content: string
	sender: 'user' | 'assistant'
	timestamp: Date
	isProcessingFunctions?: boolean
	isInitializing?: boolean
	isFinished?: boolean
}
