import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import z from "zod"
import { Loader } from "@/common/components/Loader"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import {
  COLUMN_ROLES,
  type ColumnRole,
  type DatasetFile,
  type DatasetFileColumn,
} from "@/eval/features/datasets/datasets.models"
import { selectColumnsData } from "@/eval/features/datasets/datasets.selectors"
import { datasetsActions } from "@/eval/features/datasets/datasets.slice"

function buildPreviewData(columns: DatasetFileColumn[]) {
  const rowCount = Math.max(...columns.map((column) => column.sampleValues.length))
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: Record<string, string> = {}
    for (const column of columns) {
      row[column.id] =
        column.sampleValues[rowIndex] != null ? String(column.sampleValues[rowIndex]) : ""
    }
    return row
  })
}

function buildPreviewColumns(columns: DatasetFileColumn[]): ColumnDef<Record<string, string>>[] {
  return columns.map((column) => ({
    id: column.id,
    accessorKey: column.id,
    header: column.name,
    cell: ({ getValue }) => <span className="truncate">{getValue() as string}</span>,
    size: 180,
    minSize: 100,
    maxSize: 300,
  }))
}

function PreviewTable({ columns }: { columns: DatasetFileColumn[] }) {
  const data = useMemo(() => buildPreviewData(columns), [columns])
  const tableColumns = useMemo(() => buildPreviewColumns(columns), [columns])
  const table = useReactTable({ data, columns: tableColumns, getCoreRowModel: getCoreRowModel() })
  const totalSize = table.getTotalSize()
  return (
    <div className="max-h-64 overflow-x-scroll rounded-md border">
      <table className="caption-bottom text-sm" style={{ minWidth: totalSize }}>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="truncate text-muted-foreground"
                  style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  )
}

export function DatasetCreator({ file }: { file: DatasetFile }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const columnsData = useAppSelector(selectColumnsData)

  useEffect(() => {
    dispatch(datasetsActions.getColumns({ documentId: file.id }))
  }, [file, dispatch])

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">{t("evaluation:file.actions.createDataset")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] min-w-1/2 max-w-2/3 overflow-y-auto min-h-1/2">
        {ADS.isFulfilled(columnsData) ? (
          <FormWithColumns
            file={file}
            originalColumns={columnsData.value}
            onSubmit={() => setOpen(false)}
          />
        ) : (
          <Loader />
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormWithColumns({
  file,
  originalColumns,
  onSubmit,
}: {
  file: DatasetFile
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
        role: z.enum(COLUMN_ROLES),
        index: z.number(),
      }),
    ),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
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
      datasetsActions.createOne({ documentId: file.id, name: data.name, columns: data.columns }),
    )

    resetForm()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <DialogHeader>
        <DialogTitle>
          {t("evaluation:dataset.create.title", { fileName: file.fileName })}
        </DialogTitle>
        <DialogDescription>{t("evaluation:dataset.create.description")}</DialogDescription>
      </DialogHeader>

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
                    <PreviewTable columns={originalColumns} />
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
                      onValueChange={(value) =>
                        update(fieldIndex, { ...field, role: value as ColumnRole })
                      }
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMN_ROLES.map((role) => (
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
