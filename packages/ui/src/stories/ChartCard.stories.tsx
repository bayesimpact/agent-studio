import type { Meta, StoryObj } from "@storybook/react"
import type { DailyMetricPoint } from "@/components/ChartCard"
import ChartCard from "@/components/ChartCard"

type StoryArgs = {
  title: string
  metricLabel: string
}

const meta: Meta<StoryArgs> = {
  title: "UI/ChartCard",
  parameters: { layout: "padded" },
}

export default meta
type Story = StoryObj<StoryArgs>

const chartData: DailyMetricPoint[] = [
  { date: "2026-01-01", value: 34 },
  { date: "2026-01-02", value: 21 },
  { date: "2026-01-03", value: 47 },
  { date: "2026-01-04", value: 55 },
  { date: "2026-01-05", value: 31 },
  { date: "2026-01-06", value: 62 },
  { date: "2026-01-07", value: 39 },
  { date: "2026-01-08", value: 44 },
  { date: "2026-01-09", value: 28 },
  { date: "2026-01-10", value: 67 },
  { date: "2026-01-11", value: 53 },
  { date: "2026-01-12", value: 36 },
  { date: "2026-01-13", value: 75 },
  { date: "2026-01-14", value: 49 },
  { date: "2026-01-15", value: 58 },
  { date: "2026-01-16", value: 30 },
  { date: "2026-01-17", value: 82 },
  { date: "2026-01-18", value: 71 },
  { date: "2026-01-19", value: 43 },
  { date: "2026-01-20", value: 51 },
  { date: "2026-01-21", value: 64 },
  { date: "2026-01-22", value: 27 },
  { date: "2026-01-23", value: 59 },
  { date: "2026-01-24", value: 46 },
  { date: "2026-01-25", value: 40 },
  { date: "2026-01-26", value: 69 },
  { date: "2026-01-27", value: 33 },
  { date: "2026-01-28", value: 57 },
  { date: "2026-01-29", value: 48 },
  { date: "2026-01-30", value: 77 },
]

/** Series stays outside `args` so Storybook does not traverse/freeze it (avoids HMR readonly errors). */
export const ChartCardExample: Story = {
  args: {
    title: "Conversations per day",
    metricLabel: "Conversations",
  },
  render: (args) => (
    <div className="max-w-5xl">
      <ChartCard
        title={args.title}
        metricLabel={args.metricLabel}
        data={chartData}
        getSummaryValue={(series) => series.reduce((sum, point) => sum + point.value, 0)}
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      />
    </div>
  ),
}
