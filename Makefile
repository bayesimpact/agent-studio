.PHONY: docker

version ?= `git rev-parse --short HEAD`

# Change detection configuration
BASE_REF ?= HEAD^1
REGION ?= eu
PROJECT ?= connect
TEST_DATABASE_URL ?= postgresql://connect_admin:passpass@localhost:5432/connect_test

ifeq ($(REGION),eu)
ifeq ($(PROJECT),connect)
# CONNECT
imageUrl = REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/api
cloudRunName = connect
googleVertexProject = YOUR_GCP_PROJECT
googleVertexLocation = europe-west1
location = europe-west1
zone = europe-west9
langfuseUrl = https://your-langfuse-instance.example.com
langfusePk = pk-lf-YOUR_LANGFUSE_PK
secretsPrefix = CONNECT_
postHogHost = https://eu.i.posthog.com
addCloudSqlInstances=YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE
cloudSqlProxyPort = 5433
auth0OrganizationId = org_YOUR_ORG_ID
auth0Audience = https://your-tenant.auth0.com/api/v2/
auth0IssuerUrl = https://your-tenant.auth0.com/
auth0M2MClientId = YOUR_AUTH0_M2M_CLIENT_ID
auth0ClientId = YOUR_AUTH0_CLIENT_ID
frontendUrl = your-domain.example.com
gcsStorageBucketName = your-bucket-name
gcpProjectId = YOUR_GCP_PROJECT
serviceAccount = YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com
network = projects/YOUR_PROJECT/global/networks/default
databaseUsername = connect_admin
databaseName = connect
cloudSqlCredentialsFile = $(CURDIR)/dontsave/your-credentials.json
else ifeq ($(PROJECT),health)
# Health
imageUrl = REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/api
cloudRunName = health
googleVertexProject = YOUR_GCP_PROJECT
googleVertexLocation = europe-west1
location = europe-west1
zone = europe-west9
langfuseUrl = https://your-langfuse-instance.example.com
langfusePk = pk-lf-YOUR_LANGFUSE_PK
secretsPrefix = HEALTH_
postHogHost = https://eu.i.posthog.com
addCloudSqlInstances = YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE
cloudSqlProxyPort = 5433
auth0OrganizationId = org_YOUR_ORG_ID
auth0Audience = https://your-tenant.auth0.com/api/v2/
auth0IssuerUrl = https://your-tenant.auth0.com/
auth0M2MClientId = YOUR_AUTH0_M2M_CLIENT_ID
auth0ClientId = YOUR_AUTH0_CLIENT_ID
frontendUrl = your-domain.example.com
gcsStorageBucketName = your-bucket-name
gcpProjectId = YOUR_GCP_PROJECT
serviceAccount = YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com
network = projects/YOUR_PROJECT/global/networks/default
databaseUsername = health_admin
databaseName = health
cloudSqlCredentialsFile = $(CURDIR)/dontsave/your-credentials.json
documentEmbeddingModels=gemini-embedding-001
else
$(error Unsupported PROJECT '$(PROJECT)' for REGION '$(REGION)')
endif
else
$(error Unsupported REGION '$(REGION)')
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

docker-workers-check: docker-build
	@echo "Starting docker workers container and checking for successful startup..."
	@CONTAINER_ID=$$(docker run -d ${imageUrl}:${version} node /app/apps/api/dist/workers-main.js); \
	echo "Container ID: $$CONTAINER_ID"; \
	i=1; \
	while [ $$i -le 30 ]; do \
		echo "Checking logs (attempt $$i/30)..."; \
		LOGS=$$(docker logs $$CONTAINER_ID 2>&1); \
		echo "$$LOGS"; \
		if echo "$$LOGS" | grep -q "Workers app started"; then \
			echo "✓ Docker workers container started successfully"; \
			docker kill $$CONTAINER_ID >/dev/null 2>&1; \
			exit 0; \
		fi; \
		sleep 1; \
		i=$$((i + 1)); \
	done; \
	echo "✗ Failed to find 'Workers app started' in docker logs"; \
	docker kill $$CONTAINER_ID >/dev/null 2>&1; \
	exit 1


ci-checks:
	npm ci && npm run biome:ci && npm run typecheck

db-tests:
	docker compose -f infra/database/docker-compose.yaml up -d

tests: db-tests ci-checks
	cd apps/api && DATABASE_URL=${TEST_DATABASE_URL} npm run migration:test:run && DATABASE_URL=${TEST_DATABASE_URL} npm run test

