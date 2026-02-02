import type { ChatSessionMessage } from "@/features/chat-sessions/chat-sessions.models"
import { selectCurrentMessagesData } from "@/features/chat-sessions/chat-sessions.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionMessagesHoc({
  children,
}: {
  children: (messages: ChatSessionMessage[]) => React.ReactNode
}) {
  const data = useAppSelector(selectCurrentMessagesData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>
  return <LoadingRoute />
}
