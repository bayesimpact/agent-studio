import { useEffect } from "react"
import { selectChatSessionStatus } from "@/features/chat-sessions/chat-sessions.selectors"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionLoader({ children }: { children: React.ReactNode }) {
  const { admin } = useAbility()
  const dispatch = useAppDispatch()

  const status = useAppSelector(selectChatSessionStatus)

  useEffect(() => {
    if (admin) void dispatch(createPlaygroundSession())
    else void dispatch(createAppSession())
  }, [dispatch, admin])

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status)) return <>{children}</>

  return <LoadingRoute />
}
