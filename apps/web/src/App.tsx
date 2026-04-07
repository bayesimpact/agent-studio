import { useEffect } from "react"
import { toast } from "sonner"
import { selectLastNotification } from "@/common/features/notifications/notifications.selectors"
import { Router } from "@/common/routes/Router"
import { useAppSelector } from "@/common/store/hooks"
import { Toaster } from "@/components/Sonner"
import { useInitApi } from "@/hooks/use-init-api"

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
