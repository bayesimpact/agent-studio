import { Button } from "@caseai-connect/ui/shad/button"
import { cn } from "@caseai-connect/ui/utils"
import { Loader2Icon, UploadCloudIcon } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useTranslation } from "react-i18next"

type UploaderProps<T> = {
  processFile: (params: { file: File }) => Promise<T>
  onDrop?: (file: File) => void
  className?: string
}

function useUploader<T>({ processFile, onDrop }: UploaderProps<T>) {
  const [status, setStatus] = useState<"idle" | "uploading">("idle")

  const handleProcessFile = useCallback(
    (file: File) => {
      setStatus("uploading")

      processFile({
        file,
      }).finally(() => {
        setStatus("idle")
      })
    },
    [processFile],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onError: (err) => {
      console.error(err)
    },
    disabled: status === "uploading",
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0]
      if (files.length === 0 || !file) return
      if (onDrop) onDrop(file)
      void handleProcessFile(file)
    },
  })

  return {
    getInputProps,
    getRootProps,
    handleProcessFile,
    status,
    setStatus,
  }
}

export function BasicUploader<T>({
  processFile,
  children,
  className,
}: UploaderProps<T> & { children?: (status: "idle" | "uploading") => React.ReactNode }) {
  const { getRootProps, getInputProps, status } = useUploader<T>({ processFile })
  const { t } = useTranslation("actions")
  return (
    <div {...getRootProps()} className={cn("w-fit cursor-pointer", className)}>
      {children ? (
        children(status)
      ) : (
        <Button className="w-full" disabled={status !== "idle"}>
          {status === "uploading" ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <UploadCloudIcon className="size-5" />
          )}{" "}
          <span className="capitalize-first">{t("dragOrUploadFile")}</span>
        </Button>
      )}
      <input {...getInputProps()} />
    </div>
  )
}
