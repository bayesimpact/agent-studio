import { useEffect } from "react"
import { selectChatSessionStatus } from "@/features/chat-session/chat-session.selectors"
import { createPlaygroundSession } from "@/features/chat-session/chat-session.thunks"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionLoader({ children }: { children: React.ReactNode }) {
  const { admin } = useAbility()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (admin) void dispatch(createPlaygroundSession())
    // TODO: void dispatch(createEndUserPrivateSession())
  }, [dispatch, admin])

  const status = useAppSelector(selectChatSessionStatus)

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status)) return <>{children}</>

  if (!admin) return <div>Not yet implemented</div>

  return <LoadingRoute />
}
