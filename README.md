# ProformApp

ProformApp is a Spanish-language application for managing clients, producing numbered proformas (quotes), and coordinating project delivery. It uses Next.js App Router, Supabase Auth/Postgres, React Server Actions, Tailwind/shadcn UI, and browser-side PDF generation with jsPDF.

## What is implemented

- Email/password login with Supabase and middleware-protected dashboard routes.
- Client creation, search, editing, soft deletion, and Cédula/RUC duplicate handling.
- Draft proformas with ordered line items, gain percentage, discount, IVA, delivery/payment details, and calculated totals.
- Per-user sequential proforma numbers through the `get_next_proforma_number` database function.
- Draft-only editing, finalization, cloning, search/pagination, and client-side PDF download.
- Phase 1 of project management: project and provider/master CRUD, ownership-based RLS, archival/deactivation, and dashboard navigation.
- Phase 2 of project management: transactional partial import of finalized proformas, immutable commercial scope snapshots, and global discount snapshots using Strategy B.
- Phase 3: multiple execution tasks per scope item, general project costs, provider assignment, estimated/committed costs, and editable execution status (including cancellation).
- Phase 4: expected collections, actual receipts/payments, payment previews, derived balances and audited transaction voiding.
- Phase 5: RLS-aware SQL financial summary, project dashboard totals, margins and attention alerts. Project financial cards read the SQL view rather than recalculating totals from UI records.

The quote product/design reference is [proforma_app_specs.md](./proforma_app_specs.md). Project-management phases and rules are defined in [implementacionGP.md](./implementacionGP.md); the selected discount model is Strategy B (a global commercial adjustment, with no persisted item-level allocation).

## Local setup

Use a current Node.js release and npm. The project has been exercised with Node 26 and npm 12.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The root route redirects to `/dashboard`; unauthenticated users are redirected to `/login`.

Create `.env.local` with the public Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never commit `.env.local` or a service-role key. Only the public URL and anon key are used by this application; access control must therefore be enforced with Supabase Row Level Security (RLS).

## Commands

```bash
npm run dev          # local development server
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm test             # Jest unit/component tests
npm run test:watch   # Jest in watch mode
npm run test:e2e     # Playwright tests (expects e2e/)
```

## Architecture and code map

| Area | Location | Notes |
| --- | --- | --- |
| App routes | `src/app` | `(auth)` contains login; `(dashboard)` contains dashboard, clients, proformas, projects, and providers. |
| Authentication/session refresh | `src/middleware.ts`, `src/lib/supabase/` | Middleware refreshes the session and redirects unauthenticated requests to `/login`. |
| Mutations and reads | `src/lib/actions/` | Server Actions for auth, clients, dashboard metrics, proformas, projects, and providers. |
| Forms and UI | `src/components/` | React Hook Form + Zod; reusable shadcn-style primitives are in `components/ui`. |
| Validation | `src/lib/validations/` | Shared client, proforma, project, and provider schemas. Keep server-action validation in sync with form changes. |
| Pricing/PDF helpers | `src/lib/calculations.ts`, `src/lib/pdf-generator.ts` | PDF is generated in the browser and saved on demand. |
| Database contract | `src/lib/types/database.ts` | TypeScript representation of the Supabase public schema. |
| SQL migrations | `supabase/migrations/` | Incremental migrations for item ordering and project-management tables. |

## Database expectations

The app expects these Supabase tables:

- `clients` — owned by `user_id`; includes identity/contact fields and nullable `deleted_at` for soft deletion.
- `proformas` — owned by `user_id`; references a client and holds number, status, financial totals, and quote metadata.
- `items` — references a proforma; each item has an explicit, non-negative `position` used for display order.
- `proforma_sequence` — one row per user for allocating sequential quote numbers.
- `projects` — user-owned operational projects linked to existing clients; archived rather than hard-deleted in the UI.
- `providers` — user-owned suppliers, masters, contractors, and service providers; deactivated rather than hard-deleted in the UI.
- `project_proformas` — links imported finalized proformas to projects and snapshots their global commercial totals.
- `project_scope_items` — immutable snapshots of selected commercial lines; original line values are retained without allocating the global discount.
- `project_execution_items` — operational tasks linked optionally to scope and providers. Costs use numeric(12,2); unknown amounts are null and zero remains an explicit amount. RLS checks ownership and same-project scope on insert/update. Apply `20260919020000_create_project_execution.sql` after Phase 2.
- `project_receivables` — expected collections with optional due dates. The `project_receivable_balances` security-invoker view derives pending/partial/paid status from actual linked receipts; cancellation is explicit.
- `project_transactions` — immutable real-money ledger. An optional `receivable_id` links receipts to expected collections. Only voiding with a reason is allowed after insertion; no authenticated DELETE policy exists. Financial foreign keys prevent cascading loss of history.

