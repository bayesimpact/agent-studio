import fs from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const certsDir = path.resolve(__dirname, "../api/.certs")

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@caseai-connect/api-contracts": path.resolve(
        __dirname,
        "../../packages/api-contracts/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    https: fs.existsSync(path.join(certsDir, "key.pem"))
      ? {
          key: fs.readFileSync(path.join(certsDir, "key.pem")),
          cert: fs.readFileSync(path.join(certsDir, "cert.pem")),
        }
      : undefined,
    allowedHosts: ["connect.localhost"],
  },
})
