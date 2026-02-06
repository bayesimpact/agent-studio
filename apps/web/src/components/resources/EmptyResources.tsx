import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { FileIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/features/projects/projects.models"
import { UploadResourceButton } from "./UploadResourceButton"

export function EmptyResources({ project }: { project: Project }) {
  const { t } = useTranslation("resources", { keyPrefix: "empty" })
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <UploadResourceButton organizationId={project.organizationId} project={project} />
      </EmptyContent>
    </Empty>
  )
}
