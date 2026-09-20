# Phase 5 database acceptance

Apply 20260920010000_create_project_financial_summary.sql after Phase 4.
These SQL-view checks remain pending in the target Supabase environment.
Use ordinary authenticated users A and B, not service_role.

1. Todos Santos: full imported net sale $1,400, quoted cost $1,020, commitment
   $1,020, receipt $700.09 and linked payment $510. Summary must show customer
   balance $699.91, supplier balance $510, cash $190.09, quoted/expected margin
   $380. Actual margin is null until status is completed.
2. Add another $510 payment: paid becomes $1,020; expected margin stays $380.
   Add a $10 unlinked expense: expected margin becomes $370.
3. Add a $20 payment exceeding the commitment: expected margin becomes $350;
   supplier balance stays zero. Void it: expected margin returns to $370.
4. Complete the project: actual margin equals net sales minus non-voided
   outgoing payments ($370 for the preceding fixture). Reopen: actual margin
   returns to null. Cash is never substituted for margin.
5. Cancel an execution commitment with payments: outstanding obligation goes
   away, but payments remain included as paid/uncommitted costs.
6. Import a $600 line from a $1,000 proforma with 10% discount and 15% IVA:
   net_sales = $540, client_total_due = $621. Add its $400 remainder: net_sales
   = $900, client_total_due = $1,035. No snapshot values are overwritten.
7. Add a second proforma, multiple execution items and multiple transactions:
   none of the totals should be multiplied by the number of joined records.
8. Check alerts for an approved project without receipts, insufficient cash,
   outstanding suppliers, closing with customer balance, and a due date before
   today in America/Guayaquil. Paid/cancelled expected collections do not count
   as overdue; voiding a receipt can make a collection overdue again.
9. View as A: no rows or aggregates for B should be visible. Repeat as B.
   The financial view uses security_invoker so all source-table RLS applies.
10. Dashboard totals include all non-archived projects across list pages and
    searches; only the active count excludes completed/cancelled statuses.
    Completed projects with outstanding debt continue to appear in attention.

The optional per-scope margin view is deferred. General-project costs have no
per-item allocation rule yet. Refund classification retains Phase 4 semantics:
all outgoing movements are paid costs, and only customer payment types count
as collections. Expected margin also includes any amount paid above commitment.
