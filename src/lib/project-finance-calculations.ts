import { clientTypes } from '@/lib/validations/project-transaction'

type Movement = { amount: number; direction: string; type: string; voided_at: string | null; execution_item_id: string | null }
type Commitment = { id: string; committed_cost: number | null; status: string; archived_at: string | null }
export const cents = (amount: number) => Math.round(amount * 100)
export function executionPaymentBalance(item: Commitment, movements: Movement[]) {
    const paid = movements.filter(t => !t.voided_at && t.direction === 'out' && t.execution_item_id === item.id)
        .reduce((sum, t) => sum + cents(t.amount), 0)
    return { paid: paid / 100, balance: item.committed_cost === null ? null : (cents(item.committed_cost) - paid) / 100 }
}

export function calculateCashBalances(totalDue: number, movements: Movement[], commitments: Commitment[]) {
    const active = movements.filter(t => !t.voided_at)
    const inflows = active.filter(t => t.direction === 'in').reduce((sum, t) => sum + cents(t.amount), 0)
    const outflows = active.filter(t => t.direction === 'out').reduce((sum, t) => sum + cents(t.amount), 0)
    const collected = active.filter(t => t.direction === 'in' && clientTypes.includes(t.type)).reduce((sum, t) => sum + cents(t.amount), 0)
    const supplierBalance = commitments.filter(e => !e.archived_at && e.status !== 'cancelled' && e.committed_cost !== null)
        .reduce((sum, e) => sum + Math.max(0, cents(executionPaymentBalance(e, active).balance ?? 0)), 0)
    return { collected: collected / 100, paid: outflows / 100, cash: (inflows - outflows) / 100,
        clientBalance: (cents(totalDue) - collected) / 100, supplierBalance: supplierBalance / 100 }
}

// Allocate only at reporting time. Full proforma totals remain immutable snapshots.
export function importedClientTotal(entries: {
    subtotal_snapshot: number; total_snapshot: number;
    project_scope_items: { quoted_line_total: number }[]
}[]) {
    return entries.reduce((sum, entry) => {
        const original = cents(entry.subtotal_snapshot)
        const imported = entry.project_scope_items.reduce((amount, item) => amount + cents(item.quoted_line_total), 0)
        return sum + (original === 0 ? 0 : Math.round(cents(entry.total_snapshot) * imported / original))
    }, 0) / 100
}
