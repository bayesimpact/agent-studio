import { Button } from "@caseai-connect/ui/shad/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { GridHeader } from "@/common/components/grid/Grid"
import { useAppDispatch } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import type { DatasetFile } from "@/eval/features/datasets/datasets.models"
import { datasetsActions } from "@/eval/features/datasets/datasets.slice"
import { EmptyFile } from "./EmptyFile"
import { UploadFile } from "./UploadFile"
import { UploaderState } from "./UploadState"

export function FileList({ files }: { files: DatasetFile[] }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border overflow-hidden">
      <GridHeader
        title={t("evaluation:file.title")}
        description={t("evaluation:file.description")}
        action={<UploadFile />}
      />

      <div className="p-6 flex flex-col gap-6 bg-white">
        <UploaderState />
        {files.length === 0 ? (
          <EmptyFile />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium rounded-tl-lg bg-muted">
                  {t("evaluation:file.props.name")}
                </TableHead>
                <TableHead className="font-medium bg-muted">
                  {t("evaluation:file.props.createdAt")}
                </TableHead>
                <TableHead className="w-10 rounded-tr-lg bg-muted" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function FileRow({ file }: { file: DatasetFile }) {
  const date = buildSince(file.createdAt)
  return (
    <TableRow>
      <TableCell>{file.fileName}</TableCell>
      <TableCell className="text-muted-foreground">{date}</TableCell>
      <TableCell>
        <FileActions file={file} />
      </TableCell>
    </TableRow>
  )
}

function FileActions({ file }: { file: DatasetFile }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const handleSelect = () => {
    dispatch(datasetsActions.setCurrentFileId({ fileId: file.id }))
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleSelect}>
        {t("actions:select")}
      </Button>
    </div>
  )
}

function _FileDeletor({ file }: { file: DatasetFile }) {
  const dispatch = useAppDispatch()
  const handleDelete = () => {
    dispatch(datasetsActions.deleteFile({ fileId: file.id }))
  }

  return (
    <Button variant="outline" size="icon" onClick={handleDelete}>
      <Trash2Icon />
    </Button>
  )
}
