import { Card, CardContent } from '@repo/ui/shad/card'
import type { ReactNode } from 'react'
import { useChat } from './context/hook'
import { MessageList } from './MessageList'

export function ChatContainer({ children }: { children: ReactNode }) {
	const { messages } = useChat()

	return (
		<div className="relative h-[80vh] w-full">
			<div className="mx-auto max-w-4xl px-4">
				<Card className="flex h-[80vh] flex-col">
					<CardContent className="flex flex-1 flex-col p-0">
						<MessageList messages={messages} />

						<div className="p-6 pt-4">{children}</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
