# ProformApp

ProformApp is a Spanish-language application for managing clients and producing numbered proformas (quotes). It uses Next.js App Router, Supabase Auth/Postgres, React Server Actions, Tailwind/shadcn UI, and browser-side PDF generation with jsPDF.

## What is implemented

- Email/password login with Supabase and middleware-protected dashboard routes.
- Client creation, search, editing, soft deletion, and Cédula/RUC duplicate handling.
- Draft proformas with ordered line items, gain percentage, discount, IVA, delivery/payment details, and calculated totals.
- Per-user sequential proforma numbers through the `get_next_proforma_number` database function.
- Draft-only editing, finalization, cloning, search/pagination, and client-side PDF download.

The detailed product/design reference is [proforma_app_specs.md](./proforma_app_specs.md). It contains historical implementation notes; use the code and database type definitions as the source of truth where they differ (this implementation uses jsPDF rather than `@react-pdf/renderer`).

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
| App routes | `src/app` | `(auth)` contains login; `(dashboard)` contains dashboard, clients, and proformas. |
| Authentication/session refresh | `src/middleware.ts`, `src/lib/supabase/` | Middleware refreshes the session and redirects unauthenticated requests to `/login`. |
| Mutations and reads | `src/lib/actions/` | Server Actions for auth, clients, dashboard metrics, and proformas. |
| Forms and UI | `src/components/` | React Hook Form + Zod; reusable shadcn-style primitives are in `components/ui`. |
| Validation | `src/lib/validations/` | Shared client and proforma schemas. Keep server-action validation in sync with form changes. |
| Pricing/PDF helpers | `src/lib/calculations.ts`, `src/lib/pdf-generator.ts` | PDF is generated in the browser and saved on demand. |
| Database contract | `src/lib/types/database.ts` | TypeScript representation of the Supabase public schema. |
| SQL migrations | `supabase/migrations/` | Currently contains the item-position migration only. |

## Database expectations

The app expects these Supabase tables:

- `clients` — owned by `user_id`; includes identity/contact fields and nullable `deleted_at` for soft deletion.
- `proformas` — owned by `user_id`; references a client and holds number, status, financial totals, and quote metadata.
- `items` — references a proforma; each item has an explicit, non-negative `position` used for display order.
- `proforma_sequence` — one row per user for allocating sequential quote numbers.

It also calls the Postgres function `get_next_proforma_number(p_user_id uuid)` and relies on foreign keys from proformas to clients and items to proformas. RLS policies must limit each table and function to the authenticated owner. The expected columns and relationships are documented in `src/lib/types/database.ts`.

Important: this repository does **not** contain an initial schema migration. It only contains [`20260801000000_add_item_position.sql`](./supabase/migrations/20260801000000_add_item_position.sql), which assumes the tables already exist. Before onboarding a new Supabase project, create/check in a baseline migration for the tables, RLS policies, indexes, sequence function, and any current columns such as `proformas.descuento`; then apply the position migration. Update `src/lib/types/database.ts` after schema changes.

## Business rules to preserve

- Client Cédula/RUC is validated as 10 or 13 digits and is unique per user.
- Quote numbers are sequential per user and must be allocated by the database function, not calculated in the client.
- Only `draft` proformas can be edited. Finalized proformas can still be viewed, cloned, and downloaded as PDF.
- Item ordering is persisted via `items.position`; always set it when inserting/replacing items.
- Item total is `(unit_cost + unit_cost × percentage_gain / 100) × quantity`.
- A percentage discount is applied to the subtotal before IVA; total is discounted subtotal plus IVA.
- Client deletion is soft deletion. Lists exclude records with `deleted_at` set.

## Continuing development

Follow the established path for changes: form → Zod schema → Server Action → Supabase query → cache revalidation. Keep user ownership derived from `supabase.auth.getUser()` on the server; never accept a user ID from browser input.

For database work, add a timestamped SQL migration under `supabase/migrations/`, apply it to the intended Supabase environment, and update the database types. Test RLS with more than one user—application-side filtering is not a security boundary.

PDF branding is intentionally application-specific: [`src/lib/pdf-generator.ts`](./src/lib/pdf-generator.ts) contains the company name, professional name, identification value, and uses [`public/logo_armonint.jpg`](./public/logo_armonint.jpg). Update these together when changing branding. The generator accesses `window` and `Image`, so it must remain client-side.

## Current verification baseline

The repository currently has Jest tests for validations, calculations, PDF helpers, and selected UI/forms. On 2026-09-19, `npm test -- --runInBand` produced 37 passing tests and 1 known failing test: `ProformaForm › calculates totals correctly when item values change`. The assertion uses `/Total:/`, which now matches `Costo Total:`, `Ganancia Total:`, and `Total:`. Update that test to target the final-total label more specifically before treating the suite as green.

There is a Playwright configuration, but no `e2e/` test directory is currently tracked. Add end-to-end coverage for login, client CRUD, draft/finalized permissions, PDF download, and cross-user RLS isolation as the next high-value test work.

## Deployment checklist

- Set the two `NEXT_PUBLIC_SUPABASE_*` variables in the hosting provider.
- Apply the complete schema/RLS/function migrations to the production Supabase project.
- Create the authorized Supabase Auth user(s); self-service registration is not implemented.
- Run `npm run lint`, `npm test`, and `npm run build`.
- Verify login, proforma number allocation, finalization restrictions, PDF download, and RLS isolation in production.
