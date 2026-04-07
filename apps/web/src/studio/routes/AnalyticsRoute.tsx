import ChartCard, { type DailyMetricPoint } from "@caseai-connect/ui/components/ChartCard"
import { DateRangeCalendarWithPresetsPopover } from "@caseai-connect/ui/components/DateRangeCalendarWithPresets"
import { getLast7DaysRange } from "@caseai-connect/ui/lib/date-range-presets"
import { useCallback, useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import {
  selectAnalyticsAvgUserQuestionsPerSessionPerDay,
  selectAnalyticsConversationsPerDay,
} from "@/studio/features/analytics/analytics.selectors"
import { loadProjectAnalytics } from "@/studio/features/analytics/analytics.thunks"
import { dateRangeToAnalyticsQueryBounds } from "@/studio/features/analytics/analytics-date-range"
import { AsyncRoute } from "../../common/routes/AsyncRoute"

function sumDailyMetricValues(series: DailyMetricPoint[]): number {
  return series.reduce((sum, point) => sum + point.value, 0)
}

function meanDailyMetricValues(series: DailyMetricPoint[]): number {
  if (series.length === 0) {
    return 0
  }
  return sumDailyMetricValues(series) / series.length
}

function getInitialAnalyticsBounds() {
  const initialRange = getLast7DaysRange()
  return dateRangeToAnalyticsQueryBounds({
    from: initialRange.from,
    to: initialRange.to,
  })!
}

export function AnalyticsRoute() {
  const dispatch = useAppDispatch()
  const [bounds, setBounds] = useState(getInitialAnalyticsBounds)

  useEffect(() => {
    void dispatch(loadProjectAnalytics(bounds))
  }, [dispatch, bounds])

  const conversations = useAppSelector(selectAnalyticsConversationsPerDay)
  const avgQuestions = useAppSelector(selectAnalyticsAvgUserQuestionsPerSessionPerDay)

  return (
    <AsyncRoute data={[conversations, avgQuestions]}>
      {([conversationsPoints, avgQuestionsPoints]) => (
        <WithData
          conversationsPoints={conversationsPoints}
          avgQuestionsPoints={avgQuestionsPoints}
          onAnalyticsRangeChange={setBounds}
        />
      )}
    </AsyncRoute>
  )
}

function WithData({
  conversationsPoints,
  avgQuestionsPoints,
  onAnalyticsRangeChange,
}: {
  conversationsPoints: { date: string; value: number }[]
  avgQuestionsPoints: { date: string; value: number }[]
  onAnalyticsRangeChange: (nextBounds: { startAt: number; endAt: number }) => void
}) {
  const { t } = useTranslation("analytics")

  const onRangeChange = useCallback(
    (range: DateRange | undefined) => {
      const next = dateRangeToAnalyticsQueryBounds(range)
      if (next) {
        onAnalyticsRangeChange(next)
      }
    },
    [onAnalyticsRangeChange],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <DateRangeCalendarWithPresetsPopover
          defaultPreset="last7Days"
          onRangeChange={onRangeChange}
          placeholder={t("dateRangePlaceholder")}
          align="end"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <ChartCard
          title={t("conversationsChart.title")}
          description={t("conversationsChart.description")}
          metricLabel={t("conversationsChart.metricLabel")}
          data={conversationsPoints}
          getSummaryValue={sumDailyMetricValues}
        />
        <ChartCard
          title={t("avgQuestionsChart.title")}
          description={t("avgQuestionsChart.description")}
          metricLabel={t("avgQuestionsChart.metricLabel")}
          data={avgQuestionsPoints}
          getSummaryValue={meanDailyMetricValues}
        />
      </div>
    </div>
  )
}
