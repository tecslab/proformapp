# Proforma Management App - Technical Specifications

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 15+ (App Router) + React Server Actions│
│            Tailwind CSS + shadcn/ui              │
└──────────────────┬──────────────────────────────┘
                   │
                   │ API Routes / Server Actions
                   │
┌──────────────────┴──────────────────────────────┐
│              Backend (Next.js)                   │
│  • API Routes for CRUD operations                │
│  • Server Actions for mutations                  │
│  • PDF Generation (react-pdf)                    │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼─────────┐
│   Supabase     │   │  Vercel Edge     │
│   PostgreSQL   │   │   Functions      │
│   + Auth       │   │  (optional for   │
│   + RLS        │   │  PDF generation) │
└────────────────┘   └──────────────────┘
```

### Data Flow
1. **Authentication**: Supabase Auth handles login, returns JWT
2. **Data Access**: Next.js server components/actions query Supabase with RLS
3. **PDF Generation**: Server-side rendering on-demand (no storage)
4. **Storage**: All data in Supabase PostgreSQL with Row-Level Security

---

## Key Technical Decisions

### 1. PDF Generation
- **Library**: `@react-pdf/renderer`
- **Strategy**: Generate on-demand (no pre-generation or storage)
- **Rationale**: Simpler implementation, no storage costs, suitable for low traffic

### 2. Sequential Proforma Numbers
- **Format**: Simple sequential numbers (1, 2, 3...)
- **Implementation**: Database function with transaction locking
- **Scope**: Per user (each user has independent sequence)

### 3. Company Information
- **Storage**: Hardcoded in PDF template
- **Rationale**: Single user, no customization needed for v1

### 4. Client Data Management
- **Deduplication**: UNIQUE constraint on (user_id, cedula_ruc)
- **Error Handling**: Show error on duplicate
- **Historical Data**: Client updates affect historical proformas (no denormalization)

### 5. Item Units
- **Input Type**: Free text field
- **Rationale**: Maximum flexibility, can add dropdown later if needed

### 6. State Management
- **Approach**: React Server Components + Server Actions
- **Client State**: Minimal, using `useOptimistic` for immediate feedback
- **No Redux/Zustand**: Single-user app doesn't need complex state management

### 7. Form Validation
- **Library**: Zod + React Hook Form
- **Sharing**: Schemas shared between client and server for type safety

### 8. PDF Template
- **Customization**: Fixed template for v1
- **Future**: Can add customization if requested

### 9. Data Backup
- **Strategy**: Rely on Supabase automatic backups
- **Export**: Not implemented in v1, can add CSV export later if needed

---

## Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Authentication + basic infrastructure

**Deliverables**:
- ✅ Next.js project initialized with TypeScript
- ✅ Supabase project created and configured
- ✅ Database schema deployed with RLS policies
- ✅ Authentication system (login/logout)
- ✅ Protected route middleware
- ✅ Dashboard layout with navigation

**Key Tasks**:
1. Initialize Next.js with App Router
2. Set up Supabase (database + auth)
3. Configure environment variables
4. Implement login page with Supabase Auth
5. Create middleware for protected routes
6. Build dashboard layout with navbar

---

### Phase 2: Client Management (Week 2)
**Goal**: Full CRUD for clients

**Deliverables**:
- ✅ Clients table with RLS policies
- ✅ Client list page with search functionality
- ✅ Create client form with validation
- ✅ Edit client form
- ✅ Delete client functionality
- ✅ Duplicate detection (cédula/RUC)

**Key Tasks**:
1. Create Server Actions for client CRUD
2. Build client list page (`/clients`)
3. Implement client form component (reusable)
4. Create new client page (`/clients/new`)
5. Create edit client page (`/clients/[id]/edit`)
6. Add search and filtering
7. Handle validation errors (Zod)

---

### Phase 3: Proforma Creation (Week 3)
**Goal**: Create and edit proformas

**Deliverables**:
- ✅ Proformas and items tables
- ✅ Sequential number generation working
- ✅ New proforma form with dynamic items
- ✅ Auto-calculation (subtotal, IVA, total)
- ✅ Draft saving functionality
- ✅ Client selector with search

**Key Tasks**:
1. Implement `get_next_proforma_number()` function
2. Build proforma creation form
3. Add dynamic item rows (add/remove)
4. Implement real-time calculations
5. Create Server Actions for proforma creation
6. Add form validation
7. Implement optimistic UI updates

---

### Phase 4: Proforma Review & Search (Week 4)
**Goal**: View and search proformas

**Deliverables**:
- ✅ Proforma list page with filters
- ✅ Search by number or client name
- ✅ Proforma detail page (read-only)
- ✅ Edit functionality for drafts
- ✅ Finalize action (status change)
- ✅ Prevent editing finalized proformas

**Key Tasks**:
1. Build proforma list page (`/proformas`)
2. Implement search and filtering
3. Add pagination
4. Create detail page (`/proformas/[id]`)
5. Add edit page (`/proformas/[id]/edit`)
6. Implement finalize action
7. Add status-based permissions

---

### Phase 5: PDF Generation (Week 5)
**Goal**: Generate downloadable PDFs

**Deliverables**:
- ✅ PDF template designed
- ✅ API route for PDF generation
- ✅ Download button on proforma view
- ✅ Proper formatting (company info, items, totals)
- ✅ IVA breakdown display

**Key Tasks**:
1. Install and configure `@react-pdf/renderer`
2. Design PDF template components
3. Create API route (`/api/proformas/[id]/pdf`)
4. Fetch proforma data with relations
5. Render PDF with proper styling
6. Add download button to UI
7. Handle edge cases and errors

**PDF Template Sections**:
- Header: Company logo and information (hardcoded)
- Client details: Name, ID, address, contact
- Proforma info: Number, date, delivery time
- Items table: Description, quantity, unit, cost, gain%, total
- Totals section: Subtotal, IVA calculation, total
- Footer: Observations, payment methods

---

### Phase 6: Polish & Testing (Week 6)
**Goal**: Production-ready application

**Deliverables**:
- ✅ Responsive design for mobile/tablet
- ✅ Loading states and error handling
- ✅ Toast notifications for actions
- ✅ Performance optimizations
- ✅ Production deployment on Vercel

**Key Tasks**:
1. Add loading indicators throughout app
2. Implement error boundaries and handling
3. Add toast notifications (success/error)
4. Test responsive design
5. Optimize database queries and indexes
6. Test edge cases (empty states, large data)
7. Deploy to Vercel
8. Configure environment variables
9. Test production deployment

---

## Technical Specifications

### Tech Stack

| Layer | Technology | Version/Notes |
|-------|-----------|---------------|
| Framework | Next.js (App Router) | 15+ |
| Language | TypeScript | Latest |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | Latest |
| Database | Supabase PostgreSQL | Managed |
| Authentication | Supabase Auth | Email/password |
| PDF Generation | @react-pdf/renderer | Latest |
| Validation | Zod | Latest |
| Forms | React Hook Form | Latest |
| Deployment | Vercel | Serverless |

---

### Database Schema

#### Clients Table
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- cedula_ruc: varchar(13) UNIQUE per user
- first_name: varchar(100)
- last_name: varchar(100)
- address: text
- phone: varchar(20)
- email: varchar(100)
- created_at: timestamp
- updated_at: timestamp
```

