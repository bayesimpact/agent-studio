import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import type { ValueType } from "recharts/types/component/DefaultTooltipContent"

export type DailyMetricPoint = {
  date: string
  value: number
}

export type ChartCardGetSummaryValue = (data: DailyMetricPoint[]) => number

type ChartCardProps = {
  title: string
  description?: string
  metricLabel: string
  data: DailyMetricPoint[]
  /** How to derive the headline number from the series (e.g. sum for counts, mean for daily averages). */
  getSummaryValue: ChartCardGetSummaryValue
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

function formatSummaryNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

function ChartCard({ title, description, metricLabel, data, getSummaryValue }: ChartCardProps) {
  const summaryValue = useMemo(() => getSummaryValue(data), [data, getSummaryValue])

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 pt-4 sm:py-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex">
          <div className="flex relative z-30 flex-1 flex-col justify-center gap-1 border-t bg-muted/20 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">{metricLabel}</span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {formatSummaryNumber(summaryValue)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={formatDateTick}
              />
              <Tooltip
                formatter={(value) => [formatTooltipNumber(value), metricLabel]}
                labelFormatter={(labelValue) => formatTooltipLabel(labelValue)}
              />
              <Bar dataKey="value" fill="var(--color-chart-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChartCard
