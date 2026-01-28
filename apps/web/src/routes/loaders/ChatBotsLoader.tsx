import { useEffect } from "react"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatBotsLoader({ children }: { children: React.ReactNode }) {
  const projectId = useAppSelector(selectCurrentProjectId)
  const dispatch = useAppDispatch()

  const status = useAppSelector(selectChatBotsStatus)

  useEffect(() => {
    if (!projectId) return
    dispatch(listChatBots({ projectId }))
  }, [dispatch, projectId])

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status)) return <>{children}</>

  return <LoadingRoute />
}
