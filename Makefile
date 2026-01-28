.PHONY: docker

version ?= `git rev-parse --short HEAD`
imageUrl ?= REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/api


REGION ?= eu

ifeq "$(REGION)" "eu"
cloudRunName = connect
location = europe-west1
zone = europe-west9
langfuseUrl = https://your-langfuse-instance.example.com
langfusePk = pk-lf-YOUR_LANGFUSE_PK
secretsPrefix = CONNECT_
postHogHost=https://eu.i.posthog.com
addCloudSqlInstances=YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE
cloudSqlProxyPort = 5433
endif


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
	cd apps/api && npm run migration:test:run && npm run test

migrations:
	docker compose -f infra/cloudsql-proxy/docker-compose.yaml up -d
	docker compose -f infra/cloudsql-proxy/docker-compose.yaml logs cloudsql-proxy
	cd apps/api && npm ci && DATABASE_HOST=localhost DATABASE_PORT=${cloudSqlProxyPort} DATABASE_USERNAME=connect_admin DATABASE_NAME=connect DATABASE_PASSWORD=${MIG_DATABASE_PASSWORD} npm run migration:run

deploy: docker-push
	gcloud run deploy ${cloudRunName} --image ${imageUrl}:${version} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=DATABASE_PASSWORD=${secretsPrefix}DATABASE_PASSWORD:latest \
	--set-env-vars=TZ=UTC \
	--set-env-vars=AUTH0_ISSUER_URL=https://your-tenant.auth0.com/,AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/ \
    --set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
    --set-env-vars=DATABASE_HOST=/cloudsql/${addCloudSqlInstances},DATABASE_USERNAME=connect_admin,DATABASE_NAME=connect \
	--region=${zone} \
	--port=3000 \
	--min-instances=1 \
	--max-instances=1 \
	--add-cloudsql-instances=${addCloudSqlInstances} \
	--network=projects/YOUR_PROJECT/global/networks/default \
	--service-account=YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com \
	--project caseai-connect

notify:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"$(shell git log -1 --pretty=%B)"}' SLACK_WEBHOOK_REDACTED

notify-error:
	curl -X POST -H 'Content-type: application/json' --data '{"text":"❌ Error in github action"}' SLACK_WEBHOOK_REDACTED
