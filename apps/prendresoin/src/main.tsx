// import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.min.css'
import '@codegouvfr/react-dsfr/main.css'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

startReactDsfr({ defaultColorScheme: 'system', useLang: () => 'fr' })

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
