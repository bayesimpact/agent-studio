# ADR 0004: Split-Repo Open Source SaaS Architecture

* **Status**: Proposed
* **Date**: 2026-03-20
* **Deciders**: Jérémie

---

## 1. Context and Problem Statement

We want to open source the application core while keeping deployment configuration, secrets, and infrastructure logic private. This requires a clean separation between the public application code and the private operational layer, with a reliable CI/CD bridge between the two.

## 2. Decision

We will adopt a **Split-Repo Architecture** with two repositories and GCP Artifact Registry as the bridge.

### Public App Repo

Contains application source code and Dockerfile.

* **CI Task**: Builds Docker image and pushes to GCP Artifact Registry.
* **Trigger**: Uses `gh api` (GitHub CLI) to send a `repository_dispatch` event to the Private Infra Repo once the image is pushed.

### Private Infra Repo

Contains environment-specific files (e.g., `.env`, `docker-compose.yaml`, or K8s manifests).

* **CD Task**: Listens for `repository_dispatch` events and executes the deployment to GCP.

### GCP Artifact Registry

Acts as the bridge, hosting versioned Docker images.

### Technical Specifics

* **Authentication**: Use a Fine-grained Personal Access Token (PAT) with `Contents: Write` permissions scoped specifically to the Private Infra Repo.
* **Image Tagging**: Pass `github.sha` from the Public Repo to the Private Repo via `client_payload` to ensure the exact build is deployed.
* **Native Tooling**: Use the pre-installed `gh` CLI in GitHub Actions for cross-repo communication. Avoid third-party actions.

## 3. Alternatives Considered

* **Single private monorepo**: Rejected because it prevents open sourcing the application core.
* **Single public repo with encrypted secrets**: Rejected because it leaks infrastructure topology and complicates secret management. Environment-specific configs don't belong in an open source repo.
* **Third-party CI/CD actions for cross-repo triggers**: Rejected in favor of the native `gh` CLI to minimize supply chain risk and external dependencies.

## 4. Consequences

* **Positive Impacts**:
    * **Open source friendly**: The public repo contains only application code with no secrets or infrastructure details.
    * **Clear separation of concerns**: App development and infrastructure/deployment are independently versioned and managed.
    * **Traceability**: Using `github.sha` as the image tag creates a direct link between a commit and its deployed artifact.
    * **Minimal dependencies**: Native `gh` CLI avoids third-party action supply chain risks.
* **Negative Impacts / Risks**:
    * **Operational complexity**: Two repos to maintain, with a cross-repo dispatch mechanism that must stay in sync.
    * **PAT management**: The fine-grained PAT must be rotated and stored securely as a GitHub Actions secret.
    * **Debugging difficulty**: Deployment failures may require tracing across two repos and Artifact Registry.

### Cross-Project Image Pulling (Multi-Tenant)

Each SaaS instance runs in its own GCP project, but all images are stored in a central Artifact Registry project. Cloud Run uses a Google-managed **Cloud Run Service Agent** (not the default Compute Engine service account) to pull images. This agent must be granted cross-project read access.

**Service Agent pattern**:
```
service-INSTANCE_PROJECT_NUMBER@serverless-robot-prod.iam.gserviceaccount.com
```

**Grant access** for each instance project:
```bash
# Get the Project Number of the instance project
INSTANCE_PROJECT_NUMBER=$(gcloud projects describe INSTANCE_PROJECT_ID --format="value(projectNumber)")

# Grant Artifact Registry Reader in the central registry project
gcloud artifacts repositories add-iam-policy-binding YOUR_REPO_NAME \
    --project=CENTRAL_REGISTRY_PROJECT_ID \
    --location=your-region \
    --member="serviceAccount:service-${INSTANCE_PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.reader"
```

**Deploy using the full image path** (including the central registry project ID):
```bash
gcloud run deploy my-service \
  --image us-central1-docker.pkg.dev/CENTRAL_REGISTRY_PROJECT/my-repo/my-image:tag \
  --project INSTANCE_PROJECT_A
```

### Infrastructure vs. Deployment Tooling

Terraform and `gcloud` CLI serve different purposes in this architecture. Terraform manages **infrastructure provisioning** (resources that change rarely), while `gcloud` handles **image deployments** (which happen frequently).

**Terraform manages (infra provisioning):**
* Cloud Run service creation
* IAM bindings (cross-project Artifact Registry access)
* Networking, VPC connectors
* Artifact Registry repositories

**`gcloud` manages (deploy-time):**
```bash
gcloud run deploy my-service \
  --image us-central1-docker.pkg.dev/CENTRAL_PROJECT/repo/app:${IMAGE_TAG} \
  --project INSTANCE_PROJECT
```

To prevent Terraform from fighting `gcloud` over the image tag, the Cloud Run resource must ignore image changes:
```hcl
resource "google_cloud_run_v2_service" "app" {
  template {
    containers {
      image = "us-central1-docker.pkg.dev/CENTRAL_PROJECT/repo/app:initial"
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}
```

**Why not use Terraform for deploys?** Deploying a new image tag can happen dozens of times a day. Terraform adds ~30-60s overhead per apply, requires state file locking, and is overkill when only a tag changes. `gcloud run deploy` is fast and purpose-built for this.

### Terraform State Storage

Terraform state is stored in a **GCS bucket in the central registry project**, with one prefix per instance for isolation. State files contain sensitive infrastructure metadata — IAM bindings, service account emails, project numbers, internal IPs, VPC/subnet CIDRs, and resource URLs — enough for an attacker to map the full infrastructure topology. The bucket must have **object versioning** enabled, access **restricted to CI service accounts and infra admins only**, and be treated with the same sensitivity as Secret Manager.

### End-to-End Flow

1. **Public Repo CI**: Builds image and pushes to `CENTRAL_REGISTRY_PROJECT`.
2. **Private Repo CD**: Receives `repository_dispatch`, tells `INSTANCE_PROJECT_A` to deploy image `us-docker.pkg.dev/CENTRAL_PROJECT/repo/image:tag`.
3. **GCP Internal**: Cloud Run in `INSTANCE_PROJECT_A` uses its Service Agent to pull the image cross-project from the central registry.

## 5. Implementation Notes

* Create the `repository_dispatch` workflow in the Public Repo CI that triggers after image push.
* Create the listener workflow in the Private Infra Repo that extracts `image_tag` from `client_payload` and runs deployment.
* Store the PAT as a GitHub Actions secret in the Public Repo.
* Grant `roles/artifactregistry.reader` to each instance project's Cloud Run Service Agent on the central registry.