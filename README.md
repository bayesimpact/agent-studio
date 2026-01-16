# CaseAI Connect

A SaaS platform built as a Turbo monorepo with a NestJS API and React backoffice, using Auth0 for authentication.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 10.5.0 (or the version specified in `package.json`)
- **Docker** and **Docker Compose** (for local database)
- **PostgreSQL** (via Docker, see below)

## Getting Started

### 1. Install Dependencies

From the root of the repository:

```bash
npm install
```

This will install dependencies for all workspaces (apps and packages).

### 2. Set Up the Database

The project uses PostgreSQL with pgvector extension. The easiest way to run it locally is via Docker Compose.

#### Start the Database

```bash
cd infra/database
docker compose up -d
```

This will:
- Start a PostgreSQL 17 container with pgvector extension
- Create two databases:
  - `caseai_connect` (main database)
  - `caseai_connect_test` (test database)
- Expose PostgreSQL on port `5432`

**Database Credentials:**
- Host: `localhost`
- Port: `5432`
- User: `admin`
- Password: `passpass`
- Main Database: `caseai_connect`
- Test Database: `caseai_connect_test`

#### Stop the Database

```bash
cd infra/database
docker compose down
```

#### View Database Logs

```bash
cd infra/database
docker compose logs -f
```

### 3. Configure Environment Variables

#### API Environment Variables

Copy the example environment file:

```bash
cd apps/api
cp .env-example .env
```

Edit `.env` with your configuration:

```bash
# Timezone
TZ='UTC'

# Google Cloud (optional, for AI features)
GOOGLE_APPLICATION_CREDENTIALS=../../dontsave/caseai-connect-XXX.json

# Langfuse (optional, for AI observability)
LANGFUSE_SK=XXX
LANGFUSE_PK=XXX
LANGFUSE_BASE_URL=XXX

# Database
DATABASE_URL=postgresql://admin:passpass@localhost:5432/caseai_connect

# Auth0
AUTH0_ISSUER_URL=https://bayes-impact.eu.auth0.com/
AUTH0_AUDIENCE=https://bayes-impact.eu.auth0.com/api/v2/
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH0_ISSUER_URL` - Auth0 issuer URL
- `AUTH0_AUDIENCE` - Auth0 API audience

**Optional variables:**
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud service account key (for AI features)
- `LANGFUSE_*` - Langfuse configuration (for AI observability)

#### Backoffice Environment Variables

```bash
cd apps/backoffice
cp .env-example .env
```

Edit `.env`:

```bash
VITE_API_URL=http://localhost:3000

# Auth0
VITE_AUTH0_DOMAIN=bayes-impact.eu.auth0.com
VITE_AUTH0_CLIENT_ID=XXX
VITE_AUTH0_AUDIENCE=https://bayes-impact.eu.auth0.com/api/v2/
```

### 4. Run Database Migrations

Before running the API, you need to apply database migrations:

```bash
cd apps/api
npm run migration:run
```

This will apply all pending migrations to the `caseai_connect` database.

**Migration Commands:**

- `npm run migration:run` - Run all pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run migration:show` - Show migration status
- `npm run migration:generate -- -n MigrationName` - Generate a new migration from entity changes
- `npm run migration:create -- migrations/MigrationName` - Create an empty migration file

### 5. Run the Projects Locally

#### Run All Projects (Development Mode)

From the root:

```bash
npm run dev
```

This will start all apps in watch mode using Turbo.

#### Run Individual Projects

**API:**

```bash
cd apps/api
npm run dev
```

The API will be available at `http://localhost:3000`.

**Backoffice:**

```bash
cd apps/backoffice
npm run dev
```

The backoffice will typically run on a different port (check the console output).

## Running Tests

### Run All Tests

From the root:

```bash
npm run test
```

### Run API Tests

```bash
cd apps/api
npm test
```

### Run Tests in Watch Mode

