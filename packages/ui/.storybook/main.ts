import { dirname, join, resolve } from "node:path"
import type { StorybookConfig } from "@storybook/react-vite"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")))
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    // getAbsolutePath('@storybook/addon-themes'),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, "../src"),
    }
    return config
  },
  docs: {
    autodocs: "tag",
  },
}
export default config
