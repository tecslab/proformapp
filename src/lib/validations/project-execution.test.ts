import { executionSchema } from './project-execution'

const base = {
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    scope_item_id: '', provider_id: '', description: 'Transporte', category: '',
    estimated_cost: '', committed_cost: '', status: 'planned', notes: '',
}

describe('execution cost validation', () => {
    it('preserves unknown costs separately from zero and permits general costs', () => {
        expect(executionSchema.parse(base).committed_cost).toBe('')
        expect(executionSchema.parse({ ...base, committed_cost: '0' }).committed_cost).toBe('0')
        expect(executionSchema.parse({ ...base, committed_cost: '1020.09' }).committed_cost).toBe('1020.09')
    })
    it.each(['-1', '1.001', 'Infinity', 'NaN', '1e5', '10000000000'])('rejects invalid monetary value %s', value => {
        expect(executionSchema.safeParse({ ...base, estimated_cost: value }).success).toBe(false)
    })
    it('rejects malformed relationship identifiers and empty descriptions', () => {
        expect(executionSchema.safeParse({ ...base, scope_item_id: 'foreign-id' }).success).toBe(false)
        expect(executionSchema.safeParse({ ...base, description: '   ' }).success).toBe(false)
    })
})
