import { EVALUATION_DATASET_SCHEMA_COLUMN_ROLES } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { Fragment, useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import z from "zod"
import { Loader } from "@/common/components/Loader"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import type {
  DatasetFile,
  DatasetFileColumn,
  EvaluationDatasetSchemaColumnRole,
} from "@/eval/features/datasets/datasets.models"
import {
  selectCurrentFileData,
  selectFileColumnsData,
  selectFilesData,
} from "@/eval/features/datasets/datasets.selectors"
import { datasetsActions } from "@/eval/features/datasets/datasets.slice"
import { FileList } from "./files/FileList"
import { FilePreview } from "./files/FilePreview"

export function DatasetEditor({
  datasetId,
  modalHandler,
}: {
  datasetId: string
  modalHandler: { setOpen: (open: boolean) => void; open: boolean }
}) {
  const dispatch = useAppDispatch()
  const file = useAppSelector(selectCurrentFileData)
  const { t } = useTranslation()

  useEffect(() => {
    if (modalHandler.open) return
    dispatch(datasetsActions.setCurrentFileId({ fileId: null }))
  }, [modalHandler.open, dispatch])

  const hasFile = ADS.isFulfilled(file)
  return (
    <Dialog modal open={modalHandler.open} onOpenChange={modalHandler.setOpen}>
      <DialogContent className="max-h-[85vh] min-w-4/5  2xl:min-w-2/3 max-w-2/3 overflow-y-auto min-h-1/2">
        <DialogHeader>
          <DialogTitle>{t("evaluation:dataset.update.title")}</DialogTitle>
          <DialogDescription>{t("evaluation:dataset.update.description")}</DialogDescription>
        </DialogHeader>

        {hasFile ? (
          <ColumnsEditor
            file={file.value}
            datasetId={datasetId}
            onSubmit={() => modalHandler.setOpen(false)}
          />
        ) : (
          <FileUploader />
        )}
      </DialogContent>
    </Dialog>
  )
}

function FileUploader() {
  const files = useAppSelector(selectFilesData)
  if (ADS.isFulfilled(files)) return <FileList files={files.value} />
  return <Loader />
}

function ColumnsEditor({
  file,
  datasetId,
  onSubmit,
}: {
  file: DatasetFile
  datasetId: string
  onSubmit: () => void
}) {
  const dispatch = useAppDispatch()
  const columnsData = useAppSelector(selectFileColumnsData)
  useEffect(() => {
    dispatch(datasetsActions.getFileColumns({ documentId: file.id }))
  }, [file, dispatch])

  return (
    <div>
      {ADS.isFulfilled(columnsData) && file ? (
        <FormEdition
          file={file}
          datasetId={datasetId}
          originalColumns={columnsData.value}
          onSubmit={onSubmit}
        />
      ) : (
        <Loader />
      )}
    </div>
  )
}

function FormEdition({
  file,
  datasetId,
  originalColumns,
  onSubmit,
}: {
  file: DatasetFile
  datasetId: string
  originalColumns: DatasetFileColumn[]
  onSubmit: () => void
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const schema = z.object({
    name: z.string().min(3, t("evaluation:validation.minNameLength")),
    columns: z.array(
      z.object({
        id: z.string(),
        originalName: z.string(),
        finalName: z.string(),
        role: z.enum(EVALUATION_DATASET_SCHEMA_COLUMN_ROLES),
        index: z.number(),
      }),
    ),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isValid },
    reset: resetForm,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      columns: originalColumns.map((column, index) => ({
        id: column.id,
        originalName: column.name,
        finalName: column.name,
        role: "ignore" as const,
        index,
      })),
    },
  })

  const { fields, update } = useFieldArray({ control, name: "columns" })

  const handleFormSubmit = (data: FormData) => {
    dispatch(
      datasetsActions.updateOne({
        datasetId,
        documentId: file.id,
        name: data.name,
        columns: data.columns,
      }),
    )

    resetForm()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup className="py-4">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dataset-name">{t("evaluation:dataset.props.name")}</FieldLabel>
              <Input
                id="dataset-name"
                placeholder={t("evaluation:dataset.props.placeholders.name")}
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </Field>
          </FieldGroup>
        </FieldSet>

        {originalColumns.length > 0 ? (
          <>
            <div className="max-w-full overflow-hidden">
              <FieldSet>
                <details open>
                  <summary className="cursor-pointer text-sm font-medium select-none">
                    {t("evaluation:dataset.columns.preview")}
                  </summary>
                  <div className="mt-2 max-w-1/2">
                    <FilePreview columns={originalColumns} />
                  </div>
                </details>
              </FieldSet>
            </div>

            <FieldSet>
              <FieldLabel>{t("evaluation:dataset.columns.roles.title")}</FieldLabel>
              <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-4 gap-y-2 border rounded-md p-4">
                {fields.map((field, fieldIndex) => (
                  <Fragment key={field.id}>
                    <span className="truncate text-sm text-muted-foreground">{fieldIndex + 1}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {field.originalName}
                    </span>
                    <Input
                      className="h-8 text-sm"
                      placeholder={field.originalName}
                      {...register(`columns.${fieldIndex}.finalName`)}
                    />
                    <Select
                      value={field.role}
                      onValueChange={(value) => {
                        const current = getValues(`columns.${fieldIndex}`)
                        update(fieldIndex, {
                          ...current,
                          role: value as EvaluationDatasetSchemaColumnRole,
                        })
                      }}
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVALUATION_DATASET_SCHEMA_COLUMN_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`evaluation:dataset.columns.roles.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Fragment>
                ))}
              </div>
            </FieldSet>
          </>
        ) : (
          <p>{t("evaluation:dataset.columns.noColumns")}</p>
        )}
      </FieldGroup>

      <DialogFooter>
        <Button type="submit" disabled={!isValid}>
          {t("actions:submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}
