import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotData } from "@/features/chat-bots/chat-bots.selectors"
import { useSetCurrentChatBotId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatBotHoc({ children }: { children: (chatBot: ChatBot) => React.ReactNode }) {
  useSetCurrentChatBotId()
  const data = useAppSelector(selectChatBotData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
