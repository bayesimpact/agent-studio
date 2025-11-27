import { fr } from '@codegouvfr/react-dsfr'
import { MessageTime } from './MessageTime'
import type { Message } from './types'

export function UserMessage({ message }: { message: Message }) {
	return (
		<div className="flex flex-row-reverse items-start gap-2">
			<div className="shrink-0">
				<div className="flex h-8 w-8 items-center justify-center">
					<span className={fr.cx('fr-icon-user-line')} aria-hidden={true} />
				</div>
			</div>

			<div className="mt-1.5 ml-auto max-w-xs lg:max-w-md xl:max-w-lg">
				<div className="markdown-content text-sm">
					<p>{message.content}</p>
				</div>
				<MessageTime timestamp={message.timestamp} />
			</div>
		</div>
	)
}
