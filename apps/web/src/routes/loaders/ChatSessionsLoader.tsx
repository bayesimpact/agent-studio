import { useEffect } from "react"
import { selectChatSessionStatus } from "@/features/chat-sessions/chat-sessions.selectors"
import { listSessions } from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionsLoader({ children }: { children: React.ReactNode }) {
  const { admin } = useAbility()
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatSessionStatus)

  useEffect(() => {
    void dispatch(listSessions({ playground: admin }))
  }, [dispatch, admin])

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status)) return <>{children}</>

  return <LoadingRoute />
}
