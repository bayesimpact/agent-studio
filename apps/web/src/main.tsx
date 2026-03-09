import { Auth0Provider } from "@auth0/auth0-react"
import { ThemeProvider } from "next-themes"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import App from "./App.tsx"
import { auth0ProviderConfig } from "./config/auth0.config.ts"
import { store } from "./store/index.ts"
import "./i18n"
import "./index.css"
import { defaultTheme } from "./components/themes/helpers.ts"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Auth0Provider {...auth0ProviderConfig}>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          storageKey="tpk"
          disableTransitionOnChange={false}
          forcedTheme={defaultTheme}
        >
          <App />
        </ThemeProvider>
      </Auth0Provider>
    </Provider>
  </StrictMode>,
)
