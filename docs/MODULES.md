# Module catalog

Kura CRM ships 98 business modules. Every module is defined once in `src/modules/catalog/` and rendered by the shared module engine, so records, reports and dashboards always read the same data.

## Module kinds

- **crud** — schema-driven records with search, filters, sorting, pagination, CSV export and a generated form.
- **report** — a read-only report generated from the same records by the shared report renderer.
- **special** — a bespoke screen (calendar, dashboard, generator, settings, download centre, …).

## Overview

| Module      | ID          | Kind    |
| ----------- | ----------- | ------- |
| My calendar | `calendar`  | special |
| Utilities   | `utilities` | special |
| QR codes    | `qr-code`   | special |

## Customers

| Module            | ID                  | Kind |
| ----------------- | ------------------- | ---- |
| Customers         | `customers`         | crud |
| Leads             | `leads`             | crud |
| Lead contacts     | `lead-contacts`     | crud |
| Deals             | `deals`             | crud |
| Lead forms        | `lead-forms`        | crud |
| Estimate requests | `estimate-requests` | crud |
| Contracts         | `contracts`         | crud |
| Knowledge base    | `knowledge-base`    | crud |

## Sales

| Module        | ID              | Kind |
| ------------- | --------------- | ---- |
| Subscriptions | `subscriptions` | crud |
| Orders        | `orders`        | crud |
| Proposals     | `proposals`     | crud |
| Estimates     | `estimates`     | crud |
| Invoices      | `invoices`      | crud |
| Payments      | `payments`      | crud |
| Credit notes  | `credit-notes`  | crud |

## Finance

| Module        | ID              | Kind |
| ------------- | --------------- | ---- |
| Expenses      | `expenses`      | crud |
| Bank accounts | `bank-accounts` | crud |

## Work

| Module              | ID                    | Kind    |
| ------------------- | --------------------- | ------- |
| Projects            | `projects`            | crud    |
| Project roadmap     | `project-roadmap`     | special |
| Tasks               | `tasks`               | crud    |
| Timesheets          | `timesheets`          | crud    |
| Timesheets overview | `timesheets-overview` | special |

## Human resources

| Module       | ID             | Kind |
| ------------ | -------------- | ---- |
| Employees    | `employees`    | crud |
| Departments  | `departments`  | crud |
| Designations | `designations` | crud |
| Leaves       | `leaves`       | crud |
| Shift roster | `shift-roster` | crud |
| Attendance   | `attendance`   | crud |
| Holidays     | `holidays`     | crud |
| Appreciation | `appreciation` | crud |

## Payroll

| Module            | ID                  | Kind   |
| ----------------- | ------------------- | ------ |
| Payroll           | `payroll-runs`      | crud   |
| Employee salary   | `employee-salaries` | crud   |
| Payroll expenses  | `payroll-expenses`  | crud   |
| Overtime requests | `overtime-requests` | crud   |
| Payroll reports   | `payroll-reports`   | report |

## Performance

| Module                | ID                      | Kind    |
| --------------------- | ----------------------- | ------- |
| Performance dashboard | `performance-dashboard` | special |
| Objectives            | `objectives`            | crud    |
| OKR scores            | `okr-scores`            | crud    |
| 1:1 meetings          | `one-on-ones`           | crud    |

## Recruitment

| Module                | ID                   | Kind    |
| --------------------- | -------------------- | ------- |
| Recruitment dashboard | `recruit-dashboard`  | special |
| Jobs                  | `jobs`               | crud    |
| Job applications      | `job-applications`   | crud    |
| Interview schedule    | `interview-schedule` | crud    |
| Offer letters         | `offer-letters`      | crud    |
| Skills                | `skills`             | crud    |
| Candidate database    | `candidate-database` | crud    |
| Career site           | `career-site`        | special |
| Recruitment reports   | `recruit-reports`    | report  |

## Purchase

| Module           | ID                 | Kind   |
| ---------------- | ------------------ | ------ |
| Vendors          | `vendors`          | crud   |
| Products         | `products`         | crud   |
| Purchase orders  | `purchase-orders`  | crud   |
| Bills            | `bills`            | crud   |
| Vendor payments  | `vendor-payments`  | crud   |
| Vendor credits   | `vendor-credits`   | crud   |
| Inventory        | `inventory`        | crud   |
| Purchase reports | `purchase-reports` | report |

## Support

| Module  | ID        | Kind |
| ------- | --------- | ---- |
| Tickets | `tickets` | crud |

## Collaboration

| Module       | ID             | Kind |
| ------------ | -------------- | ---- |
| Events       | `events`       | crud |
| Messages     | `messages`     | crud |
| Notice board | `notice-board` | crud |
| Assets       | `assets`       | crud |
| Biolinks     | `biolinks`     | crud |

## Biometric

| Module            | ID                   | Kind |
| ----------------- | -------------------- | ---- |
| Biometric devices | `biometric-devices`  | crud |
| Attendance logs   | `attendance-logs`    | crud |
| Employee mapping  | `employee-mapping`   | crud |
| Commands          | `biometric-commands` | crud |

## Monitor centre

| Module                   | ID                 | Kind    |
| ------------------------ | ------------------ | ------- |
| Monitor centre           | `monitor-center`   | special |
| Screen analytics         | `screen-analytics` | crud    |
| Screenshots              | `screenshots`      | crud    |
| Monitor reports          | `monitor-reports`  | report  |
| Agent config             | `agent-config`     | crud    |
| Download agent installer | `agent-download`   | special |

## Server manager

| Module              | ID                 | Kind    |
| ------------------- | ------------------ | ------- |
| Server dashboard    | `server-dashboard` | special |
| Hosting management  | `hosting`          | crud    |
| Domain management   | `domains`          | crud    |
| Provider management | `providers`        | crud    |

## Showroom

| Module            | ID                  | Kind    |
| ----------------- | ------------------- | ------- |
| Showroom contacts | `showroom-contacts` | crud    |
| Showroom deals    | `showroom-deals`    | crud    |
| Feedback QR code  | `feedback-qr`       | special |

## Webhooks

| Module      | ID             | Kind |
| ----------- | -------------- | ---- |
| Webhooks    | `webhooks`     | crud |
| Webhook log | `webhook-logs` | crud |

## Reports

| Module            | ID                        | Kind    |
| ----------------- | ------------------------- | ------- |
| Reports           | `reports`                 | special |
| Task report       | `report-task`             | report  |
| Time log report   | `report-time-log`         | report  |
| Weekly timesheet  | `report-weekly-timesheet` | report  |
| Finance report    | `report-finance`          | report  |
| Income vs expense | `report-income-expense`   | report  |
| Leave report      | `report-leave`            | report  |
| Attendance report | `report-attendance`       | report  |
| Expense report    | `report-expense`          | report  |
| Deal report       | `report-deal`             | report  |
| Sales report      | `report-sales`            | report  |

## Documents

| Module           | ID                 | Kind    |
| ---------------- | ------------------ | ------- |
| Letter templates | `letter-templates` | crud    |
| Generate letter  | `letter-generator` | special |

## Settings

| Module   | ID         | Kind    |
| -------- | ---------- | ------- |
| Settings | `settings` | special |
