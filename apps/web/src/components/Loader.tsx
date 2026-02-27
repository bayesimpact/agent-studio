import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
export function Loader() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 items-center justify-center">
      <Item variant="outline" className="w-fit">
        <ItemHeader>
          <ItemTitle className="w-fit text-primary">
            <Loader2Icon className="size-5 animate-spin capitalize-first" /> {t("status:loading")}
          </ItemTitle>
        </ItemHeader>
      </Item>
    </div>
  )
}
