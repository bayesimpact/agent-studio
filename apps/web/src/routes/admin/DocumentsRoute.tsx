import { useEffect } from "react"
import { EmptyDocument } from "@/components/document/EmptyDocument"
import { UploadDocumentButton } from "@/components/document/UploadDocumentButton"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsFromProjectId } from "@/features/documents/documents.selectors"
import type { Project } from "@/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { DocumentItem } from "../../components/document/DocumentItem"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function DocumentsRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectCurrentProjectData)
  const documentsData = useAppSelector(selectDocumentsFromProjectId(projectId))
  if (!projectId) return <ErrorRoute error="Missing valid project ID" />

  if (ADS.isError(documentsData) || ADS.isError(project))
    return <ErrorRoute error={documentsData.error || project.error || "Unknown error"} />

  if (ADS.isFulfilled(documentsData) && ADS.isFulfilled(project))
    return <WithData project={project.value} documents={documentsData.value} />

  return <LoadingRoute />
}

function WithData({ documents, project }: { documents: Document[]; project: Project }) {
  useHandleHeader({ project })
  return (
    <div className="p-6 grid grid-cols-1 gap-4">
      {documents.length === 0 ? (
        <EmptyDocument project={project} />
      ) : (
        documents.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            organizationId={project.organizationId}
          />
        ))
      )}
    </div>
  )
}

function useHandleHeader({ project }: { project: Project }) {
  const { setHeaderRightSlot } = useSidebarLayout()
  useEffect(() => {
    setHeaderRightSlot(
      <UploadDocumentButton organizationId={project.organizationId} project={project} />,
    )
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot, project])
}
