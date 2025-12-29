import { LoadingRoute } from '@/routes/LoadingRoute';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'routes/Loading',
  component: LoadingRoute,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LoadingRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
