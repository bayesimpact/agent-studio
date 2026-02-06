"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { DownloadIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Resource } from "@/features/resources/resources.models"
import { getResourceTemporaryUrl } from "@/features/resources/resources.thunks"
import { useAppDispatch } from "@/store/hooks"

export function OpenResourceUrl({
  organizationId,
  projectId,
  resource,
}: {
  organizationId: string
  projectId: string
  resource: Resource
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation("common")
  const [url, setUrl] = useState<string | null>(null)
  const resourceId = resource.id
  const aRef = useRef<HTMLAnchorElement | null>(null)

  const getUrl = async () => {
    if (url) return
    const res = await dispatch(
      getResourceTemporaryUrl({ organizationId, projectId, resourceId }),
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
      <a ref={aRef} href={url} target="_blank" download={resource.fileName}>
        <DownloadIcon className="size-4" />
        {t("download")}
      </a>
    </Button>
  )
}
