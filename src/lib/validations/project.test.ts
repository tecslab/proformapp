import { importProjectProformaSchema, projectSchema } from './project'

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

describe('importProjectProformaSchema', () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000'
    const proformaId = '550e8400-e29b-41d4-a716-446655440001'
    const itemId = '550e8400-e29b-41d4-a716-446655440002'

    it('accepts a partial item selection', () => {
        expect(importProjectProformaSchema.safeParse({
            project_id: projectId,
            proforma_id: proformaId,
            item_ids: [itemId],
            relation_type: 'initial',
        }).success).toBe(true)
    })

    it('rejects an empty selection', () => {
        expect(importProjectProformaSchema.safeParse({
            project_id: projectId,
            proforma_id: proformaId,
            item_ids: [],
            relation_type: 'initial',
        }).success).toBe(false)
    })

    it('rejects duplicate items', () => {
        expect(importProjectProformaSchema.safeParse({
            project_id: projectId,
            proforma_id: proformaId,
            item_ids: [itemId, itemId],
            relation_type: 'additional',
        }).success).toBe(false)
    })
})
