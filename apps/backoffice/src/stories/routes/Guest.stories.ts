import { GuestRoute } from '@/routes/GuestRoute';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { reactRouterParameters, withRouter } from 'storybook-addon-remix-react-router';

const meta = {
  title: 'routes/Guest',
  component: GuestRoute,
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    reactRouter: reactRouterParameters({
      location: {
        pathParams: { userId: '42' },
      },
      routing: { path: '/users/:userId' },
    }),
  },
} satisfies Meta<typeof GuestRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {};
