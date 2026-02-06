import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { FileIcon } from "lucide-react"
import type { Project } from "@/features/projects/projects.models"
import { UploadResourceButton } from "./UploadResourceButton"

export function EmptyResources({ project }: { project: Project }) {
  // FIXME: i18n
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>No Resources Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any resources yet. Get started by creating your first resource.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <UploadResourceButton organizationId={project.organizationId} project={project} />
      </EmptyContent>
    </Empty>
  )
}
