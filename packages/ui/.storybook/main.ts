import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"

function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(dirname(fileURLToPath(import.meta.url)), "../src"),
    }
    return config
  },
  docs: {
    autodocs: "tag",
  },
}
export default config
