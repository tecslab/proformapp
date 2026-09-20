import { transactionSchema, receivableSchema, voidSchema } from './project-transaction'

const id = '550e8400-e29b-41d4-a716-446655440000'
const base = {
    project_id: id, project_proforma_id: '', scope_item_id: '', execution_item_id: '',
    provider_id: '', receivable_id: '', direction: 'in', type: 'client_advance',
    amount: '700.09', transaction_date: '2026-09-20', description: 'Adelanto',
    payment_method: '', notes: '',
}
describe('financial input validation', () => {
    it('accepts a customer advance tied to a receivable', () => {
        expect(transactionSchema.safeParse({ ...base, receivable_id: id }).success).toBe(true)
    })
    it.each(['0', '-1', '1.001', 'NaN', 'Infinity', '1e2', '10000000000'])('rejects invalid amount %s', amount => {
        expect(transactionSchema.safeParse({ ...base, amount }).success).toBe(false)
    })
    it('rejects impossible dates and mismatched directions', () => {
        expect(transactionSchema.safeParse({ ...base, transaction_date: '2026-02-30' }).success).toBe(false)
        expect(transactionSchema.safeParse({ ...base, direction: 'out' }).success).toBe(false)
        expect(transactionSchema.safeParse({ ...base, type: 'provider_payment' }).success).toBe(false)
    })
    it('rejects receipts linked to execution and unrelated movements settling receivables', () => {
        expect(transactionSchema.safeParse({ ...base, execution_item_id: id }).success).toBe(false)
        expect(transactionSchema.safeParse({ ...base, type: 'other', receivable_id: id }).success).toBe(false)
    })
    it('requires a nonblank void reason', () => {
        expect(voidSchema.safeParse({ id, reason: '   ' }).success).toBe(false)
    })
    it('allows an undated expected collection', () => {
        expect(receivableSchema.safeParse({ project_id: id, project_proforma_id: '', description: 'Adelanto acordado', expected_amount: '300', due_date: '' }).success).toBe(true)
    })
})
