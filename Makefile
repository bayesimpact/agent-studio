.PHONY: docker

version ?= `git rev-parse --short HEAD`

# Change detection configuration
BASE_REF ?= HEAD^1
REGION ?= eu
PROJECT ?= connect
TEST_DATABASE_URL ?= postgresql://connect_admin:passpass@localhost:5432/connect_test
DOCUMENT_EMBEDDING_MODELS ?= gemini-embedding-001
WORKER_DOCLING_HEALTH_CHECK_TIMEOUT_MS ?= 30000
DOCUMENT_EXTRACTOR_DOCLING_TIMEOUT_MS ?= 60000
MAX_VERTEX_EMBEDDING_BATCH_SIZE ?= 250

ifeq ($(REGION),eu)
ifeq ($(PROJECT),connect)
# CONNECT
baseImageUrl = REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO
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
workerPoolRegion = europe-west4
else ifeq ($(PROJECT),health)
# Health
baseImageUrl = REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO
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
workerPoolRegion = europe-west4
else
$(error Unsupported PROJECT '$(PROJECT)' for REGION '$(REGION)')
endif
else
$(error Unsupported REGION '$(REGION)')
endif

apiImageUrl = ${baseImageUrl}/api:${version}
workersImageUrl = ${baseImageUrl}/workers:${version}
workerPoolName ?= ${cloudRunName}-workers
workerPoolRegion ?= ${zone}
workerPoolGpuZonalRedundancyFlag ?= --no-gpu-zonal-redundancy
smokeComposeFile = infra/docker-compose.api-workers-smoke.yaml

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

docker-image-refs:
	@echo "api-image-ref=${apiImageUrl}" >> $(GITHUB_OUTPUT)
	@echo "workers-image-ref=${workersImageUrl}" >> $(GITHUB_OUTPUT)

trivy-scan: docker-build
	trivy image --ignore-unfixed --vuln-type os,library --severity CRITICAL,HIGH --ignorefile .trivyignore.yaml ${apiImageUrl}
	trivy image --ignore-unfixed --vuln-type os,library --severity CRITICAL,HIGH --ignorefile .trivyignore.yaml ${workersImageUrl}

docker-build: docker-build-api docker-build-workers

docker-build-api:
	docker build --platform=linux/amd64 --target api-runtime -t ${apiImageUrl} -f apps/api/Dockerfile .

docker-build-workers:
	docker build --platform=linux/amd64 --target workers-runtime -t ${workersImageUrl} -f apps/api/Dockerfile .

docker-push: docker-push-api docker-push-workers

docker-push-api: docker-check
	docker push ${apiImageUrl}

docker-push-workers: docker-workers-check
	docker push ${workersImageUrl}

docker-check: docker-build-api
	@echo "Starting docker container and checking for successful startup..."
	@CONTAINER_ID=$$(docker run -d -p "3003:3000" ${apiImageUrl}); \
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

docker-workers-check: docker-build-workers
	@echo "Starting docker workers with smoke dependencies and checking for successful startup..."
	@API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} up -d postgres redis workers; \
	CONTAINER_ID=$$(API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} ps -q workers); \
	echo "Container ID: $$CONTAINER_ID"; \
	echo "Verifying Docling CLI in workers container..."; \
	j=1; \
	DOC_VERSION=""; \
	while [ $$j -le 15 ]; do \
		DOC_VERSION=$$(docker exec $$CONTAINER_ID docling --version 2>/dev/null || true); \
		if [ -n "$$DOC_VERSION" ]; then \
			echo "✓ Docling CLI available: $$DOC_VERSION"; \
			break; \
		fi; \
		if ! docker ps -q --no-trunc | grep -q "$$CONTAINER_ID"; then \
			echo "✗ Workers container exited before Docling CLI check completed"; \
			docker logs $$CONTAINER_ID 2>&1; \
			API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} down -v >/dev/null 2>&1; \
			exit 1; \
		fi; \
		sleep 1; \
		j=$$((j + 1)); \
	done; \
	if [ -z "$$DOC_VERSION" ]; then \
		echo "✗ Docling CLI check failed in workers container"; \
		docker logs $$CONTAINER_ID 2>&1; \
		API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} down -v >/dev/null 2>&1; \
		exit 1; \
	fi; \
	i=1; \
	while [ $$i -le 45 ]; do \
		echo "Checking logs (attempt $$i/45)..."; \
		LOGS=$$(docker logs $$CONTAINER_ID 2>&1); \
		echo "$$LOGS"; \
		if echo "$$LOGS" | grep -q "Workers app started"; then \
			echo "✓ Docker workers container started successfully"; \
			API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} down -v >/dev/null 2>&1; \
			exit 0; \
		fi; \
		sleep 1; \
		i=$$((i + 1)); \
	done; \
	echo "✗ Failed to find 'Workers app started' in docker logs"; \
	API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} down -v >/dev/null 2>&1; \
	exit 1

