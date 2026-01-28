import { useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "./components/Sonner"
import { selectLastNotification } from "./features/notifications/notifications.selectors"
import { useInitApi } from "./hooks/use-init-api"
import { Router } from "./routes/Router"
import { useAppSelector } from "./store/hooks"

function App() {
  useInitApi()
  return (
    <>
      <NotificationCenter />
      <Router />
    </>
  )
}

export default App

function NotificationCenter() {
  const notification = useAppSelector(selectLastNotification)

  useEffect(() => {
    if (!notification) return
    if (notification.description) {
      toast[notification.type](
        <div>
          <strong>{notification.title}</strong>
          <div>{notification.description}</div>
        </div>,
      )
    } else toast[notification.type](notification.title)
    // TODO: Dispatch reset action after showing the notification
  }, [notification])

  return <Toaster />
}
