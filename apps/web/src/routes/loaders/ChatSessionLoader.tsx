import {
  selectChatSessionStatus,
  selectCurrentChatSession,
} from "@/features/chat-sessions/chat-sessions.selectors"
import { useSetCurrentChatSessionId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentChatSessionId()

  const chatSession = useAppSelector(selectCurrentChatSession)
  const status = useAppSelector(selectChatSessionStatus)

  if (ADS.isError(status) || !chatSession) return <NotFoundRoute />

  if (ADS.isFulfilled(status) && chatSession) return <>{children}</>

  return <LoadingRoute />
}