#### Proformas Table
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- proforma_number: integer UNIQUE per user
- client_id: uuid (FK to clients)
- date: date
- iva_percentage: decimal(5,2) default 15.00
- observations: text
- delivery_days: integer
- payment_methods: text
- status: enum('draft', 'finalized')
- subtotal: decimal(10,2)
- iva_amount: decimal(10,2)
- total: decimal(10,2)
- created_at: timestamp
- updated_at: timestamp
```

#### Items Table
```sql
- id: uuid (PK)
- proforma_id: uuid (FK to proformas)
- description: varchar(255)
- unit_cost: decimal(10,2)
- quantity: decimal(10,2)
- unit: varchar(20)
- percentage_gain: decimal(5,2)
- line_total: decimal(10,2)
- created_at: timestamp
```

#### Proforma Sequence Table
```sql
- user_id: uuid (PK)
- last_number: integer
- updated_at: timestamp
```

---

### Business Rules

1. **Authentication**
   - Single user application
   - Email/password authentication via Supabase
   - All data private to authenticated user (enforced by RLS)

2. **Clients**
   - Cédula/RUC must be unique per user
   - Can be reused across multiple proformas
   - Updates to client info affect all historical proformas
   - Cannot delete client if referenced by proformas

3. **Proformas**
   - Sequential numbering per user (1, 2, 3...)
   - Can be edited while status = 'draft'
   - Cannot be edited after status = 'finalized'
   - Items are unique per proforma (not reusable)
   - Currency: USD (hardcoded)
   - IVA percentage configurable per proforma (default 15%)

4. **Items**
   - Belong to single proforma
   - Line total = (unit_cost × quantity) × (1 + percentage_gain/100)
   - Free text unit field
   - Deleted when parent proforma is deleted (CASCADE)

5. **Calculations**
   - Subtotal = sum of all item line_totals
   - IVA amount = subtotal × (iva_percentage / 100)
   - Total = subtotal + iva_amount
   - Use decimal types to avoid floating-point errors

6. **PDF Generation**
   - Generated on-demand (not stored)
   - Available for both draft and finalized proformas
   - Includes all proforma data at time of generation
   - No digital signature required

---

### Security Specifications

1. **Row-Level Security (RLS)**
   - Enabled on all tables
   - Users can only access their own data
   - Enforced at database level (cannot be bypassed)

2. **Authentication**
   - JWT-based via Supabase Auth
   - Session stored in HTTP-only cookies
   - Automatic session refresh

3. **Authorization**
   - All mutations require authenticated user
   - User ID injected server-side (not from client)
   - No API key exposure to client

4. **Validation**
   - Server-side validation with Zod (never trust client)
   - Client-side validation for UX only
   - SQL injection prevented by parameterized queries

---

### Performance Specifications

1. **Response Times**
   - Page load: < 2 seconds
   - Form submissions: < 1 second
   - PDF generation: < 5 seconds
   - Search/filtering: < 500ms

2. **Database Optimization**
   - Indexes on frequently queried columns
   - Pagination for large lists (50 items per page)
   - Eager loading for relations (avoid N+1 queries)

3. **Caching**
   - React Server Components automatic caching
   - Revalidate on mutations
   - No client-side data caching needed

---

### Error Handling

1. **User-Facing Errors**
   - Display friendly error messages
   - Toast notifications for actions
   - Form validation errors inline
   - No technical jargon exposed

2. **Server Errors**
   - Log to console in development
   - Consider error tracking service for production (optional)
   - Return generic message to client
   - Handle database constraint violations gracefully

3. **Edge Cases**
   - Empty states with helpful messaging
   - Loading indicators for async operations
   - Graceful degradation if PDF fails
   - Handle concurrent edit conflicts

---

## File Structure

```
proforma-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   └── proformas/
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/
│   │   │           ├── page.tsx
│   │   │           └── edit/page.tsx
│   │   ├── api/
│   │   │   └── proformas/[id]/pdf/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── clients.ts
│   │   │   └── proformas.ts
│   │   ├── validations/
│   │   │   ├── client.ts
│   │   │   └── proforma.ts
│   │   └── types/
│   │       └── database.ts
│   └── components/
│       ├── ui/ (shadcn components)
│       ├── auth/
│       │   └── login-form.tsx
│       ├── clients/
│       │   ├── client-form.tsx
│       │   └── client-list.tsx
│       ├── proformas/
│       │   ├── proforma-form.tsx
│       │   ├── proforma-list.tsx
│       │   └── item-row.tsx
│       ├── pdf/
│       │   └── proforma-template.tsx
│       └── layout/
│           └── navbar.tsx
├── middleware.ts
├── .env.local
├── package.json
└── tsconfig.json
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: Production settings
NODE_ENV=production
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All database migrations applied
- [ ] RLS policies tested
- [ ] Environment variables configured in Vercel
- [ ] First user account created in Supabase
- [ ] Company information hardcoded in PDF template
- [ ] Error handling tested

