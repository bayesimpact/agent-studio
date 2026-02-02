import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { selectCurrentChatSessionsData } from "@/features/chat-sessions/chat-sessions.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionsHoc({
  children,
}: {
  children: (chatSessions: ChatSession[]) => React.ReactNode
}) {
  const data = useAppSelector(selectCurrentChatSessionsData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
