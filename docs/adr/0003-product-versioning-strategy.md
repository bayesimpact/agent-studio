# ADR 0003: Product Versioning Strategy

* **Status**: Proposed
* **Date**: 2026-02-25
* **Deciders**: Jérémie

---

## 1. Context and Problem Statement

As we move toward our initial product launch, we need a versioning scheme that balances two competing needs:

1. **Technical Granularity**: Internal developers need to manage dependencies and understand breaking changes between libraries.
2. **Market Clarity**: Customers and stakeholders need to easily identify how current their version of the product is without decoding semantic integers.

SemVer is the industry standard for libraries but lacks chronological context. CalVer provides immediate context around the release date, which is more intuitive for a full product/SaaS offering.

## 2. Decision

We will implement a **Dual-Track Versioning System**:

### Product Level (CalVer)

The user-facing product (UI and API distribution) will follow the **YY.MM.Micro** format.

* **YY**: Two-digit year (e.g., `26`).
* **MM**: Two-digit month (e.g., `03`).
* **Micro**: Incremental patch integer for hotfixes (e.g., `.0`, `.1`).
* **First Release**: `26.03.0`.

### Internal / Library Level (SemVer)

All internal packages and shared modules will use **SemVer** (`Major.Minor.Patch`).

* Breaking changes are explicitly signaled to the engineering team via a major version bump.

### Traceability

Every CalVer release will embed the **Git Commit SHA** in its metadata for a full audit trail.

> *Example: `26.03.0+sha.a1b2c3d`*

## 3. Alternatives Considered

* **SemVer only**: Rejected because a `v2.0.0` label provides no intuitive signal to customers about when it was released or how outdated their installation is.
* **CalVer only (across all packages)**: Rejected because internal libraries require explicit breaking-change signals that CalVer does not provide by convention.

## 4. Consequences

* **Positive Impacts**:
    * **Predictability**: Marketing and Product teams can plan around named calendar releases (e.g., "March Release").
    * **Transparency**: Customers can immediately identify outdated installations (e.g., seeing `25.12` in 2026).
    * **Reduced friction**: Avoids the psychological hurdle of major version bumps by letting the calendar drive the primary version number.
* **Negative Impacts / Risks**:
    * **Compatibility ambiguity**: CalVer does not inherently signal breaking changes. All breaking changes must be clearly documented in release notes.
    * **Tooling overhead**: CI/CD pipelines must handle two tagging styles (date-based for the product, SemVer for internal artifacts).

## 5. Implementation Notes

* CI/CD must be configured to auto-generate the `YY.MM` tag on the first merge to `main` each month.
* The project `README.md` must be updated to document this versioning standard once accepted.