"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { DownloadIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Document } from "@/features/documents/documents.models"
import { getDocumentTemporaryUrl } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"

export function OpenDocumentUrl({
  organizationId,
  projectId,
  document,
}: {
  organizationId: string
  projectId: string
  document: Document
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation("actions")
  const [url, setUrl] = useState<string | null>(null)
  const documentId = document.id
  const aRef = useRef<HTMLAnchorElement | null>(null)

  const getUrl = async () => {
    if (url) return
    const res = await dispatch(
      getDocumentTemporaryUrl({ organizationId, projectId, documentId }),
    ).unwrap()
    setUrl(res.url)
  }

  useEffect(() => {
    if (!url) return
    if (aRef.current) {
      aRef.current.click()
    }
    return () => {
      setUrl(null)
    }
  }, [url])

  if (!url)
    return (
      <Button variant="outline" onClick={getUrl}>
        <DownloadIcon className="size-4" />
        {t("download")}
      </Button>
    )
  return (
    <Button variant="outline" asChild>
      <a ref={aRef} href={url} target="_blank" download={document.fileName}>
        <DownloadIcon className="size-4" />
        {t("download")}
      </a>
    </Button>
  )
}
