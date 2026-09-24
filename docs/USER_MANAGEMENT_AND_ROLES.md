# User Management & Roles

Role-based access control (RBAC) for the Kura CRM platform: admin-controlled user provisioning,
role assignment, and a permission catalog that can gate any route or GraphQL field. Exposed over
both REST and GraphQL, cached in Redis, audited, and emits webhook events.

## Architecture

```
                    ┌────────────────────────────────────────────────────┐
  REST / GraphQL    │                                                    │
       ──────────►  │  UserController / RoleController / GraphQL resolvers │
                    │        │                │                            │
                    │        ▼                ▼                            │
                    │  UserService      RoleService                        │
                    │   ├─ provisioning  ├─ BUILTIN_ROLES (admin/manager/  │
                    │   ├─ last-admin    │   user) merged over DB rows     │
                    │   │  guard         ├─ PERMISSION_CATALOG lookup      │
                    │   ├─ self guards   ├─ Redis cache (roles:all,        │
                    │   ├─ audit         │   perms:{userId})               │
                    │   └─ events        ├─ audit + metrics + webhooks     │
                    │        │                │                            │
                    │        ▼                ▼                            │
                    │  User model         Role model                       │
                    │  (role enum,       (name, permissions JSON,         │
                    │   roleId FK)        isSystem, isActive)             │
                    │        │                                              │
                    │        └─ requirePermission(permission) middleware    │
                    └────────────────────────────────────────────────────┘
```

### Roles model

`Role` (table `roles`): `name` (unique), `description`, `permissions` (JSON array of permission
keys), `isSystem` (built-in, protected), `isActive`.

- **System roles** (`admin`, `manager`, `user`) are defined in `BUILTIN_ROLES`
  (`api/src/services/roleService.ts`) and merged with stored rows at read time — no seeding
  required. They cannot be renamed, deactivated, or deleted.
- **Custom roles** are ordinary DB rows created by admins from `PERMISSION_CATALOG`.
- A user's role comes from one of two places:
  - `User.role` enum (`admin`/`manager`/`user`) — used when assigned a system role.
  - `User.roleId` FK → `Role.id` — used when assigned a custom role (`User.role` stays `user`).

Assignment semantics: `role: "manager"` sets `role=manager, roleId=null`;
`role: "support_lead"` sets `role=user, roleId=<id>`.

### Permission catalog

`PERMISSION_CATALOG` (`api/src/types/index.ts`) defines 13 modules and 25 keys:

| Module      | Keys                                            |
| ----------- | ----------------------------------------------- |
| `users`     | `users:read`, `users:write`, `users:delete`     |
| `roles`     | `roles:read`, `roles:write`, `roles:delete`     |
| `contacts`  | `contacts:read`, `contacts:write`, `contacts:delete` |
| `settings`  | `settings:read`, `settings:write`               |
| `webhooks`  | `webhooks:read`, `webhooks:write`               |
| `reports`   | `reports:read`, `reports:write`                 |
| `security`  | `security:manage`                               |
| `finance`   | `finance:read`, `finance:write`                 |
| `payroll`   | `payroll:read`, `payroll:write`                 |
| `attendance`| `attendance:read`, `attendance:write`           |
| `leave`     | `leave:read`, `leave:write`                     |
| `project`   | `project:read`, `project:write`                 |
| `task`      | `task:read`, `task:write`                       |

Built-in permissions: `admin` = all keys; `manager` = team/contacts/settings/webhooks/reports/
attendance/leave/project/task/finance/payroll reads plus core writes; `user` = read access on
users/contacts/project/task/reports.

## REST API

Prefixes: `/api/roles` and `/api/users`. All routes require `Authorization: Bearer <token>`.

### Roles

| Method   | Path              | Auth            | Description                                     |
| -------- | ----------------- | --------------- | ----------------------------------------------- |
| `GET`    | `/api/roles`      | admin, manager  | List roles (built-in + custom), `?active=true`  |
| `GET`    | `/api/roles/catalog` | admin, manager | Permission catalog used to build roles        |
| `GET`    | `/api/roles/:ref` | admin, manager  | Get a role by id or name (`admin`, `7`, …)      |
| `POST`   | `/api/roles`      | admin           | Create a custom role (`201`)                    |
| `PUT`    | `/api/roles/:ref` | admin           | Update description / permissions / active state |
| `DELETE` | `/api/roles/:ref` | admin           | Delete a custom role (409 if assigned)          |

### Users (admin console)

