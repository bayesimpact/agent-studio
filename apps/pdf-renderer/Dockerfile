#
# 🏡 Production Build
#
FROM node:24.16.0-bookworm-slim AS build

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY apps/pdf-renderer ./apps/pdf-renderer
COPY ./packages ./packages
COPY package-lock.json ./
COPY package.json ./

# Generate the production build. The build script runs "nest build" to compile the application.
# Scope install to the pdf-renderer workspace so no other app's runtime deps enter node_modules/.
RUN npm ci \
    --workspace=@caseai-connect/pdf-renderer \
    --include-workspace-root
RUN cd apps/pdf-renderer && npm run build

# Discard the dev install and reinstall only production deps. A fresh `npm ci --omit=dev`
# produces a cleaner tree than `npm prune --omit=dev`, which leaves extraneous packages
# lingering in node_modules.
RUN rm -rf node_modules apps/pdf-renderer/node_modules packages/*/node_modules
RUN npm ci --omit=dev \
    --workspace=@caseai-connect/pdf-renderer \
    --include-workspace-root

# Ensure apps/pdf-renderer/node_modules exists (npm may skip creating it when everything hoists to root).
RUN mkdir -p /app/apps/pdf-renderer/node_modules

#
# 🚀 Runtime
#
FROM node:24.16.0-bookworm-slim AS pdf-renderer-runtime

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*

# Set to production environment
ENV NODE_ENV=production

# Copy only the necessary files
COPY --from=build /app/apps/pdf-renderer/dist /app/apps/pdf-renderer/dist
COPY --from=build /app/apps/pdf-renderer/node_modules /app/apps/pdf-renderer/node_modules
COPY --from=build /app/node_modules node_modules

CMD ["node", "--enable-source-maps", "/app/apps/pdf-renderer/dist/main.js"]
