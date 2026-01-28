import { useEffect } from "react"
import { selectChatSessionStatus } from "@/features/chat-session/chat-session.selectors"
import { createPlaygroundSession } from "@/features/chat-session/chat-session.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(createPlaygroundSession())
  }, [dispatch])

  const status = useAppSelector(selectChatSessionStatus)

  if (status === "failed") return <NotFoundRoute />

  if (status === "succeeded") return <>{children}</>

  return <LoadingRoute />
}
