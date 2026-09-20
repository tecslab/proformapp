# Phase 6 acceptance

Apply 20260920020000_create_project_incidents.sql after Phase 5.
Live database/RLS checks remain pending in Supabase.

1. Create an incident with unknown costs and unknown billability. Reload: these
   remain unknown, distinct from zero cost and not billable.
2. Edit responsibility, costs and notes; resolve the incident, then filter by
   pending/resolved. Reopen it if needed; the resolution notes remain editable.
3. Set billable to yes. Open Create additional proforma: project client,
   incident title and final cost (or estimated cost when final is unknown) are
   prefilled. Review the proposed cost and gain, save as draft, finalize it,
   then return to the project and import as additional scope.
4. Changing costs or billability, resolving an incident, and saving a draft
   proforma must not change project sales, commitments, payments or cash.
   Only importing the finalized proforma changes commercial scope.
5. As user B, directly request A's incident URL in the new-proforma flow:
   expect 404. Also test a nonbillable incident and an archived project.
6. Through authenticated REST/SQL as A, verify: selecting B's incidents yields
   no rows; inserting with B's user_id/project is rejected; updating B's row
   affects zero rows; switching ownership to B is rejected; writes referencing
   an archived project are rejected; deleting incidents affects zero rows.

The additional-proforma shortcut provides context, not automatic billing or a
one-to-one invoice link. Multiple proformas may be created if required. Users
review, finalize, and import them through the existing proforma workflow.
