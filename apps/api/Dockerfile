#
# 🏡 Production Build
#
FROM node:24-bookworm-slim AS build

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY apps/api ./apps/api
COPY ./packages ./packages
COPY package-lock.json ./
COPY package.json ./

# Generate the production build. The build script runs "nest build" to compile the application.
RUN npm ci
RUN cd apps/api && npm run build
RUN cd packages/api-contracts && npm run build

#
# 🚀 Runtime Base (shared)
#
FROM node:24-bookworm-slim AS runtime-base

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*

# Set to production environment
ENV NODE_ENV=production

# Copy only the necessary files
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/api-contracts /app/packages/api-contracts
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/node_modules node_modules

#
# 🚀 API Runtime (no Docling)
#
FROM runtime-base AS api-runtime

CMD ["node", "/app/apps/api/dist/main.js"]

#
# 🚀 Workers Runtime (Docling enabled)
#
FROM runtime-base AS workers-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 python3-pip python3-venv \
  libxcb1 libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/docling-venv \
  && /opt/docling-venv/bin/pip install --no-cache-dir --upgrade pip \
  && /opt/docling-venv/bin/pip install --no-cache-dir docling \
  && ln -s /opt/docling-venv/bin/docling /usr/local/bin/docling

CMD ["node", "/app/apps/api/dist/workers-main.js"]
