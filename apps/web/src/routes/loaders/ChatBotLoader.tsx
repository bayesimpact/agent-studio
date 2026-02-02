import {
  selectChatBotsStatus,
  selectCurrentChatBot,
} from "@/features/chat-bots/chat-bots.selectors"
import { useSetCurrentChatBotId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatBotLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentChatBotId()

  const chatBot = useAppSelector(selectCurrentChatBot)
  const status = useAppSelector(selectChatBotsStatus)

  if (ADS.isError(status) || !chatBot) return <NotFoundRoute />

  if (ADS.isFulfilled(status) && chatBot) return <>{children}</>

  return <LoadingRoute />
}
