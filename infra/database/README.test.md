# Test Database Setup

The test database (`caseai_connect_test`) is created automatically on the same PostgreSQL server as the main database when you start the Docker Compose service.

## Starting the Database Server

To start the database server (which includes both main and test databases), run:

```bash
cd infra/database
docker compose up -d
```

The databases will be available at:
- Host: `localhost`
- Port: `5432`
- Main Database: `caseai_connect`
- Test Database: `caseai_connect_test`
- User: `admin`
- Password: `passpass`

## Test Database

The test database (`caseai_connect_test`) is automatically created when the container starts via the initialization script in `sql/common.sql`.

## Environment Configuration

The test database configuration is stored in `apps/api/.env.test` and is automatically loaded by Jest when running tests. It points to the same server but a different database.

## Running Migrations for Test Database

To run migrations on the test database:

```bash
cd apps/api
npm run migration:test:run
```

Other test migration commands:
- `npm run migration:test:show` - Show migration status
- `npm run migration:test:revert` - Revert last migration

## Running Tests

Tests will automatically use the test database when you run:

```bash
cd apps/api
npm test
```

Make sure the database server is running and migrations are up to date before executing tests.

## Benefits of This Approach

- **Simpler**: One container to manage instead of two
- **Resource efficient**: Less memory and CPU usage
- **Still isolated**: Tests use a completely separate database
- **Easy cleanup**: Can drop/recreate test database without affecting main DB