### Post-Deployment
- [ ] Test authentication flow
- [ ] Create test client
- [ ] Create test proforma
- [ ] Generate test PDF
- [ ] Verify RLS (try accessing other user's data)
- [ ] Test on mobile device
- [ ] Monitor error logs

---

## Future Enhancements (Post-v1)

1. **Multi-user Support**
   - User registration
   - User roles (admin/user)
   - Shared clients option

2. **Advanced Features**
   - Proforma templates
   - Recurring proformas
   - Client portal to view proformas
   - Email proformas directly to clients

3. **Reporting**
   - Sales analytics dashboard
   - Revenue reports
   - Client statistics

4. **Customization**
   - Custom PDF templates
   - Logo upload
   - Configurable company information
   - Custom fields

5. **Export/Import**
   - CSV export
   - Bulk import clients
   - Data backup/restore

---

## Success Criteria

- ✅ Single user can log in securely
- ✅ Create, read, update, delete clients
- ✅ Create proformas with dynamic items
- ✅ Edit draft proformas, finalize when ready
- ✅ Search proformas by number or client
- ✅ Generate professional PDF proformas
- ✅ All data is private (RLS enforced)
- ✅ Sequential proforma numbering works correctly
- ✅ App loads in <2s, PDFs generate in <5s
- ✅ No security vulnerabilities
- ✅ Responsive design works on mobile

---

## Maintenance Plan

### Regular Tasks
- Monitor Supabase usage and database size
- Review error logs weekly
- Backup database monthly (Supabase automatic)
- Update dependencies quarterly

### Security Updates
- Apply Next.js security patches immediately
- Update Supabase client library regularly
- Review RLS policies if schema changes

### Performance Monitoring
- Check page load times monthly
- Monitor PDF generation times
- Review database query performance
- Optimize indexes if queries slow down

---

*Document Version: 1.0*  
*Last Updated: December 31, 2025*