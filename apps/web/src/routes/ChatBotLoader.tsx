import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { useSetCurrentChatBotId } from "@/hooks/use-set-current-id"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ChatBotLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentChatBotId()

  const status = useAppSelector(selectChatBotsStatus)

  if (status === "failed") return <NotFoundRoute />

  if (status === "succeeded") return <>{children}</>

  return <LoadingRoute />
}
