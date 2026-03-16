import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FileUploader } from "@/components/FileUploader"
import { useAppDispatch } from "@/store/hooks"
import { executeExtractionAgentSession } from "../extraction-agent-sessions.thunks"

export function ExtractionSessionCreator() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File>()
  const [isRunning, setIsRunning] = useState(false)

  const handleProcessFile = async ({ file }: { file: File }) => {
    setFile(file)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setFile(undefined)
    setOpen(nextOpen)
  }

  const disabled = isRunning || !file

  const handleSubmit = async () => {
    if (disabled) return

    setIsRunning(true)

    try {
      await dispatch(executeExtractionAgentSession({ file })).unwrap() // FIXME: should add data to slice

      setOpen(false)
    } catch (_) {
      // Ignore error, it will be handled by the middleware and displayed in the UI
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={isRunning}>
          <PlusIcon />
          <span>{t("extractionAgentSession:create.button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("extractionAgentSession:create.title")}</DialogTitle>
          <DialogDescription>{t("extractionAgentSession:create.description")}</DialogDescription>
        </DialogHeader>

        <FileUploader
          className="w-full max-w-full overflow-hidden"
          processFile={handleProcessFile}
          allowedMimeTypes={{ pdf: true }}
        >
          {(status) => {
            return (
              <Button
                className="w-full max-w-full justify-start"
                variant={file ? "secondary" : "outline"}
                disabled={status === "uploading"}
              >
                {file ? (
                  file.name
                ) : (
                  <span className="capitalize-first">{t("actions:dragOrUploadFile")}</span>
                )}
              </Button>
            )
          }}
        </FileUploader>

        <Button disabled={disabled} onClick={handleSubmit}>
          <span className=" capitalize-first">
            {isRunning ? t("status:loading") : t("actions:run")}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
