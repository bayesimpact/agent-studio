import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { selectCurrentChatSessionData } from "@/features/chat-sessions/chat-sessions.selectors"
import { useSetCurrentChatSessionId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionHoc({
  children,
}: {
  children: (chatSession: ChatSession) => React.ReactNode
}) {
  useSetCurrentChatSessionId()
  const data = useAppSelector(selectCurrentChatSessionData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
