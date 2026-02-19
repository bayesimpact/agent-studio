.PHONY: docker

version ?= `git rev-parse --short HEAD`
imageUrl ?= europe-west9-docker.pkg.dev/caseai-connect/caseai-connect/api

# Change detection configuration
BASE_REF ?= HEAD^1
REGION ?= eu
TEST_DATABASE_URL ?= postgresql://connect_admin:passpass@localhost:5432/connect_test

ifeq "$(REGION)" "eu"
cloudRunName = connect
location = europe-west1
zone = europe-west9
langfuseUrl = https://langfuse-y72kzcp7ka-od.a.run.app
langfusePk = pk-lf-48fd15e2-85a2-4c78-9e95-0730d9b22553
secretsPrefix = CONNECT_
postHogHost = https://eu.i.posthog.com
addCloudSqlInstances=caseai-connect:europe-west9:connect-eu
cloudSqlProxyPort = 5433
auth0OrganizationId = org_ue5MX9VnvRlaM3gT
auth0Audience = https://bayes-impact.eu.auth0.com/api/v2/
auth0IssuerUrl = https://bayes-impact.eu.auth0.com/
auth0M2MClientId = ct0uygE3ld8IOKjaGozWbRLMae0R0Pcr
auth0ClientId = Ntkc5sZnx8OQNP4UJDCqId4eo0WqGTJD
localStorageServerBaseUrl = https://connect.localhost:3000
gcsStorageBucketName = eu-connect-file-storage
endif

# ==============================================================================
# Change Detection
# ==============================================================================

# Paths that affect API deployment
API_PATHS := \
	apps/api/src \
	apps/api/package.json \
	apps/api/nest-cli.json \
	apps/api/tsconfig.json \
	apps/api/Dockerfile \
	packages/api-contracts \
	package.json \
	package-lock.json \
	turbo.json

# Patterns that should NOT trigger deployment (extended regex format)
API_EXCLUDE_PATTERNS := \.md$$|\.spec\.ts$$|\.e2e-spec\.ts$$|apps/api/test/|apps/api/README\.md

# Check if API has meaningful changes
check-api-changes:
	@echo "Checking for API changes between $(BASE_REF) and HEAD..."
	@CHANGED=$$(git diff --name-only $(BASE_REF) HEAD -- $(API_PATHS) | \
		grep -v -E '$(API_EXCLUDE_PATTERNS)' || true); \
	if [ -n "$$CHANGED" ]; then \
		echo "✓ API changes detected:"; \
		echo "$$CHANGED" | sed 's/^/  - /'; \
		exit 0; \
	else \
		echo "✗ No API changes detected (skipping deployment)"; \
		exit 1; \
	fi

# Check if frontend has meaningful changes (for future use)
check-web-changes:
	@echo "Checking for web changes between $(BASE_REF) and HEAD..."
	@CHANGED=$$(git diff --name-only $(BASE_REF) HEAD -- apps/web packages/ui | \
		grep -v -E '\.md$$|\.spec\.ts$$|\.test\.ts$$' || true); \
	if [ -n "$$CHANGED" ]; then \
		echo "✓ Web changes detected:"; \
		echo "$$CHANGED" | sed 's/^/  - /'; \
		exit 0; \
	else \
		echo "✗ No web changes detected"; \
		exit 1; \
	fi

# ==============================================================================
# Docker & Deployment
# ==============================================================================

docker-build:
	docker build --platform=linux/amd64 --target prod -t ${imageUrl}:${version} -f apps/api/Dockerfile .

docker-push: docker-check
	docker push ${imageUrl}:${version}

docker-check: docker-build
	@echo "Starting docker container and checking for successful startup..."
	@CONTAINER_ID=$$(docker run -d -p "3003:3000" ${imageUrl}:${version}); \
	echo "Container ID: $$CONTAINER_ID"; \
	i=1; \
	while [ $$i -le 30 ]; do \
		echo "Checking logs (attempt $$i/30)..."; \
		LOGS=$$(docker logs $$CONTAINER_ID 2>&1); \
		echo "$$LOGS"; \
		if echo "$$LOGS" | grep -q "Starting Nest application..."; then \
			echo "✓ Docker container started successfully"; \
			docker kill $$CONTAINER_ID >/dev/null 2>&1; \
			exit 0; \
		fi; \
		sleep 1; \
		i=$$((i + 1)); \
	done; \
	echo "✗ Failed to find 'Starting Nest application...' in docker logs"; \
	docker kill $$CONTAINER_ID >/dev/null 2>&1; \
	exit 1


ci-checks:
	npm ci && npm run biome:ci && npm run typecheck

db-tests:
	docker compose -f infra/database/docker-compose.yaml up -d

tests: db-tests ci-checks
	cd apps/api && DATABASE_URL=${TEST_DATABASE_URL} npm run migration:test:run && DATABASE_URL=${TEST_DATABASE_URL} npm run test

migrations:
	docker compose -f infra/cloudsql-proxy/docker-compose.yaml up -d
	docker compose -f infra/cloudsql-proxy/docker-compose.yaml logs cloudsql-proxy
	cd apps/api && npm ci && DATABASE_HOST=localhost DATABASE_PORT=${cloudSqlProxyPort} DATABASE_USERNAME=connect_admin DATABASE_NAME=connect DATABASE_PASSWORD=${MIG_DATABASE_PASSWORD} npm run migration:run

deploy: docker-push deploy-only

deploy-only:
	gcloud run deploy ${cloudRunName} --image ${imageUrl}:${version} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=DATABASE_PASSWORD=${secretsPrefix}DATABASE_PASSWORD:latest \
	--update-secrets=AUTH0_M2M_CLIENT_SECRET=${secretsPrefix}AUTH0_M2M_CLIENT_SECRET:latest \
	--set-env-vars=TZ=UTC \
	--set-env-vars=AUTH0_ISSUER_URL=${auth0IssuerUrl},AUTH0_AUDIENCE=${auth0Audience} \
	--set-env-vars=AUTH0_ORGANIZATION_ID=${auth0OrganizationId},AUTH0_CLIENT_ID=${auth0ClientId},AUTH0_M2M_CLIENT_ID=${auth0M2MClientId} \
	--set-env-vars=LOCAL_STORAGE_SERVER_BASE_URL=${localStorageServerBaseUrl} \
	--set-env-vars=GCS_STORAGE_BUCKET_NAME=${gcsStorageBucketName} \
  --set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
  --set-env-vars=DATABASE_HOST=/cloudsql/${addCloudSqlInstances},DATABASE_USERNAME=connect_admin,DATABASE_NAME=connect \
	--region=${zone} \
	--port=3000 \
	--min-instances=1 \
	--max-instances=1 \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=projects/caseai-connect/global/networks/default \
	--service-account=connect-api@caseai-connect.iam.gserviceaccount.com \
	--project caseai-connect

notify:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"$(shell git log -1 --pretty=%B)"}' https://hooks.slack.com/services/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

notify-skip:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"⏭️ Deployment skipped - no API changes detected"}' https://hooks.slack.com/services/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

notify-error:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"❌ Error in github action"}' https://hooks.slack.com/services/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
