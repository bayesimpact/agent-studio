import ChartCard, { type DailyMetricPoint } from "@caseai-connect/ui/components/ChartCard"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ValueType } from "recharts/types/component/DefaultTooltipContent"
import type { AnalyticsCategoryDailyPoint } from "../analytics.models"

function getCategoryColor(categoryLabel: string): string {
  let hash = 0
  for (let characterIndex = 0; characterIndex < categoryLabel.length; characterIndex += 1) {
    hash = (hash << 5) - hash + categoryLabel.charCodeAt(characterIndex)
    hash |= 0
  }

  const normalizedHash = Math.abs(hash)
  const hue = normalizedHash % 360
  const lightness = 0.64 + ((normalizedHash >> 8) % 7) * 0.015
  const chroma = 0.16 + ((normalizedHash >> 5) % 4) * 0.01

  // Keep colors in the same OKLCH family used across the app theme.
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue})`
}

function formatDateTick(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTooltipLabel(labelValue: React.ReactNode): string {
  const safeDate = new Date(String(labelValue))
  return safeDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTooltipNumber(value: ValueType | undefined): string {
  return value?.toLocaleString() ?? "N/A"
}

function formatYAxisTick(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

export function ProjectCategoryChartCard({
  points,
  allDates,
  selectedAgentId,
  title,
  description,
  noDataState,
  uncategorizedLabel,
}: {
  points: AnalyticsCategoryDailyPoint[]
  allDates: string[]
  selectedAgentId: string
  title: string
  description: string
  noDataState: string
  uncategorizedLabel: string
}) {
  const visiblePoints = points.filter((point) =>
    selectedAgentId === "all" ? false : point.agentId === selectedAgentId,
  )

  const categoryLabels = Array.from(
    new Set(
      visiblePoints.map((point) =>
        point.isUncategorized ? uncategorizedLabel : point.categoryName,
      ),
    ),
  ).sort((firstLabel, secondLabel) => firstLabel.localeCompare(secondLabel))

  const rowsByDate = new Map<string, Record<string, number | string>>()
  for (const dayKey of allDates) {
    rowsByDate.set(dayKey, { date: dayKey })
  }

  for (const point of visiblePoints) {
    const categoryLabel = point.isUncategorized ? uncategorizedLabel : point.categoryName
    const existingRow = rowsByDate.get(point.date)
    if (existingRow) {
      existingRow[categoryLabel] = point.value
      continue
    }
    rowsByDate.set(point.date, { date: point.date, [categoryLabel]: point.value })
  }

  const chartData = Array.from(rowsByDate.entries()).map(([_date, row]) => {
    for (const categoryLabel of categoryLabels) {
      if (!row[categoryLabel]) {
        row[categoryLabel] = 0
      }
    }
    return row
  })

  const emptySeries: DailyMetricPoint[] = allDates.map((date) => ({ date, value: 0 }))

  const customChart =
    visiblePoints.length === 0 ? (
      <div className="px-4 py-2 text-sm text-muted-foreground">{noDataState}</div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={formatDateTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={52}
            domain={[0, "auto"]}
            tickFormatter={formatYAxisTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [formatTooltipNumber(value)]}
            labelFormatter={(labelValue) => formatTooltipLabel(labelValue)}
          />
          <Legend />
          {categoryLabels.map((categoryLabel) => (
            <Bar
              key={categoryLabel}
              dataKey={categoryLabel}
              stackId="sessions"
              fill={getCategoryColor(categoryLabel)}
            >
              {chartData.map((row, rowIndex) => {
                const topCategoryLabel = [...categoryLabels]
                  .reverse()
                  .find((candidateLabel) => Number(row[candidateLabel] ?? 0) > 0)

                return (
                  <Cell
                    key={`${categoryLabel}-${row.date}-${rowIndex}`}
                    // @ts-expect-error Recharts Cell forwards rectangle radius arrays at runtime.
                    radius={topCategoryLabel === categoryLabel ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  />
                )
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    )

  return (
    <ChartCard
      title={title}
      description={description}
      data={emptySeries}
      hideSummary
      customChart={customChart}
    />
  )
}
