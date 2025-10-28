.PHONY: docker

version ?= `git rev-parse --short HEAD`
imageUrl ?= REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/api


REGION ?= eu

ifeq "$(REGION)" "eu"
cloudRunName = caseai-connect
location = europe-west1
zone = europe-west9
langfuseUrl = https://your-langfuse-instance.example.com
langfusePk = pk-lf-YOUR_LANGFUSE_PK
secretsPrefix = CASEAI_CONNECT_
postHogHost=https://eu.i.posthog.com
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

migrations:
	docker compose up -d cloudsql-proxy
	docker compose logs cloudsql-proxy
	cd backends/api && npm ci && DATABASE_HOST=localhost DATABASE_PORT=${cloudSqlProxyPort} DATABASE_USERNAME=caseai_admin DATABASE_NAME=caseai DATABASE_PASSWORD=${MIG_DATABASE_PASSWORD} npm run migration:run

deploy: docker-push
	gcloud config set project caseai-connect
	gcloud run deploy ${cloudRunName} --image ${imageUrl}:${version} \
	--update-secrets=LANGFUSE_SK=${secretsPrefix}LANGFUSE_SK:latest \
	--update-secrets=FRANCE_TRAVAIL_CLIENT_ID=${secretsPrefix}FRANCE_TRAVAIL_CLIENT_ID:latest \
	--update-secrets=FRANCE_TRAVAIL_SECRET_KEY=${secretsPrefix}FRANCE_TRAVAIL_SECRET_KEY:latest \
	--update-secrets=DATA_INCLUSION_TOKEN=${secretsPrefix}DATA_INCLUSION_TOKEN:latest \
	--update-secrets=NOTION_SECRET=${secretsPrefix}NOTION_SECRET:latest \
	--set-env-vars=TZ=UTC \
    --set-env-vars=LANGFUSE_PK=${langfusePk},LANGFUSE_BASE_URL=${langfuseUrl},LOCATION=$(location) \
	--region=${zone} \
	--port=3000 \
	--min-instances=1 \
	--max-instances=1 \
	--service-account=YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com


