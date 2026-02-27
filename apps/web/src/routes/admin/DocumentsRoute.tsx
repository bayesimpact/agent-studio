import { useEffect } from "react"
import { EmptyDocument } from "@/components/document/EmptyDocument"
import { UploadDocumentButton } from "@/components/document/UploadDocumentButton"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsFromProjectId } from "@/features/documents/documents.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { DocumentItem } from "../../components/document/DocumentItem"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function DocumentsRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const documentsData = useAppSelector(selectDocumentsFromProjectId(projectId))
  if (!projectId) return <ErrorRoute error="Missing valid project ID" />

  if (ADS.isError(documentsData))
    return <ErrorRoute error={documentsData.error || "Unknown error"} />

  if (ADS.isFulfilled(documentsData)) return <WithData documents={documentsData.value} />

  return <LoadingRoute />
}

function WithData({ documents }: { documents: Document[] }) {
  useHandleHeader()
  return (
    <div className="p-6 grid grid-cols-1 gap-4">
      {documents.length === 0 ? (
        <EmptyDocument />
      ) : (
        documents.map((document) => <DocumentItem key={document.id} document={document} />)
      )}
    </div>
  )
}

function useHandleHeader() {
  const { setHeaderRightSlot } = useSidebarLayout()
  useEffect(() => {
    setHeaderRightSlot(<UploadDocumentButton />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot])
}
