import { useEffect } from "react"
import { EmptyDocument } from "@/components/document/EmptyDocument"
import { UploadDocumentButton } from "@/components/document/UploadDocumentButton"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsData } from "@/features/documents/documents.selectors"
import { useAppSelector } from "@/store/hooks"
import { DocumentItem } from "../../components/document/DocumentItem"
import { AsyncRoute } from "../AsyncRoute"

export function DocumentsRoute() {
  const documents = useAppSelector(selectDocumentsData)
  return (
    <AsyncRoute data={[documents]}>
      {([documentsValue]) => <WithData documents={documentsValue} />}
    </AsyncRoute>
  )
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
