import { Auth0Provider } from "@auth0/auth0-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import App from "./App.tsx"
import { auth0ProviderConfig } from "./config/auth0.config"
import { store } from "./store"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Auth0Provider {...auth0ProviderConfig}>
        <App />
      </Auth0Provider>
    </Provider>
  </StrictMode>,
)
