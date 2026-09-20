# Phase 3 acceptance checks

Apply migrations through 20260919020000_create_project_execution.sql in a test environment.
Use two authenticated users A and B with their own projects, scope items and providers.
Use normal authenticated sessions, never the service-role key.

1. As A, split a $1,500 commercial item into Carpintería $720, Piedra $180,
   Herrajes $90 and Instalación $60. All four tasks must remain visible under
   the original item; committed amounts sum to $1,050. The commercial item
   must still show its original $1,500.
2. Add Transporte with no scope item and no provider. It appears under general costs.
3. Save an empty estimated cost and an explicit zero committed cost. The UI
   must show “Sin definir” and $0 respectively.
4. Edit a task's provider, costs, notes and status. Reload and verify persistence.
5. Cancel a task. It remains visible with cancelled status.
6. Through authenticated Supabase REST or SQL with role authenticated and the
   appropriate JWT claims, verify each database boundary below.

| Operation as A | Expected |
| --- | --- |
| Read B's execution tasks | No rows |
| Insert with user_id B | Rejected |
| Insert with A's user_id and B's project | Rejected |
| Insert/update with scope from a different project owned by A | Rejected |
| Insert/update with B's scope or provider | Rejected |
| Insert/update with archived project or scope | Rejected |
| Update B's execution task | Zero affected rows |
| Change A's task user_id to B | Rejected |
| Delete A's execution task | Zero affected rows (no DELETE policy) |

Run mutation checks in a transaction and roll back fixtures. These checks have
not been executed against the hosted Supabase database by the implementation agent.
