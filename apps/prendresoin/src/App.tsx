import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display'
import { Header } from '@codegouvfr/react-dsfr/Header'
import { ChatContainer } from './components/chat/ChatContainer'
import { ChatInput } from './components/chat/ChatInput'
import { Provider as ChatProvider } from './components/chat/context/Provider'

function App() {
	return (
		<>
			<Header
				serviceTitle={
					<>
						Prendre Soin Chatbot{' '}
						<Badge as="span" noIcon severity="success">
							Beta
						</Badge>
					</>
				}
				serviceTagline="Votre assistant virtuel pour des conseils de santé personnalisés"
				id="fr-header-simple-header-with-service-title-and-tagline"
				brandTop={
					<>
						PRENDRE
						<br />
						SOIN
					</>
				}
				homeLinkProps={{ title: 'Accueil - Prendre Soin Chatbot', href: '/' }}
				quickAccessItems={[
					// Theme toggle
					headerFooterDisplayItem,
				]}
			/>
			<ChatProvider>
				<ChatContainer>
					<ChatInput />
				</ChatContainer>
			</ChatProvider>
		</>
	)
}

export default App
