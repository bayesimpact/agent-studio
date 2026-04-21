import type { Preview } from "@storybook/react-vite"

import "../src/index.css"
import "../src/i18n"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