docker-smoke-up: docker-build
	API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} up -d --build

docker-smoke-ps:
	API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} ps

docker-smoke-logs:
	API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} logs --tail=200 api workers postgres redis

docker-smoke-check: docker-smoke-up
	@echo "Waiting for services to settle..."
	@sleep 8
	@API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} ps
	@if API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} ps --status exited | grep -Eq "api|workers"; then \
		echo "✗ API or workers exited unexpectedly. Check logs with: make docker-smoke-logs PROJECT=$(PROJECT) REGION=$(REGION)"; \
		exit 1; \
	fi
	@echo "✓ API and workers are still running"

docker-smoke-down:
	API_IMAGE=${apiImageUrl} WORKERS_IMAGE=${workersImageUrl} docker compose -f ${smokeComposeFile} down -v

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

deploy: docker-push-api deploy-only

deploy-workers: docker-push-workers deploy-workers-only

deploy-only:
	gcloud run deploy ${cloudRunName} --image ${apiImageUrl} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=DATABASE_PASSWORD=${secretsPrefix}DATABASE_PASSWORD:latest \
	--update-secrets=BULLMQ_REDIS_URL=${secretsPrefix}BULLMQ_REDIS_URL:latest \
	--update-secrets=AUTH0_M2M_CLIENT_SECRET=${secretsPrefix}AUTH0_M2M_CLIENT_SECRET:latest \
	--update-secrets=VLLM_MEDGEMMA15_4B_URL=${secretsPrefix}VLLM_MEDGEMMA15_4B_URL:latest \
	--update-secrets=VLLM_MEDGEMMA15_4B_APIKEY=${secretsPrefix}VLLM_MEDGEMMA15_4B_APIKEY:latest \
	--update-secrets=VLLM_MEDGEMMA10_27B_URL=${secretsPrefix}VLLM_MEDGEMMA10_27B_URL:latest \
	--update-secrets=VLLM_MEDGEMMA10_27B_APIKEY=${secretsPrefix}VLLM_MEDGEMMA10_27B_APIKEY:latest \
	--set-env-vars=TZ=UTC \
	--set-env-vars=AUTH0_ISSUER_URL=${auth0IssuerUrl},AUTH0_AUDIENCE=${auth0Audience} \
	--set-env-vars=AUTH0_ORGANIZATION_ID=${auth0OrganizationId},AUTH0_CLIENT_ID=${auth0ClientId},AUTH0_M2M_CLIENT_ID=${auth0M2MClientId} \
	--set-env-vars=FRONTEND_URL=${frontendUrl} \
	--set-env-vars=GCS_STORAGE_BUCKET_NAME=${gcsStorageBucketName} \
	--set-env-vars=GOOGLE_VERTEX_PROJECT=${googleVertexProject} \
	--set-env-vars=GOOGLE_VERTEX_LOCATION=${googleVertexLocation} \
	--set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
	--set-env-vars=DATABASE_HOST=/cloudsql/${addCloudSqlInstances},DATABASE_USERNAME=${databaseUsername},DATABASE_NAME=${databaseName} \
	--set-env-vars=DOCUMENT_EMBEDDING_MODELS=${DOCUMENT_EMBEDDING_MODELS} \
	--region=${zone} \
	--port=3000 \
	--min-instances=1 \
	--max-instances=1 \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=${network} \
	--service-account=${serviceAccount} \
	--project ${gcpProjectId}

deploy-workers-only:
	gcloud beta run worker-pools deploy ${workerPoolName} --image ${workersImageUrl} \
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
	--set-env-vars=DOCUMENT_EMBEDDING_MODELS=${DOCUMENT_EMBEDDING_MODELS} \
	--set-env-vars=DOCUMENT_EXTRACTOR_DOCLING_ENABLED=true \
	--set-env-vars=WORKER_DOCLING_HEALTH_CHECK_TIMEOUT_MS=${WORKER_DOCLING_HEALTH_CHECK_TIMEOUT_MS} \
	--set-env-vars=DOCUMENT_EXTRACTOR_DOCLING_TIMEOUT_MS=${DOCUMENT_EXTRACTOR_DOCLING_TIMEOUT_MS} \
	--set-env-vars=MAX_VERTEX_EMBEDDING_BATCH_SIZE=${MAX_VERTEX_EMBEDDING_BATCH_SIZE} \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=${network} \
	--service-account=${serviceAccount} \
	--gpu 1 \
	--gpu-type nvidia-l4 \
	${workerPoolGpuZonalRedundancyFlag} \
	--region=${workerPoolRegion} \
	--project ${gcpProjectId}

notify:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"$(shell git log -1 --pretty=%B)"}' ${SLACK_WEBHOOK_URL}

notify-skip:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"⏭️ Deployment skipped - no API changes detected"}' ${SLACK_WEBHOOK_URL}

notify-error:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"❌ Error in github action"}' ${SLACK_WEBHOOK_URL}
