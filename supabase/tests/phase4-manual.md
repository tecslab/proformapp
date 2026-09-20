# Phase 4 acceptance

Apply 20260920000000_create_project_financials.sql after Phase 3. Use two
normal authenticated sessions A and B; do not use service_role for RLS checks.
The migration has not been executed against the hosted database by the agent.

## Financial flows

1. Create an expected $300 advance on a project. Cash and collected remain zero.
2. Record an actual $100 customer advance linked to that expected collection.
   The expected collection shows partial, collected $100, remaining $200.
3. Record a linked $200 receipt. It shows paid and remaining $0.
4. Void the $200 receipt with a reason. It remains visible, and the expected
   collection returns to partial, with $200 remaining.
5. Cancel the expected collection. Its $100 receipt still contributes to cash.
   The cancelled collection cannot receive new linked receipts.
6. For a $1,020 commitment to Paul, record a $510 payment. The preview for a
   second $510 payment shows previous $510, remaining $510, after payment $0.
7. Record $700.09 of customer receipts and $510 of outgoing payments on a
   project with imported client total $1,400. Client balance is $699.91,
   supplier balance $510 and cash $190.09.
8. Add a $10 unlinked expense. Cash decreases by $10; supplier balance stays
   unchanged. Void that expense and check the cash restoration.
9. Import a $600 line of a $1,000 proforma with 10% discount and 15% IVA.
   The full snapshot remains $1,035; this project's attributed client total is
   $621. Import the $400 remainder; project client total becomes $1,035.

## Database boundaries

Use direct authenticated REST calls or SQL with role authenticated and JWT
claims, rather than relying on form controls. Roll back test transactions.

| Attempt as A | Expected |
| --- | --- |
| Read B's transactions/receivables/balance view | No rows |
| Insert with user_id B, or project owned by B | Rejected |
| Link another project's proforma, scope, execution or receivable | Rejected |
| Link a provider owned by B | Rejected |
| Link a scope/proforma inconsistent with the execution item | Rejected |
| Link a provider different from the execution's assigned provider | Rejected |
| Record an incoming provider payment/outgoing customer advance | Rejected |
| Link a non-customer movement to a receivable | Rejected |
| Insert a transaction already voided | Rejected |
| Edit amount/date/type/relations on an existing transaction | Rejected |
| Void without reason; void again; clear voided_at | Rejected |
| Update or void B's transaction | Zero affected rows |
| Delete financial records | Zero affected rows |
| Delete a project with financial records | Foreign key rejection |
| Set stored receivable status to paid without receiving money | Rejected |
| Insert into archived project or cancelled execution | Rejected |

Receivable settlement is exposed as effective_status in
project_receivable_balances. Stored status is pending or cancelled; payment
state is always derived from linked non-voided customer receipts.

Refunds affect cash as signed inflows/outflows but do not settle customer
receivables. Correct a wrongly recorded receipt by voiding it and entering the
correct receipt. Project-wide commercial margins and dashboard alerts belong
to Phase 5.
