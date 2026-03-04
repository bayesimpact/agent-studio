import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "@/features/agents/shared/agent-session-messages/components/MarkdownWrapper"

export function DefaultPromptDialog({
  prompt,
  buttonProps,
}: {
  prompt: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  const { t } = useTranslation("agent", { keyPrefix: "defaultPromptDialog" })
  return (
    <Sheet modal>
      <SheetTrigger asChild>
        <Button {...buttonProps}>{t("button")}</Button>
      </SheetTrigger>
      <SheetContent className="h-dvh min-w-[40vw]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          <Item>
            <ItemContent>
              <MarkdownWrapper content={prompt} />
            </ItemContent>
          </Item>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
