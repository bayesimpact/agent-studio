# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Turborepo monorepo with the following structure:

- `apps/api` - NestJS backend application (runs on port 3000)
- `apps/web` - Next.js frontend application (runs on port 3001 with Turbopack)
- `packages/@repo/api` - Shared NestJS resources
- `packages/@repo/jest-config` - Shared Jest configurations
- `packages/@repo/typescript-config` - Shared TypeScript configurations
- `packages/@repo/ui` - Shared React component library

## Development Commands

All commands should be run from the root directory using Turbo (via npm scripts):

### Development
- `npx turbo dev` - Start all applications in development mode
- `npx turbo dev --filter=api` - Start only the API application
- `npx turbo dev --filter=web` - Start only the web application

### Building
- `npx turbo build` - Build all applications and packages
- `npx turbo build --filter=api` - Build only the API application
- `npx turbo build --filter=web` - Build only the web application

### Testing
- `npx turbo test` - Run all tests
- `npx turbo test --filter=api` - Run API tests only
- `npx turbo test --filter=web` - Run web tests only

### Code Quality
- `npx turbo lint` - Lint all packages and applications
- `npx turbo lint --filter=api` - Lint only the API application
- `npx turbo lint --filter=web` - Lint only the web application

### TypeScript Compilation Check
- `cd apps/api && npx tsc --noEmit` - Check API TypeScript without emitting files
- `cd apps/web && npx tsc --noEmit` - Check web TypeScript without emitting files

### Application-Specific Commands

**API (NestJS):**
- `cd apps/api && npm run start:dev` - Development with watch mode
- `cd apps/api && npm run start:debug` - Debug mode with inspector
- `cd apps/api && npm run test:watch` - Test watch mode

**Web (Next.js):**
- `cd apps/web && npm run dev` - Development mode with Turbopack
- `cd apps/web && npm run build` - Production build

## Architecture Notes

### API Application
- Built with NestJS framework
- Entry point: `apps/api/src/main.ts`
- Main module: `apps/api/src/app.module.ts`
- Modular structure with feature-based modules
- Uses dependency injection and decorators pattern

#### AI Service Architecture
The API uses a modular AI service provider pattern for extensibility:

- **AIServiceProvider Interface** (`src/common/interfaces/ai-service.interface.ts`):
  - All AI-enabled services implement this interface
  - Methods: `getFunctionDeclaration()`, `getPromptContext()`, `executeFunction()`

- **Current Services**:
  - `FranceTravailService` - Job search via France Travail API
  - `DataInclusionService` - Social services search via Data Inclusion API
  - `GeolocService` - Municipality geocoding for location parameters

- **Adding a New AI Service**:
  1. Implement `AIServiceProvider` interface
  2. Define function declaration (tool schema)
  3. Define prompt context (service-specific instructions)
  4. Implement `executeFunction()` method
  5. Register in `ChatService.onModuleInit()`

- **Dynamic Prompt Building**:
  - System prompt is built dynamically from registered services
  - Each service contributes its own prompt context
  - Maintains separation of concerns and easy extensibility

### Web Application
- Next.js 15 with App Router
- Uses Turbopack for faster development
- Custom fonts with Geist Sans and Geist Mono
- Integrates with shared UI component library from `@repo/ui`
- Entry point: `apps/web/app/page.tsx`

### Shared Packages
- All packages use TypeScript with strict configuration
- Jest configuration is centralized in `@repo/jest-config`

## Package Management

- Uses npm workspaces for monorepo management
- Private packages with internal dependencies using `*` version specifier
- Engines requirement: Node.js >= 18

## TypeScript Configuration

- Shared TypeScript configurations in `@repo/typescript-config`
- Strict type checking enabled across all packages
- Path mapping configured for internal package references