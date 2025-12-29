import { GuestRoute } from '@/routes/GuestRoute';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withRouter } from 'storybook-addon-remix-react-router';

const meta = {
  title: 'routes/Guest',
  component: GuestRoute,
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GuestRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {};
