import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"

export function DefaultPromptDialog({
  prompt,
  buttonProps,
}: {
  prompt: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  const { t } = useTranslation("agent", { keyPrefix: "detail" })
  return (
    <Sheet modal>
      <SheetTrigger asChild>
        <Button {...buttonProps}>{t("viewPrompt")}</Button>
      </SheetTrigger>
      <SheetContent className="h-dvh min-w-[40vw]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("defaultPromptTitle")}</SheetTitle>
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
