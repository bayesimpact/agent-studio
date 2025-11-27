import { Button } from '@codegouvfr/react-dsfr/Button'

export function ChatInputSubmitButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
	return (
		<Button disabled={disabled} onClick={onClick}>
			Envoyer
		</Button>
	)
}
