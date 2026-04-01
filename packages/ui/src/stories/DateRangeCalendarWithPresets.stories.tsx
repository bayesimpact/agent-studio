import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import {
  DateRangeCalendarWithPresets,
  DateRangeCalendarWithPresetsPopover,
} from "@/components/DateRangeCalendarWithPresets"

const meta = {
  title: "UI/DateRangeCalendarWithPresets",
  component: DateRangeCalendarWithPresets,
  parameters: { layout: "padded" },
  args: {
    onRangeChange: fn(),
    numberOfMonths: 2,
    defaultPreset: "last7Days" as const,
  },
  argTypes: {
    defaultPreset: {
      control: "select",
      options: ["last7Days", "last30Days"],
    },
    numberOfMonths: { control: { type: "number", min: 1, max: 3 } },
  },
} satisfies Meta<typeof DateRangeCalendarWithPresets>

export default meta
type Story = StoryObj<typeof meta>

export const InlineCard: Story = {
  name: "Inline card",
  args: {
    defaultPreset: "last7Days",
  },
}

export const InlineCardLast30: Story = {
  name: "Inline card (last 30 default)",
  args: {
    defaultPreset: "last30Days",
  },
}

export const InlineSingleMonth: Story = {
  name: "Inline card (single month)",
  args: {
    defaultPreset: "last7Days",
    numberOfMonths: 1,
  },
}

export const InPopoverDropdown: StoryObj<typeof DateRangeCalendarWithPresetsPopover> = {
  name: "In popover (dropdown)",
  render: (args) => (
    <div className="flex justify-center p-8">
      <DateRangeCalendarWithPresetsPopover
        defaultPreset={args.defaultPreset}
        numberOfMonths={args.numberOfMonths}
        placeholder={args.placeholder}
        onRangeChange={fn()}
      />
    </div>
  ),
  args: {
    defaultPreset: "last7Days",
    numberOfMonths: 2,
    placeholder: "Pick a date range",
  },
  argTypes: {
    defaultPreset: {
      control: "select",
      options: ["last7Days", "last30Days"],
    },
    numberOfMonths: { control: { type: "number", min: 1, max: 3 } },
  },
}
