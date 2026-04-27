import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PlusCircleIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FileUploader } from "@/common/components/FileUploader"
import { executeExtractionAgentSession } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks"
import { useAppDispatch } from "@/common/store/hooks"

export function ExtractionSessionCreator({ disabled }: { disabled: boolean }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File>()
  const [startProcessingFiles, setStartProcessingFiles] = useState(false)

  const resetState = () => {
    setOpen(false)
    setStartProcessingFiles(false)
    setFile(undefined)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStartProcessingFiles(false)
      setFile(undefined)
    }
    setOpen(nextOpen)
  }

  const handleSubmit = async () => {
    if (!file) return
    setStartProcessingFiles(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="text-base" disabled={startProcessingFiles || disabled}>
          {t("actions:create")}
          <PlusCircleIcon className="ml-2 size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("extractionAgentSession:create.title")}</DialogTitle>
          <DialogDescription>{t("extractionAgentSession:create.description")}</DialogDescription>
        </DialogHeader>

        <FileUploader
          className="w-full max-w-full overflow-hidden"
          maxFiles={1}
          onProcessFiles={async (files) => {
            const file = files[0]
            if (!file) return // because maxFiles is 1
            await dispatch(executeExtractionAgentSession({ file })).unwrap()
          }}
          onProcessEnd={resetState}
          allowedMimeTypes={{ "application/pdf": true, "image/jpeg": true }}
          startProcessingFiles={startProcessingFiles}
          onDropFiles={(files) => setFile(files[0])}
        >
          <Button
            className="w-full max-w-full justify-start"
            variant={file ? "secondary" : "outline"}
            disabled={startProcessingFiles}
          >
            {file ? (
              file.name
            ) : (
              <span className="capitalize-first">{t("actions:dragOrUploadFile")}</span>
            )}
          </Button>
        </FileUploader>

        <Button disabled={startProcessingFiles} onClick={handleSubmit}>
          <span className=" capitalize-first">
            {startProcessingFiles ? t("status:loading") : t("actions:run")}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
