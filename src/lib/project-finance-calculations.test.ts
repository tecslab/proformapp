import { calculateCashBalances, executionPaymentBalance, importedClientTotal } from './project-finance-calculations'

const commitment = { id: 'paul', committed_cost: 1020, status: 'committed', archived_at: null }
const receipt = { amount: 700.09, direction: 'in', type: 'client_advance', execution_item_id: null, voided_at: null }
const payment = { amount: 510, direction: 'out', type: 'provider_payment', execution_item_id: 'paul', voided_at: null }

describe('project cash and balances', () => {
    it('matches Todos Santos without treating cash as margin', () => {
        expect(calculateCashBalances(1400, [receipt, payment], [commitment])).toEqual({
            collected: 700.09, paid: 510, cash: 190.09, clientBalance: 699.91, supplierBalance: 510,
        })
        expect(executionPaymentBalance(commitment, [payment])).toEqual({ paid: 510, balance: 510 })
    })
    it('matches Vero: equal receipts and payments leave zero cash', () => {
        expect(calculateCashBalances(120, [{ ...receipt, amount: 45 }, { ...payment, amount: 45 }], [])).toMatchObject({
            cash: 0, clientBalance: 75,
        })
    })
    it('matches Anois: a promise to collect does not count as a transaction', () => {
        expect(calculateCashBalances(623.74, [], [])).toEqual({
            collected: 0, paid: 0, cash: 0, clientBalance: 623.74, supplierBalance: 0,
        })
    })
    it('ignores voided records and does not subtract unlinked expenses from supplier balances', () => {
        expect(calculateCashBalances(1400, [
            receipt, { ...payment, voided_at: '2026-09-20T00:00:00Z' },
            { ...payment, execution_item_id: null, amount: 10 },
        ], [commitment])).toMatchObject({ paid: 10, cash: 690.09, supplierBalance: 1020 })
    })
    it('does not count other inflows as customer collections', () => {
        expect(calculateCashBalances(100, [{ ...receipt, type: 'refund', amount: 20 }], [])).toMatchObject({
            collected: 0, cash: 20, clientBalance: 100,
        })
    })
    it('does not net one supplier overpayment against another supplier obligation', () => {
        expect(calculateCashBalances(100, [{ ...payment, amount: 1100 }], [
            commitment, { ...commitment, id: 'other', committed_cost: 100 },
        ]).supplierBalance).toBe(100)
    })
    it('excludes cancelled commitments but retains their actual payments', () => {
        expect(calculateCashBalances(100, [payment], [{ ...commitment, status: 'cancelled' }]))
            .toMatchObject({ supplierBalance: 0, paid: 510, cash: -510 })
    })
    it('distinguishes an unknown commitment from a zero commitment', () => {
        expect(executionPaymentBalance({ ...commitment, committed_cost: null }, []).balance).toBeNull()
        expect(executionPaymentBalance({ ...commitment, committed_cost: 0 }, []).balance).toBe(0)
    })
})

describe('Strategy B reporting of imported client totals', () => {
    const snapshot = { subtotal_snapshot: 1000, total_snapshot: 1035 }
    it('preserves the full discounted and taxed total when all items are imported', () => {
        expect(importedClientTotal([{ ...snapshot, project_scope_items: [{ quoted_line_total: 600 }, { quoted_line_total: 400 }] }])).toBe(1035)
    })
    it('only attributes the selected share when an import is partial', () => {
        expect(importedClientTotal([{ ...snapshot, project_scope_items: [{ quoted_line_total: 600 }] }])).toBe(621)
    })
    it('handles free scope without division by zero', () => {
        expect(importedClientTotal([{ subtotal_snapshot: 0, total_snapshot: 0, project_scope_items: [{ quoted_line_total: 0 }] }])).toBe(0)
    })
})