| Method   | Path                         | Auth  | Description                                        |
| -------- | ---------------------------- | ----- | -------------------------------------------------- |
| `GET`    | `/api/users`                 | admin, manager | Paginate users                          |
| `POST`   | `/api/users`                 | admin | Create a user (temporary password if omitted)       |
| `GET`    | `/api/users/:id`             | admin, manager | Get a user                              |
| `PUT`    | `/api/users/:id`             | admin | Update profile fields / enum role / active state    |
| `PATCH`  | `/api/users/:id/active`      | admin | Activate or deactivate a user                       |
| `PUT`    | `/api/users/:id/role`        | admin | Assign a role (enum name, custom slug, or id)       |
| `PUT`    | `/api/users/:id/password`    | admin | Reset a user's password (>= 8 chars)                |
| `DELETE` | `/api/users/:id`             | admin | Delete a user                                       |
| `PUT`    | `/api/users/password/change` | self  | Change your own password                            |

Example — create a custom role:

```bash
curl -X POST https://api.kura-crm.com/api/roles \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"support_lead","description":"Support team lead","permissions":["contacts:read","contacts:write"]}'
```

Example — provision a user with that role:

```bash
curl -X POST https://api.kura-crm.com/api/users \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@acme.com","roleName":"support_lead"}'
```

## GraphQL

Three queries, seven mutations:

```graphql
query {
  roles { data { id name permissions isActive } meta { totalCount } }
  role(ref: "manager") { name description permissions }
  permissionCatalog { module label permissions }   # admin / manager only
}

mutation {
  adminCreateUser(firstName: "Jane", lastName: "Doe", email: "jane@acme.com", roleName: "support_lead") { id email role }
  setUserActive(id: "2", isActive: false) { id isActive }
  assignUserRole(id: "2", role: "manager") { id role roleId }
  resetUserPassword(id: "2", newPassword: "hunter2-secure")   # admin only
  createRole(name: "support_lead", permissions: ["contacts:read", "contacts:write"]) { id name }
  updateRole(ref: "support_lead", permissions: ["contacts:read"]) { id permissions }
  deleteRole(ref: "support_lead")                             # admin only
}
```

User-facing mutations: `updateUser`, `deleteUser` (admin only). Role mutations are admin-only;
`roles`/`role` queries are gated to admin/manager.

## Caching

- `roles:all` — merged built-in + stored role list, TTL `CACHE_TTL.MEDIUM` (300s).
- `perms:{userId}` — resolved permission keys per user, TTL 300s.
- **Write path:** any role/user mutation invalidates the whole namespace with
  `cacheDel("roles:*")` + `cacheDel("perms:*")`.
- Best-effort: missing Redis degrades to DB reads (`cacheGet` returns `null`).

## Guardrails

- **Last active admin:** deleting, deactivating, or demoting an admin requires at least one other
  active admin (`UserService.ensureAnotherActiveAdmin`).
- **Self-protection:** you cannot delete or deactivate your own account.
- **System roles:** cannot be renamed, deactivated, or deleted; names cannot be duplicated.
- **In-use roles** cannot be deleted (conflict `409`).
- **Unknown permissions** in a role are rejected with `400`.
- Inactive roles cannot be assigned (`409`).

## Webhooks & audit

- Events: `user.created`, `user.updated`, `user.deleted`, `user.role_changed`,
  `role.created`, `role.updated`, `role.deleted`.
- Every provisioning/role operation writes an audit entry via `addAuditLog` (BullMQ queue).

## Metrics

Prometheus counters on `/metrics`:

- `role_updates_total{action}` — role creates/updates/deletes.
- `user_role_changes_total{role}` — role assignments per target role.
- `user_management_total{action}` — user creates/activations/deactivations/deletes/password resets.

## Scaling notes

- **Database:** `Role.name` is unique and `User.roleId` has an FK index; reads on roles are
  cached, so scale DB capacity by cache hit-rate rather than row count.
- **Cache:** 300s TTL with full-namespace invalidation is fine below ~10k roles. For bigger
  deployments move to pub/sub invalidation or a per-row version token.
- **Permissions fan-out:** when a role changes, `perms:*` is fully invalidated; at high
  user counts, extend invalidation to only the affected users via a `roleId` index lookup.

## Deployment

- Create the admin seed on first boot (or via `POST /api/users` with the `admin` role).
- Built-in role definitions live in code (`BUILTIN_ROLES`) — ship permission updates with the
  deploy so system role semantics are always correct.
- Custom roles are data: back them up with the normal DB dumps.