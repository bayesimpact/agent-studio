# ADR 0004: Explicit Membership-Based Authorization

* **Status**: Proposed
* **Date**: 2026-03-23
* **Deciders**: Jérémie

---

## 1. Context and Problem Statement

The current authorization system relies on a single `UserMembership` table scoped to organizations, with roles `owner | admin | member`. As the product grows, we need finer-grained access control at the **agent** and **project** levels. Today, `ProjectMembership` exists but lacks a role column, and there is no `AgentMembership` table at all.

We need a rights system where:

- Permissions are **explicit** — every access right is materialized as a row in the database.
- There are **no implicit rights** — being an admin of an organization does not implicitly grant access to agents or projects unless a corresponding membership row exists.
- Rights propagation is handled **at write time**, not at read time (no runtime inheritance logic).

## 2. Decision

### 2.1 Three Membership Tables

We introduce (or update) three membership tables, each with a `role` column restricted to `user | admin`:

| Table                      | Scope        | Role enum        |
|----------------------------|------------- |------------------|
| `OrganizationMembership`   | Organization | `user \| admin`  |
| `ProjectMembership`        | Project      | `user \| admin`  |
| `AgentMembership`          | Agent        | `user \| admin`  |

Each table stores one row per user-resource pair. A user's access to a given resource is determined **solely** by the existence and role of their row in the corresponding table.

### 2.2 No Implicit Rights

Authorization checks at any level (organization, project, agent) look **only** at the corresponding membership table. There is no cascading logic such as "if the user is an org admin, they can access all projects". If a membership row does not exist, access is denied — period.

This makes the system:

- **Auditable** — a single SQL query on the membership table answers "who has access to what?"
- **Predictable** — no hidden permission inheritance to debug.
- **Performant** — no joins or recursive checks across multiple tables at read time.

### 2.3 Explicit Right Propagation Rules

Because rights are not implicit, the application code must **explicitly create membership rows** when certain events occur. The following propagation rules are implemented at write time:

1. **New admin invited to an organization** — The system automatically creates an `AgentMembership` row with role `admin` for **every existing agent** in that organization.

2. **New agent created in an organization** — The system automatically creates an `AgentMembership` row with role `admin` for **every existing admin** of that organization.

These rules ensure that organization admins always have admin access to all agents, but this guarantee is achieved through **explicit row creation**, not through runtime inheritance. The membership rows are the single source of truth.

### 2.4 Summary of Propagation Logic

```
On OrganizationMembership.create(user, org, role=admin):
  for each agent in org.agents:
    AgentMembership.create(user, agent, role=admin)

On Agent.create(org):
  for each orgMembership where org = org AND role = admin:
    AgentMembership.create(orgMembership.user, agent, role=admin)
```

## 3. Alternatives Considered

* **Implicit role inheritance** (e.g., org admin automatically has access to all child resources at query time): Rejected because it creates hidden coupling, makes auditing difficult, and requires complex authorization logic at every access point.
* **Single membership table with a polymorphic `resource_type` column**: Rejected because it prevents proper foreign key constraints and makes queries less efficient.
* **RBAC with a separate permissions table**: Over-engineered for our current needs. The `user | admin` role model on each table is sufficient and avoids the complexity of a full permission matrix.

## 4. Consequences

* **Positive Impacts**:
    * **Auditability**: A simple query on any membership table shows exactly who has access and at what level.
    * **Simplicity**: Authorization guards only need to check one table — no recursive role resolution.
    * **Correctness**: No risk of permission leaks through implicit inheritance bugs.
* **Negative Impacts / Risks**:
    * **Data volume**: More rows in membership tables (every org admin gets N agent membership rows). Acceptable at our current scale.
    * **Write-time complexity**: Event handlers must correctly propagate memberships. If a propagation fails or is missed, an admin could lose access to a resource. This must be covered by transactional guarantees and tests.
    * **Migration effort**: The existing `UserMembership` and `ProjectMembership` tables must be migrated to the new schema (role enum change, table rename for `UserMembership` -> `OrganizationMembership`).

## 5. Implementation Notes

* Rename `UserMembership` entity/table to `OrganizationMembership` and update the role enum from `owner | admin | member` to `admin | user`.
* Add a `role` column (`admin | user`) to the existing `ProjectMembership` table.
* Create a new `AgentMembership` entity and table with columns: `id`, `user_id`, `agent_id`, `role`, `created_at`, `updated_at`.
* Implement propagation logic as domain service methods, wrapped in database transactions.
* Write e2e tests covering both propagation rules and the absence of implicit rights.