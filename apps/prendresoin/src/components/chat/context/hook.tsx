import { useContext } from 'react'

import { ChatContext } from '.'

export const useChat = () => {
	const context = useContext(ChatContext)
	if (!context) {
		throw new Error('useChat must be used within a ChatContext.Provider')
	}
	return context
}
