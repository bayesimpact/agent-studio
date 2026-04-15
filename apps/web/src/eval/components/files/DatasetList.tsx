import { Button } from "@caseai-connect/ui/shad/button"
import { Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import { buildSince } from "@/common/utils/build-date"
import type { EvaluationDataset } from "@/eval/features/datasets/datasets.models"
import { useDatasetPath } from "@/eval/hooks/use-dataset-path"
import { DatasetCreator } from "../DatasetCreator"
import { EmptyDataset } from "./EmptyDataset"

export function DatasetList({ datasets }: { datasets: EvaluationDataset[] }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handleBack = () => {
    navigate(-1)
  }
  if (datasets.length === 0) return <EmptyDataset />
  return (
    <Grid cols={3} total={datasets.length} extraItems={1}>
      <GridHeader
        title={t("evaluation:dataset.title")}
        description={t("evaluation:dataset.description")}
        onBack={handleBack}
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
  const navigate = useNavigate()
  const { t } = useTranslation()
  const date = buildSince(dataset.createdAt)
  const { buildDatasetPath } = useDatasetPath()

  const handleClick = () => {
    const path = buildDatasetPath({ datasetId: dataset.id })
    navigate(path)
  }
  return (
    <GridItem
      badge={t("evaluation:dataset.dataset")}
      title={dataset.name}
      description={date}
      index={index}
      onClick={handleClick}
      footer={<Actions />}
    />
  )
}

function Actions() {
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
