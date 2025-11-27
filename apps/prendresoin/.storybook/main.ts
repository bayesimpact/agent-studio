import type { StorybookConfig } from '@storybook/react-vite';

import { dirname } from "path";

import { fileURLToPath } from "url";

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-themes')
  ],
  "framework": getAbsolutePath('@storybook/react-vite'),
  viteFinal: async (config) => {
    return {
      ...config,
      css: {
        ...config.css,
        postcss: {
          // plugins: [
          //   require('tailwindcss'),
          //   require('autoprefixer'),
          // ],
        },
      },
    };
  },
};
export default config;
