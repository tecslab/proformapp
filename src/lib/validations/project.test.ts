import { projectSchema } from './project'

describe('projectSchema', () => {
    const validProject = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Proyecto Todos Santos',
        status: 'draft' as const,
        start_date: '2026-09-19',
        expected_end_date: '2026-10-19',
        notes: '',
    }

    it('accepts a valid project', () => {
        expect(projectSchema.safeParse(validProject).success).toBe(true)
    })

    it('rejects an end date before the start date', () => {
        const result = projectSchema.safeParse({
            ...validProject,
            expected_end_date: '2026-09-18',
        })

        expect(result.success).toBe(false)
    })

    it('rejects unsupported statuses', () => {
        const result = projectSchema.safeParse({ ...validProject, status: 'unknown' })
        expect(result.success).toBe(false)
    })
})
