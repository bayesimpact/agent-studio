#
# 🏡 Production Build
#
FROM node:24-alpine AS build

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy source code
COPY apps/api ./apps/api
COPY ./packages ./packages
COPY package-lock.json ./
COPY package.json ./

# Generate the production build. The build script runs "nest build" to compile the application.
RUN npm ci
RUN cd apps/api && npm run build

#
# 🚀 Production Server
#
FROM node:24-alpine AS prod

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Set to production environment
ENV NODE_ENV=production

# Copy only the necessary files
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/api-contracts /app/packages/api-contracts
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/node_modules node_modules

CMD ["node", "/app/apps/api/dist/main.js"]
