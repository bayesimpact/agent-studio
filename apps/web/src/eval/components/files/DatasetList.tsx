import { Button } from "@caseai-connect/ui/shad/button"
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import { buildSince } from "@/common/utils/build-date"
import type { EvaluationDataset } from "@/eval/features/datasets/datasets.models"
import { DatasetCreator } from "../DatasetCreator"
import { DatasetEditor } from "../DatasetEditor"
import { DatasetRecords } from "./DatasetRecodList"
import { EmptyDataset } from "./EmptyDataset"

export function DatasetList({ datasets }: { datasets: EvaluationDataset[] }) {
  const { t } = useTranslation()
  if (datasets.length === 0) return <EmptyDataset />
  return (
    <Grid cols={3} total={datasets.length} extraItems={1}>
      <GridHeader
        title={t("evaluation:dataset.title")}
        description={t("evaluation:dataset.description")}
      />

      <GridContent>
        <GridItem
          className="bg-muted/35"
          title={t("evaluation:dataset.create.title")}
          description={t("evaluation:dataset.create.description")}
          index={0}
          action={<DatasetCreator />}
        />

        {datasets.map((dataset, index) => (
          <Item key={dataset.id} dataset={dataset} index={index + 1} />
        ))}
      </GridContent>
    </Grid>
  )
}

function Item({ dataset, index }: { dataset: EvaluationDataset; index: number }) {
  const { t } = useTranslation()
  const date = buildSince(dataset.createdAt)
  const [open, setOpen] = useState<"editor" | "records" | null>(null)

  const isDatasetEmpty = Object.values(dataset.schemaMapping).length === 0
  const handleClick = () => {
    setOpen(isDatasetEmpty ? "editor" : "records")
  }
  return (
    <>
      <GridItem
        badge={t("evaluation:dataset.dataset")}
        title={dataset.name}
        description={date}
        index={index}
        onClick={handleClick}
        footer={<Actions dataset={dataset} />}
      />
      <DatasetEditor
        modalHandler={{
          open: open === "editor",
          setOpen: (value) => setOpen(value ? "editor" : null),
        }}
        datasetId={dataset.id}
      />
      <DatasetRecords
        dataset={dataset}
        modalHandler={{
          open: open === "records",
          setOpen: (value) => setOpen(value ? "records" : null),
        }}
      />
    </>
  )
}

function Actions({ dataset }: { dataset: EvaluationDataset }) {
  const handleDelete = () => {
    // TODO:
  }
  return (
    <div className="flex items-center justify-end pb-4 gap-2">
      <Button variant="outline" size="icon" disabled onClick={handleDelete}>
        <Trash2Icon />
      </Button>
    </div>
  )
}
