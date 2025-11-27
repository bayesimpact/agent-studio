export function MessageTime({ timestamp }: { timestamp: Date }) {
	return <p className="text-xs opacity-50">{timestamp.toLocaleTimeString()}</p>
}
