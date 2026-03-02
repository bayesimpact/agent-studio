# GKE Deployment Runbook (Impulse Example)

This guide rewrites the original notes into a step-by-step deployment runbook.

- Example app name: `health`
- Example Google Cloud project: `health-488513`
- Keep the order of steps
- Prefer CLI (`gcloud`) over UI where possible

---

## 1) Google Cloud: local prerequisites (required first)

You must have `gcloud` installed and configured before doing anything else.

```bash
# Install Google Cloud CLI (macOS)
brew install --cask google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth login your-email@example.com
gcloud config set account your-email@example.com

# Verify active account/project
gcloud auth list
gcloud config list
```

Also configure Docker auth for Artifact Registry:

```bash
gcloud auth configure-docker REGION-docker.pkg.dev
```

---

## 2) Google Cloud: create project

If you need to create it:

```bash
gcloud projects create health-488513 --name="Health"
gcloud config set project health-488513
```

---

## 3) Google Cloud SQL (PostgreSQL)

Create the PostgreSQL instance, DB user, and DB.

Target instance configuration (must match):

- Region: `europe-west9` (Paris)
- DB version: `PostgreSQL 18.2`
- Machine type: `db-perf-optimized-N-8` (`8 vCPU`, `64 GB RAM`)
- Data cache: enabled (`375 GB`)
- Storage: `100 GB SSD`
- Connections: Public IP
- Backup: Manual
- Availability: Single zone
- Point-in-time recovery: Disabled

```bash
# Create instance
gcloud sql instances create health-eu \
  --database-version=POSTGRES_18 \
  --region=europe-west9 \
  --tier=db-perf-optimized-N-8 \
  --storage-type=SSD \
  --storage-size=100 \
  --availability-type=ZONAL \
  --assign-ip

# Then verify/adjust in Console so it matches exactly:
# - Data cache: enabled (375 GB)
# - Backup: Manual
# - Point-in-time recovery: disabled

# Set postgres password (store in 1Password)
gcloud sql users set-password postgres \
  --instance=health-eu \
  --password='<postgres-password>'

# Create app user (store password in 1Password)
gcloud sql users create health_admin \
  --instance=health-eu \
  --password='<health-admin-password>'

# Create app database
gcloud sql databases create health --instance=health-eu

# Make health_admin owner of the healt database
gcloud components install cloud-sql-proxy
gcloud auth application-default login

gcloud sql connect health-eu --user=postgres --database=health
```

Copy/paste:

```sql
GRANT health_admin TO postgres;

-- 1) Make health_admin owner-level for this DB (common/simple)
ALTER DATABASE health OWNER TO health_admin;

-- 2) Ensure schema privileges (usually needed)
GRANT USAGE, CREATE ON SCHEMA public TO health_admin;

-- 3) Existing tables/sequences/functions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO health_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO health_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO health_admin;

-- 4) Future objects created in this schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO health_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO health_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON FUNCTIONS TO health_admin;
```

---

## 4) Google Cloud: service accounts and IAM

Create 2 service accounts:

- Runtime API service account: `health-api`
- CI/migrations service account: `health-github`

```bash
gcloud iam service-accounts create health-api \
  --display-name="Health API runtime"

gcloud iam service-accounts create health-github \
  --display-name="Health GitHub CI and migrations"
```

Grant roles to runtime API account:

```bash
for role in \
  roles/run.serviceAgent \
  roles/cloudsql.client \
  roles/compute.networkUser \
  roles/compute.networkViewer \
  roles/compute.publicIpAdmin \
  roles/secretmanager.secretAccessor \
  roles/aiplatform.serviceAgent
do
  gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT \
    --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
    --role="$role"
done
```

Grant roles to GitHub account:

```bash
for role in \
  roles/artifactregistry.admin \
  roles/run.admin \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountUser
do
  gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT \
    --member="serviceAccount:YOUR_CI_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
    --role="$role"
done
```

If needed for local migrations/CI, create a key file for this account and store it safely (never commit it).


```bash
gcloud iam service-accounts keys create "dontsave/your-credentials.json" \
  --iam-account="YOUR_CI_SA@YOUR_PROJECT.iam.gserviceaccount.com"
```

---

## 5) Auth0 setup (UI)

Some Auth0 steps are easier in UI:

1. Create organization `Health`
2. Enable `google-oauth2` connection with auto-membership
3. Create Machine-to-Machine app:
   - Name: `[PROD] Health M2M`
   - API permissions:
     - `create:organization_invitations`
     - `read:organization_invitations`
     - `delete:organization_invitations`
4. Create Single Page Application:
   - Name: `[PROD] Health`
   - Login Experience: `Business Users`

Useful links:
- `https://manage.auth0.com/dashboard/eu/bayes-impact/organizations`
- `https://manage.auth0.com/dashboard/eu/bayes-impact/applications`

---

## 6) Langfuse setup

Create project in Langfuse and keep the secret key (`sk-...`) for Secret Manager.

---

## 7) Google Secret Manager

Create required secrets in Google Cloud:

