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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsRunning(false)
      setFile(undefined)
    }
    setOpen(nextOpen)
  }

  const handleSubmit = async () => {
    if (!file) return
    setIsRunning(true)
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
          maxFiles={1}
          onProcessFiles={async (files) => {
            const file = files[0]
            if (!file) return // because maxFiles is 1
            await dispatch(executeExtractionAgentSession({ file })).unwrap()
          }}
          onProcessEnd={() => setOpen(false)}
          allowedMimeTypes={{ "application/pdf": true }}
          shouldRun={isRunning}
          onDropFiles={(files) => setFile(files[0])}
        >
          <Button
            className="w-full max-w-full justify-start"
            variant={file ? "secondary" : "outline"}
            disabled={isRunning}
          >
            {file ? (
              file.name
            ) : (
              <span className="capitalize-first">{t("actions:dragOrUploadFile")}</span>
            )}
          </Button>
        </FileUploader>

        <Button disabled={isRunning} onClick={handleSubmit}>
          <span className=" capitalize-first">
            {isRunning ? t("status:loading") : t("actions:run")}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