```bash
cd apps/api
npm run test:watch
```

### Run E2E Tests

From the root:

```bash
npm run test:e2e
```

Or from the API directory:

```bash
cd apps/api
npm run test:e2e
```

### Test Database Setup

The test database (`caseai_connect_test`) is automatically created when you start the Docker Compose service. Before running tests, make sure migrations are applied to the test database:

```bash
cd apps/api
npm run migration:test:run
```

**Test Migration Commands:**

- `npm run migration:test:run` - Run migrations on test database
- `npm run migration:test:revert` - Revert last migration on test database
- `npm run migration:test:show` - Show migration status on test database

**Note:** Tests use a separate database (`caseai_connect_test`) to avoid interfering with development data. The test database configuration is loaded from `apps/api/.env.test` (if it exists) or uses the same connection string with a different database name.

## Creating Migrations

### Generate Migration from Entity Changes

If you've modified TypeORM entities and want TypeORM to generate the migration automatically:

```bash
cd apps/api
npm run migration:generate -- -n MigrationName
```

This will create a new migration file in `apps/api/src/migrations/` based on the differences between your entities and the current database schema.

**Example:**

```bash
npm run migration:generate -- -n AddUserEmailIndex
```

### Create Empty Migration

If you need to write a custom migration manually:

```bash
cd apps/api
npm run migration:create -- migrations/AddCustomFeature
```

This creates an empty migration file that you can fill in with your custom SQL or TypeORM migration code.

**Example Migration Structure:**

```typescript
import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomFeature1234567890000 implements MigrationInterface {
  name = "AddCustomFeature1234567890000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Your migration code here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Your rollback code here
  }
}
```

### Migration Best Practices

1. **Always test migrations** on the test database first:
   ```bash
   npm run migration:test:run
   ```

2. **Check migration status** before applying:
   ```bash
   npm run migration:show
   ```

3. **Write reversible migrations** - always implement the `down()` method to allow rollbacks.

4. **Use transactions** - TypeORM runs migrations in transactions by default, so if a migration fails, it will be rolled back.

5. **Test rollbacks**:
   ```bash
   npm run migration:revert
   ```

## Code Quality

### Linting and Formatting

From the root:

```bash
# Check and auto-fix linting and formatting issues
npm run biome:check

# Check only (CI mode)
npm run biome:ci

# Format only
npm run format
```

### Type Checking

From the root:

```bash
npm run typecheck
```

## Project Structure

```
caseai-connect/
├── apps/
│   ├── api/              # NestJS API
│   ├── backoffice/       # React backoffice
│   └── mcp-server/       # MCP server for Claude Desktop
├── packages/
│   ├── api/              # Shared API types and DTOs
│   ├── jest-config/      # Shared Jest configuration
│   ├── typescript-config/# Shared TypeScript configuration
│   └── ui/               # Shared UI components
├── infra/
│   └── database/         # Docker Compose setup for PostgreSQL
└── package.json          # Root package.json with workspace scripts
```

## Troubleshooting

### Database Connection Issues

1. **Check if Docker is running:**
   ```bash
   docker ps
   ```

2. **Verify database is accessible:**
   ```bash
   psql postgresql://admin:passpass@localhost:5432/caseai_connect
   ```

3. **Check database logs:**
   ```bash
   cd infra/database
   docker compose logs -f
   ```

### Migration Issues

1. **Migration fails to run:**
   - Check that the database is running
   - Verify `DATABASE_URL` in `.env` is correct
   - Check migration files for syntax errors

2. **Migration already applied:**
   - Check migration status: `npm run migration:show`
   - If needed, revert and re-run: `npm run migration:revert && npm run migration:run`

### Port Already in Use

If port 3000 is already in use:

1. Find the process using the port:
   ```bash
   lsof -i :3000
   ```

2. Kill the process or change the port in `apps/api/src/main.ts`

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Auth0 Documentation](https://auth0.com/docs)
