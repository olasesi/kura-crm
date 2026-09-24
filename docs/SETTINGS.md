# Settings

The Settings engine powers company-wide configuration, per-user preferences, and feature toggles
for the Kura CRM platform. It is exposed over both REST and GraphQL, cached in Redis, audited,
and emits webhook events so downstream services can react.

## Architecture

```
                 ┌──────────────────────────────────────────────────┐
  REST / GraphQL │                                                │
       ─────────►│  SettingController / GraphQL resolvers          │
                 │        │                                        │
                 │        ▼                                        │
                 │  SettingService                                 │
                 │   ├─ validation (zod, per-group schemas)        │
                 │   ├─ defaults (DEFAULT_SETTINGS)                │
                 │   ├─ Redis cache  (settings:{scope}:{group})     │
                 │   ├─ audit log  (addAuditLog)                    │
                 │   ├─ metrics    (settings_*_total counters)      │
                 │   └─ webhooks   (setting.updated / deleted)      │
                 │        │                                        │
                 │        ▼                                        │
                 │  Setting model (group, key, value, userId)      │
                 └──────────────────────────────────────────────────┘
```

### Storage model

One row per (`group`, `key`, `userId`); `userId = 0` means "global/company scope", a non-zero
`userId` scopes the value to that user. Values are stored as JSON strings.

- Composite unique index: `(group, key, userId)` — user overrides never collide.
- Reads merge **user rows → global rows → defaults** (in that precedence order).

### Groups registry

All groups live in `SETTING_GROUPS` (`api/src/services/settingService.ts`). Each entry declares:

| Field         | Meaning                                                     |
| ------------- | ----------------------------------------------------------- |
| `group`       | Slug, e.g. `company`, `app`, `payroll`                      |
| `description` | Human-readable purpose                                      |
| `scope`       | `global`, `user`, or `both`                                 |
| `sensitive`   | Non-admins get `403` on reads (payment/secret groups)       |

44 groups are shipped today: `company`, `business_address`, `downloads`, `app`, `profile`,
`notification`, `currency`, `payment_credentials`, `finance`, `contract`, `tax`, `ticket`,
`project`, `attendance`, `leave`, `custom_fields`, `roles_permissions`, `message`, `lead`,
`time_log`, `task`, `security`, `theme`, `module`, `storage`, `language`, `social_login`,
`google_calendar`, `custom_links`, `gdpr`, `database_backup`, `signup`, `asset`, `payroll`,
`overtime`, `performance`, `purchase`, `recruit`, `rest_api`, `update`, plus metadata helpers.

Sensitive groups: `notification`, `payment_credentials`, `storage`, `social_login`,
`google_calendar`, `rest_api`.

### Validation

Typed groups define a zod schema (`SETTING_GROUP_SCHEMAS`). Schemas use `.partial().passthrough()`
so partial updates are allowed while unknown groups / invalid values are rejected:

- Unknown group → `404`
- Invalid value → `400 Validation failed for settings group "<g>": <message>`

Ungrouped/untyped keys still pass the group-name existence check.

## REST API

Prefix: `/api/settings`. All routes require `Authorization: Bearer <token>`.

| Method   | Path                          | Auth   | Description                                        |
| -------- | ----------------------------- | ------ | -------------------------------------------------- |
| `GET`    | `/api/settings/groups`        | user   | List group metadata (description, scope, sensitive) |
| `GET`    | `/api/settings`               | admin  | Aggregate of every group (global)                  |
| `GET`    | `/api/settings/:group`        | user   | Global settings for a group (redacted if non-admin, `403` on sensitive groups) |
| `PUT`    | `/api/settings/:group`        | admin  | Upsert global settings for a group                 |
| `DELETE` | `/api/settings/:group`        | admin  | Reset a group to defaults                          |
| `DELETE` | `/api/settings/:group/:key`   | admin  | Delete one key (falls back to default)             |
| `GET`    | `/api/settings/:group/me`     | user   | The caller's user-scoped settings for a group      |
| `PUT`    | `/api/settings/:group/me`     | user   | Update the caller's user-scoped settings (`403` on global groups) |

Example — update company name:

```bash
curl -X PUT https://api.kura-crm.com/api/settings/company \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Inc."}'
```

Example — read your profile prefs:

```bash
curl https://api.kura-crm.com/api/settings/profile/me -H "Authorization: Bearer $TOKEN"
```

## GraphQL

Three queries, three mutations:

```graphql
query {
  settingGroups { group description scope sensitive }
  settings(group: "app") { key value }          # admin sees full, sensitive groups 403 non-admins
  mySettings(group: "profile") { key value }
}

mutation {
  updateSettings(group: "app", input: [{ key: "timeFormat", value: "\"24h\"" }]) { key value }
  updateMySettings(group: "profile", input: [{ key: "language", value: "\"en\"" }]) { key value }
  resetSettings(group: "currency")              # admin only
}
```

Field `value` is the JSON-encoded string (encode objects/arrays as JSON text).

## Caching

- **Read path:** `cacheGet(settings:{scopeId}:{group})`, TTL `CACHE_TTL.MEDIUM` (300s). A miss
  loads from the DB and writes back via `cacheSet`. Aggregate reads use `...:__all`.
- **Write path:** the whole `settings:*` namespace is invalidated with `cacheDel("settings:*")`.
- Caching is best-effort: missing Redis degrades to reads against the DB (`cacheGet` returns `null`).

## Webhooks & audit

- Events `setting.updated`, `setting.deleted` are dispatched on write operations.
- Every update/reset/delete writes an audit entry via `addAuditLog` (BullMQ queue) for
  change-tracking and compliance (GDPR audit trails).

## Metrics

Prometheus counters on `/metrics`:

- `settings_updates_total{group}` — write operations per group.
- `settings_reads_total{group,cache}` — reads, labeled `cache="hit" | "miss"`.

Alert on `settings_updates_total` spikes and on an abnormal hit-ratio drop (cache thrash).

## Scaling notes

- **Database:** the composite index already covers the hot query `WHERE group=? AND userId=?`.
  At very high write rates, shard settings by `group` or move values into
  Redis/Postgres JSONB; keep the relational rows for audit/dump consistency.
- **Cache:** TTL 300s is a good default. If writes increase, reduce TTL or switch to
  pub/sub invalidation (`cacheDel` uses `KEYS settings:*` scan — fine under ~10k keys).
- **Fan-out:** at scale, replace direct webhook dispatch with a dedicated worker and retry/DLQ.

## Deployment

- Settings bootstrap: on first boot the service writes `DEFAULT_SETTINGS` for any group that has
  none — see `SettingService.ensureDefaults` / startup wiring.
- Backups: the `database_backup` group drives the scheduled DB dump job.
- `update` group is read-only and reflects the deployed build (used by the dashboard "Updates" view).