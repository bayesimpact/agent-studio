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
import { BasicUploader } from "@/components/FileUploader"
import { useAppDispatch } from "@/store/hooks"
import { executeAgentExtractionRun } from "../agent-extraction-runs.thunks"

export function ExtractionCreator() {
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
      await dispatch(executeAgentExtractionRun({ file })).unwrap() // FIXME: should add data to slice

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
          <span>{t("agentExtractionRun:create.button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("agentExtractionRun:create.title")}</DialogTitle>
          <DialogDescription>{t("agentExtractionRun:create.description")}</DialogDescription>
        </DialogHeader>

        <BasicUploader
          className="w-full max-w-full overflow-hidden"
          processFile={handleProcessFile}
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
        </BasicUploader>

        <Button disabled={disabled} onClick={handleSubmit}>
          <span className=" capitalize-first">
            {isRunning ? t("status:loading") : t("actions:run")}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
