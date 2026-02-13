# Deployment Change Detection

## Overview

The CI pipeline now includes smart change detection to avoid unnecessary backend deployments. This saves costs and speeds up CI for changes that don't affect the API runtime.

## How it works

1. **First CI job** (`check-changes`) runs `make check-api-changes`
2. **If no API changes detected**: Sends Slack notification ⏭️ and skips all deployment steps
3. **If API changes detected**: Proceeds with normal deployment flow (tests → build → deploy → notify)

## Monitored Paths

Changes to these paths **trigger deployment**:
- `apps/api/src/` - API source code
- `apps/api/package.json` - Dependencies
- `apps/api/Dockerfile` - Container config
- `apps/api/nest-cli.json`, `tsconfig.json` - Build config
- `packages/api-contracts/` - Shared API types
- Root `package.json`, `package-lock.json`, `turbo.json`

## Excluded Patterns

Changes to these **do NOT trigger deployment**:
- `*.md` - Documentation
- `*.spec.ts` - Unit tests
- `*.e2e-spec.ts` - E2E tests
- `apps/api/test/` - Test utilities

## Makefile Commands

### Check for changes
```bash
# Check against previous commit (default)
make check-api-changes

# Check against specific ref
make check-api-changes BASE_REF=origin/main
make check-api-changes BASE_REF=HEAD~3
```

**Exit codes:**
- `0` = Changes detected (deployment needed)
- `1` = No changes (skip deployment)

### Notifications
```bash
make notify        # Normal deployment success notification
make notify-skip   # Deployment skipped notification
make notify-error  # Deployment error notification
```

## Examples

### Example 1: Documentation change (skipped)
```bash
$ git commit -m "docs: update README"
$ make check-api-changes
Checking for API changes between HEAD^1 and HEAD...
✗ No API changes detected (skipping deployment)
# Deployment skipped ✅ Saves ~5 min and deployment costs
```

### Example 2: Source code change (deployed)
```bash
$ git commit -m "feat: add new endpoint"
$ make check-api-changes
Checking for API changes between HEAD^1 and HEAD...
✓ API changes detected:
  - apps/api/src/domains/chat/chat.controller.ts
# Deployment proceeds ✅
```

### Example 3: Test-only changes (skipped)
```bash
$ git commit -m "test: add e2e tests"
$ make check-api-changes
Checking for API changes between HEAD^1 and HEAD...
✗ No API changes detected (skipping deployment)
# Deployment skipped ✅
```

## Configuration

### Add new paths to monitor
Edit `Makefile`:
```makefile
API_PATHS := \
	apps/api/src \
	your/new/path \
	...
```

### Modify exclusions
Edit `API_EXCLUDE_PATTERNS` in `Makefile` (extended regex format, pipe-separated):
```makefile
API_EXCLUDE_PATTERNS := \.md$$|\.spec\.ts$$|\.your-pattern$$|...
```

## Testing Locally

Before pushing, test if your changes would trigger deployment:
```bash
make check-api-changes
```

If exit code is 0, deployment will happen. If 1, deployment will be skipped.