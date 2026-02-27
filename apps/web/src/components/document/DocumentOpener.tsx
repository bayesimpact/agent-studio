"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { FileDownIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { getDocumentTemporaryUrl } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"

export function DocumentOpener({
  documentId,
  noIcon = false,
  buttonProps,
}: {
  noIcon?: boolean
  documentId: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const aRef = useRef<HTMLAnchorElement | null>(null)

  const getUrl = async () => {
    if (url) return
    const res = await dispatch(getDocumentTemporaryUrl({ documentId })).unwrap()
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
      <Button variant="outline" onClick={getUrl} {...buttonProps}>
        {!noIcon && <FileDownIcon className="size-4" />} {t("actions:downloadDocument")}
      </Button>
    )
  return (
    <Button variant="outline" asChild {...buttonProps}>
      <a ref={aRef} href={url} target="_blank" download>
        {!noIcon && <FileDownIcon className="size-4" />} {t("actions:downloadDocument")}
      </a>
    </Button>
  )
}