It also calls the Postgres function `get_next_proforma_number(p_user_id uuid)` and relies on foreign keys from proformas to clients and items to proformas. RLS policies must limit each table and function to the authenticated owner. The expected columns and relationships are documented in `src/lib/types/database.ts`.

Important: this repository does **not** contain an initial schema migration. Its incremental migrations assume the original client/proforma schema already exists. Before onboarding a new Supabase project, create/check in a baseline migration for those original tables, RLS policies, indexes, sequence function, and current columns such as `proformas.descuento`; then apply the incremental migrations in order. Update `src/lib/types/database.ts` after schema changes.

## Business rules to preserve

- Client Cédula/RUC is validated as 10 or 13 digits and is unique per user.
- Quote numbers are sequential per user and must be allocated by the database function, not calculated in the client.
- Only `draft` proformas can be edited. Finalized proformas can still be viewed, cloned, and downloaded as PDF.
- Item ordering is persisted via `items.position`; always set it when inserting/replacing items.
- Item total is `(unit_cost + unit_cost × percentage_gain / 100) × quantity`.
- A percentage discount is applied to the subtotal before IVA; total is discounted subtotal plus IVA.
- Client deletion is soft deletion. Lists exclude records with `deleted_at` set.
- Projects can only reference active clients owned by the authenticated user. Project archival and provider deactivation preserve historical records.
- Project-management discounts use Strategy B: keep original line amounts and global proforma snapshots. Partial-import balances attribute the original client total in proportion to imported original line totals, rounded once per proforma; no allocated item prices are persisted.
- Expected collections do not affect cash. Voided transactions do not affect balances. Outgoing expenses reduce cash; only payments linked to commitments reduce their outstanding balances.
- Refunds/other inflows affect cash but are not classified as customer collections. Supplier overpayments do not reduce the outstanding obligations to other suppliers.

## Continuing development

Apply `20260920010000_create_project_financial_summary.sql` after Phase 4.
The summary aggregates each source before joining, attributes partial-import
sales virtually, and ignores voided payments. Expected margin deducts active
commitments, uncommitted expenses and paid amounts exceeding commitments.
Actual margin is available only for completed projects. Dashboard totals cover
all non-archived projects, including outstanding balances on completed projects.
See [Phase 5 database checks](./supabase/tests/phase5-manual.md); live SQL/RLS
verification is pending in Supabase. No Docker runtime is required for the app.

Follow the established path for changes: form → Zod schema → Server Action → Supabase query → cache revalidation. Keep user ownership derived from `supabase.auth.getUser()` on the server; never accept a user ID from browser input.

For database work, add a timestamped SQL migration under `supabase/migrations/`, apply it to the intended Supabase environment, and update the database types. Test RLS with more than one user—application-side filtering is not a security boundary.

PDF branding is intentionally application-specific: [`src/lib/pdf-generator.ts`](./src/lib/pdf-generator.ts) contains the company name, professional name, identification value, and uses [`public/logo_armonint.jpg`](./public/logo_armonint.jpg). Update these together when changing branding. The generator accesses `window` and `Image`, so it must remain client-side.

## Current verification baseline

The repository currently has Jest tests for validations, calculations, PDF helpers, and selected UI/forms. On 2026-09-20, `npm test -- --runInBand` produced 81 passing tests across 14 suites.

Apply `20260920000000_create_project_financials.sql` after Phase 3 and follow
[Phase 4 acceptance checks](./supabase/tests/phase4-manual.md) for hosted-database
verification. The local Docker daemon was unavailable, so the financial migration
and cross-user database checks have not been executed by the implementation agent.

Playwright coverage exists for authentication, clients, and proformas. Project/provider CRUD and cross-user RLS isolation remain the next high-value end-to-end scenarios.

## Deployment checklist

- Set the two `NEXT_PUBLIC_SUPABASE_*` variables in the hosting provider.
- Apply the complete schema/RLS/function migrations to the production Supabase project.
- Create the authorized Supabase Auth user(s); self-service registration is not implemented.
- Run `npm run lint`, `npm test`, and `npm run build`.
- Verify login, proforma number allocation, finalization restrictions, PDF download, and RLS isolation in production.
