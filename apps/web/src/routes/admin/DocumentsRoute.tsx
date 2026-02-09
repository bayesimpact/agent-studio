import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { EmptyDocuments } from "@/components/documents/EmptyDocuments"
import { UploadDocumentButton } from "@/components/documents/UploadDocumentButton"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsFromProjectId } from "@/features/documents/documents.selectors"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectId, selectProjectData } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { DocumentItem } from "../../components/documents/DocumentItem"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function DocumentsRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectProjectData)
  const documentsData = useAppSelector(selectDocumentsFromProjectId(projectId))
  if (!projectId) return <NotFoundRoute />

  if (ADS.isError(documentsData) || ADS.isError(project)) return <NotFoundRoute />

  if (ADS.isFulfilled(documentsData) && ADS.isFulfilled(project))
    return <WithData project={project.value} documents={documentsData.value} />

  return <LoadingRoute />
}

function WithData({ documents, project }: { documents: Document[]; project: Project }) {
  useHandleHeader({ project })
  return (
    <div className="p-6 grid grid-cols-1 gap-4">
      {documents.length === 0 ? (
        <EmptyDocuments project={project} />
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
  const { t } = useTranslation("documents", { keyPrefix: "header" })
  const { isAdminInterface } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = t("title", { projectName: project.name })

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (isAdminInterface)
      setHeaderRightSlot(
        <UploadDocumentButton organizationId={project.organizationId} project={project} />,
      )
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, setHeaderRightSlot, isAdminInterface, project])
}