```bash
printf '%s' '<health-admin-db-password>' | gcloud secrets create HEALTH_DATABASE_PASSWORD \
  --replication-policy=automatic \
  --data-file=-

printf '%s' '<langfuse-secret-key>' | gcloud secrets create HEALTH_LANGFUSE_SK \
  --replication-policy=automatic \
  --data-file=-

printf '%s' '<auth0-m2m-client-secret>' | gcloud secrets create HEALTH_AUTH0_M2M_CLIENT_SECRET \
  --replication-policy=automatic \
  --data-file=-
```

If a secret already exists, add a new version:

```bash
printf '%s' '<new-value>' | gcloud secrets versions add IMPULSE_DATABASE_PASSWORD --data-file=-
```

---

## 8) Google Cloud Storage buckets

Create 2 buckets:

- Private uploads bucket: `your-bucket-name`
- Public assets bucket: `your-public-bucket-name`

```bash
gcloud storage buckets create gs://your-bucket-name \
  --location=EU \
  --uniform-bucket-level-access

gcloud storage buckets create gs://your-public-bucket-name \
  --location=EU \
  --uniform-bucket-level-access
```

Allow public read on the public bucket:

```bash
gcloud storage buckets add-iam-policy-binding gs://your-public-bucket-name \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

---

## 9) Artifact Registry (Docker repository)

Create Docker repo in `europe-west9`:

```bash
gcloud artifacts repositories create health \
  --repository-format=docker \
  --location=europe-west9 \
  --description="Health API images"
```

Note from original setup: vulnerability scanning was disabled in UI.

---

## 10) Makefile environment values

Update your `Makefile` variables:

```bash
imageUrl = REGION-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/api
cloudRunName = health
googleVertexProject = health-488513
googleVertexLocation = europe-west1
location = europe-west1
zone = europe-west9
langfuseUrl = https://your-langfuse-instance.example.com
langfusePk = pk-lf-YOUR_LANGFUSE_PK
secretsPrefix = IMPULSE_
postHogHost = https://eu.i.posthog.com
addCloudSqlInstances = health-488513:europe-west9:health-eu
cloudSqlProxyPort = 5433
auth0OrganizationId = org_YOUR_ORG_ID
auth0Audience = https://your-tenant.auth0.com/api/v2/
auth0IssuerUrl = https://your-tenant.auth0.com/
auth0M2MClientId = YOUR_AUTH0_M2M_CLIENT_ID
auth0ClientId = YOUR_AUTH0_CLIENT_ID
localStorageServerBaseUrl = https://connect.localhost:3000
gcsStorageBucketName = your-bucket-name
gcpProjectId = health-488513
serviceAccount = health-api@health-488513.iam.gserviceaccount.com
network = projects/health-488513/global/networks/default
databaseUsername = health_admin
databaseName = health
cloudSqlCredentialsFile = $(CURDIR)/dontsave/your-credentials.json
```

---

## 11) Network permission workaround (Cloud Run + subnet)

If deployment fails on VPC/subnet permissions, grant `compute.networkUser` on subnet:

```bash
# Runtime service account
gcloud compute networks subnets add-iam-policy-binding default \
  --region=europe-west9 \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/compute.networkUser" \
  --project=YOUR_GCP_PROJECT
```

Also grant it to the Cloud Run service agent:

```bash
PROJECT_NUMBER="$(gcloud projects describe YOUR_GCP_PROJECT --format='value(projectNumber)')"

gcloud compute networks subnets add-iam-policy-binding default \
  --region=europe-west9 \
  --member="serviceAccount:service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com" \
  --role="roles/compute.networkUser" \
  --project=YOUR_GCP_PROJECT
```

---

## 12) First backend deployment (GCP)

```bash
make deploy PROJECT=health REGION=eu
```

---

## 13) First database migrations

Requirements:

- `health_admin` DB password available (from password manager)
- Credentials file for GitHub/migration service account stored locally (example: `dontsave/`)

Run:

```bash
export MIG_DATABASE_PASSWORD='your_password'
make migrations PROJECT=health REGION=eu
```

---

## 14) Vercel setup (Web)

Install and authenticate Vercel CLI:

```bash
npm i -g vercel
vercel login
```

Create a new Vercel project from the CLI:

```
vercel
```

- Root directory: `apps/web`
- Output directory: `dist`

Set environment variables:

- UI personalization:
  - `VITE_LOGO_URL`
  - `VITE_THEME_KEY`
  - `VITE_APP_TITLE`
- API URL (Cloud Run URL, e.g. `https://<service-id>.europe-west9.run.app`):
  - `VITE_API_URL`
- Auth0:
  - `VITE_AUTH0_DOMAIN`
  - `VITE_AUTH0_CLIENT_ID`
  - `VITE_AUTH0_AUDIENCE`
  - `VITE_AUTH0_ORGANIZATION_ID`

**Notes:** 
- you'll need to update the Makefile to set the `frontendUrl` variable with the one Vercel communicated to you.
- don't forget to also use the frontend url in the "Application LoginURI", "Allowed Callback URLs" and "Allowed Logout URLs" of your Auth0 application.

---

## 15) Deploy web to Vercel

Deploy from repository root:

```bash
vercel --prod
```