migrations:
	CLOUDSQL_INSTANCE=${addCloudSqlInstances} CLOUDSQL_PROXY_PORT=${cloudSqlProxyPort} CLOUDSQL_CREDENTIALS_FILE=$${CLOUDSQL_CREDENTIALS_FILE:-${cloudSqlCredentialsFile}} docker compose -f infra/cloudsql-proxy/docker-compose.yaml up -d
	CLOUDSQL_INSTANCE=${addCloudSqlInstances} CLOUDSQL_PROXY_PORT=${cloudSqlProxyPort} CLOUDSQL_CREDENTIALS_FILE=$${CLOUDSQL_CREDENTIALS_FILE:-${cloudSqlCredentialsFile}} docker compose -f infra/cloudsql-proxy/docker-compose.yaml logs cloudsql-proxy
	cd apps/api && npm ci && DATABASE_HOST=localhost DATABASE_PORT=${cloudSqlProxyPort} DATABASE_USERNAME=${databaseUsername} DATABASE_NAME=${databaseName} DATABASE_PASSWORD="$${MIG_DATABASE_PASSWORD}" npm run migration:run

deploy: docker-push deploy-only

deploy-workers: docker-push deploy-workers-only

deploy-only:
	gcloud run deploy ${cloudRunName} --image ${imageUrl}:${version} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=DATABASE_PASSWORD=${secretsPrefix}DATABASE_PASSWORD:latest \
	--update-secrets=BULLMQ_REDIS_URL=${secretsPrefix}BULLMQ_REDIS_URL:latest \
	--update-secrets=AUTH0_M2M_CLIENT_SECRET=${secretsPrefix}AUTH0_M2M_CLIENT_SECRET:latest \
	--set-env-vars=TZ=UTC \
	--set-env-vars=AUTH0_ISSUER_URL=${auth0IssuerUrl},AUTH0_AUDIENCE=${auth0Audience} \
	--set-env-vars=AUTH0_ORGANIZATION_ID=${auth0OrganizationId},AUTH0_CLIENT_ID=${auth0ClientId},AUTH0_M2M_CLIENT_ID=${auth0M2MClientId} \
	--set-env-vars=FRONTEND_URL=${frontendUrl} \
	--set-env-vars=GCS_STORAGE_BUCKET_NAME=${gcsStorageBucketName} \
	--set-env-vars=GOOGLE_VERTEX_PROJECT=${googleVertexProject} \
	--set-env-vars=GOOGLE_VERTEX_LOCATION=${googleVertexLocation} \
	--set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
	--set-env-vars=DATABASE_HOST=/cloudsql/${addCloudSqlInstances},DATABASE_USERNAME=${databaseUsername},DATABASE_NAME=${databaseName} \
	--set-env-vars=DOCUMENT_EMBEDDING_MODELS=${documentEmbeddingModels} \
	--region=${zone} \
	--port=3000 \
	--min-instances=1 \
	--max-instances=1 \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=${network} \
	--service-account=${serviceAccount} \
	--project ${gcpProjectId}

deploy-workers-only:
	gcloud beta run worker-pools deploy ${cloudRunName}-workers --image ${imageUrl}:${version} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=DATABASE_PASSWORD=${secretsPrefix}DATABASE_PASSWORD:latest \
	--update-secrets=BULLMQ_REDIS_URL=${secretsPrefix}BULLMQ_REDIS_URL:latest \
	--update-secrets=AUTH0_M2M_CLIENT_SECRET=${secretsPrefix}AUTH0_M2M_CLIENT_SECRET:latest \
	--set-env-vars=TZ=UTC \
	--set-env-vars=AUTH0_ISSUER_URL=${auth0IssuerUrl},AUTH0_AUDIENCE=${auth0Audience} \
	--set-env-vars=AUTH0_ORGANIZATION_ID=${auth0OrganizationId},AUTH0_CLIENT_ID=${auth0ClientId},AUTH0_M2M_CLIENT_ID=${auth0M2MClientId} \
	--set-env-vars=FRONTEND_URL=${frontendUrl} \
	--set-env-vars=LOCAL_STORAGE_SERVER_BASE_URL=${localStorageServerBaseUrl} \
	--set-env-vars=GCS_STORAGE_BUCKET_NAME=${gcsStorageBucketName} \
	--set-env-vars=GOOGLE_VERTEX_PROJECT=${googleVertexProject},GOOGLE_VERTEX_LOCATION=${googleVertexLocation} \
	--set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
	--set-env-vars=DATABASE_HOST=/cloudsql/${addCloudSqlInstances},DATABASE_USERNAME=${databaseUsername},DATABASE_NAME=${databaseName} \
	--set-env-vars=DOCUMENT_EMBEDDING_MODELS=${documentEmbeddingModels} \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=${network} \
	--service-account=${serviceAccount} \
	--region=${zone} \
	--project ${gcpProjectId} \
	--command=node,/app/apps/api/dist/workers-main.js

notify:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"$(shell git log -1 --pretty=%B)"}' SLACK_WEBHOOK_REDACTED

notify-skip:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"⏭️ Deployment skipped - no API changes detected"}' SLACK_WEBHOOK_REDACTED

notify-error:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"❌ Error in github action"}' SLACK_WEBHOOK_REDACTED
