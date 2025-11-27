import { fr } from '@codegouvfr/react-dsfr'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { MessageTime } from './MessageTime'
import type { Message } from './types'

export function BotMessage({ message }: { message: Message }) {
	return (
		<div className="flex items-start gap-2">
			<div className="shrink-0">
				<div className="flex h-8 w-8 items-center justify-center rounded-full">
					<span className={fr.cx('fr-icon-message-3-line')} aria-hidden={true} />
				</div>
			</div>

			<div className="mt-1.5 w-full max-w-2xl">
				<div className="markdown-content text-sm">
					<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{message.content}</ReactMarkdown>
				</div>

				<MessageTime timestamp={message.timestamp} />
			</div>
		</div>
	)
}
