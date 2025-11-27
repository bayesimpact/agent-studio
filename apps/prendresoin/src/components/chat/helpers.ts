import type { Message } from '../types'

export function createUserMessage(fields: Partial<Message> & { content: string }): Message {
	return {
		id: Date.now().toString(),
		sender: 'user',
		timestamp: new Date(),
		...fields,
		content: fields.content.trim(),
	}
}
export function createBotMessage(fields: Partial<Message> & { content: string }): Message {
	return {
		id: Date.now().toString(),
		sender: 'assistant',
		timestamp: new Date(),
		...fields,
	}
}
