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

## 5. Implementation Notes

* Create the `repository_dispatch` workflow in the Public Repo CI that triggers after image push.
* Create the listener workflow in the Private Infra Repo that extracts `image_tag` from `client_payload` and runs deployment.
* Store the PAT as a GitHub Actions secret in the Public Repo.