# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Turborepo monorepo with the following structure:

- `apps/api` - NestJS backend application (runs on port 3000)
- `apps/web` - Next.js frontend application (runs on port 3001 with Turbopack)
- `packages/@repo/api` - Shared NestJS resources
- `packages/@repo/eslint-config` - Shared ESLint configurations
- `packages/@repo/jest-config` - Shared Jest configurations
- `packages/@repo/typescript-config` - Shared TypeScript configurations
- `packages/@repo/ui` - Shared React component library

## Development Commands

All commands should be run from the root directory using npm (configured with npm@10.5.0):

### Development
- `npm run dev` - Start all applications in development mode
- `npm run dev --filter=api` - Start only the API application
- `npm run dev --filter=web` - Start only the web application

### Building
- `npm run build` - Build all applications and packages
- `npm run build --filter=api` - Build only the API application
- `npm run build --filter=web` - Build only the web application

### Testing
- `npm run test` - Run all tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test --filter=api` - Run API tests only

### Code Quality
- `npm run lint` - Lint all packages and applications
- `npm run format` - Format code using Prettier

### Application-Specific Commands

**API (NestJS):**
- `cd apps/api && npm run dev` - Development with watch mode
- `cd apps/api && npm run start:debug` - Debug mode
- `cd apps/api && npm run test:watch` - Test watch mode

**Web (Next.js):**
- `cd apps/web && npm run check-types` - TypeScript type checking

## Architecture Notes

### API Application
- Built with NestJS framework
- Entry point: `apps/api/src/main.ts`
- Main module: `apps/api/src/app.module.ts`
- Modular structure with feature-based modules (e.g., `LinksModule`)
- Uses dependency injection and decorators pattern

### Web Application
- Next.js 15 with App Router
- Uses Turbopack for faster development
- Custom fonts with Geist Sans and Geist Mono
- Integrates with shared UI component library from `@repo/ui`
- Entry point: `apps/web/app/page.tsx`

### Shared Packages
- All packages use TypeScript with strict configuration
- ESLint configuration extends from `@repo/eslint-config` with specific overrides:
  - `@typescript-eslint/no-explicit-any` is disabled
  - `@typescript-eslint/unbound-method` is disabled
- Jest configuration is centralized in `@repo/jest-config`

## Package Management

- Uses npm workspaces for monorepo management
- Private packages with internal dependencies using `*` version specifier
- Engines requirement: Node.js >= 18

## TypeScript Configuration

- Shared TypeScript configurations in `@repo/typescript-config`
- Strict type checking enabled across all packages
- Path mapping configured for internal package references