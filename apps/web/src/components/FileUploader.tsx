import { Button } from "@caseai-connect/ui/shad/button"
import { Switch } from "@caseai-connect/ui/shad/switch"
import { cn } from "@caseai-connect/ui/utils"
import {
  FileCheckIcon,
  Loader2Icon,
  SparklesIcon,
  TriangleAlertIcon,
  UploadCloudIcon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useTranslation } from "react-i18next"

// TODO: i18n

export function Uploader<T>(
  props: (
    | {
        // Smart uploader
        isSmart: true
        onStoreFile?: (file?: File) => void
      }
    | object // basic uploader
  ) &
    Omit<UploaderProps<T>, "onDrop"> & {
      organizationId: string
      projectId: string
    },
) {
  if ("isSmart" in props && props.isSmart) {
    const { processFile, onStoreFile } = props
    return (
      <SmartUploader
        processFile={processFile}
        onStoreFile={onStoreFile}
        organizationId={props.organizationId}
        projectId={props.projectId}
      />
    )
  }
  const { processFile } = props
  return (
    <BasicUploader
      processFile={processFile}
      organizationId={props.organizationId}
      projectId={props.projectId}
    />
  )
}

type UploaderProps<T> = {
  organizationId: string
  projectId: string
  processFile: (params: { file: File }) => Promise<T>
  onDrop?: (file: File) => void
}

function useUploader<T>({ processFile, onDrop }: UploaderProps<T>) {
  const [status, setStatus] = useState<"idle" | "uploading" | "end">("idle")

  const handleProcessFile = useCallback(
    (file: File) => {
      setStatus("uploading")

      processFile({
        file,
      }).finally(() => {
        setStatus("end")
      })
    },
    [processFile],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onError: (err) => {
      console.error(err)
    },
    disabled: status === "uploading" || status === "end",
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

function BasicUploader<T>({ processFile, organizationId, projectId }: UploaderProps<T>) {
  const { getRootProps, getInputProps, status } = useUploader<T>({
    processFile,
    organizationId,
    projectId,
  })
  const { t } = useTranslation("common")
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div {...getRootProps()} className="flex flex-1">
        <Button className="w-full" disabled={status !== "idle"}>
          {status === "uploading" ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <UploadCloudIcon className="size-5" />
          )}{" "}
          {t("dragOrUploadFile")}
        </Button>
        <input {...getInputProps()} />
      </div>
    </div>
  )
}

function SmartUploader<T>({
  processFile,
  onStoreFile,
  organizationId,
  projectId,
}: UploaderProps<T> & {
  onStoreFile?: (file?: File) => void
}) {
  const { t } = useTranslation("common")
  const [file, setFile] = useState<File>()
  const [isFileStored, setIsFileStored] = useState(false)

  const { getRootProps, getInputProps, status, setStatus, handleProcessFile } = useUploader<T>({
    processFile,
    onDrop: setFile,
    organizationId,
    projectId,
  })

  useEffect(() => {
    onStoreFile?.(isFileStored ? file : undefined)
  }, [isFileStored, file, onStoreFile])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div {...getRootProps()} className="flex flex-1">
        <div className="flex w-full items-center gap-2">
          {status === "uploading" ? (
            <div>
              <Loader2Icon className="size-5 animate-spin" />
              {t("processingFile")}
            </div>
          ) : status === "end" ? (
            <>
              <Button disabled variant="secondary" className="disabled:opacity-100">
                <SparklesIcon className="size-4" />
                {t("aiAssistant", { colon: true })} {t("smartScanDone")}
              </Button>

              <Button
                className="w-fit"
                onClick={() => {
                  setStatus("idle")
                  if (!file) return
                  void handleProcessFile(file)
                }}
              >
                <SparklesIcon className="size-4" />
                {t("regenerate", { cfl: true })}
              </Button>
            </>
          ) : (
            <Button className="w-full">
              <SparklesIcon className="size-4" /> {t("dragOrUploadFile")}
            </Button>
          )}
        </div>

        <input {...getInputProps()} />
      </div>

      <div className="flex select-none flex-col gap-2">
        <div
          className={cn(
            "flex items-center gap-2",
            isFileStored ? "text-green-600" : "text-orange-400",
          )}
        >
          {isFileStored ? (
            <>
              <FileCheckIcon className="size-5" />
              {t("fileIsStored")}
            </>
          ) : (
            <>
              <TriangleAlertIcon className="size-5" />
              {t("fileIsNotStored")}
            </>
          )}
        </div>
        {onStoreFile && (
          <div className="text-primary flex cursor-pointer items-center gap-2 px-px underline-offset-1 hover:underline">
            <Switch checked={isFileStored} onCheckedChange={setIsFileStored} />
            {t("storeFile", { cfl: true })}
          </div>
        )}
      </div>
    </div>
  )
}
