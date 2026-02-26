import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { UsersIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export function EmptyProjectMembership() {
  const { t } = useTranslation("projectMembership", { keyPrefix: "list.empty" })
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
