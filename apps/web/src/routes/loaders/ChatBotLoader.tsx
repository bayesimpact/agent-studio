import {
  selectChatBotsStatus,
  selectCurrentChatBotId,
} from "@/features/chat-bots/chat-bots.selectors"
import { useSetCurrentChatBotId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ChatBotLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentChatBotId()

  const chatBotId = useAppSelector(selectCurrentChatBotId)
  const status = useAppSelector(selectChatBotsStatus)

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status) && chatBotId) return <>{children}</>

  return <LoadingRoute />
}
