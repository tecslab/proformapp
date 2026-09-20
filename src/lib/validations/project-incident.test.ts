import { incidentSchema } from './project-incident'

const base = {
    project_id: '550e8400-e29b-41d4-a716-446655440000', title: 'Daño en instalación',
    description: '', incident_date: '2026-09-20', responsibility: 'under_review',
    estimated_cost: '', final_cost: '', billable_to_client: 'unknown', resolved: false, resolution_notes: '',
}
it('preserves unknown cost and billability separately from zero and no', () => {
    expect(incidentSchema.parse(base)).toMatchObject({ final_cost: '', billable_to_client: 'unknown' })
    expect(incidentSchema.parse({ ...base, final_cost: '0', billable_to_client: 'no' })).toMatchObject({ final_cost: '0', billable_to_client: 'no' })
})
it.each(['-1', 'NaN', '1.234', '10000000000'])('rejects invalid incident cost %s', final_cost => {
    expect(incidentSchema.safeParse({ ...base, final_cost }).success).toBe(false)
})
it('rejects impossible dates and blank titles', () => {
    expect(incidentSchema.safeParse({ ...base, incident_date: '2026-02-30' }).success).toBe(false)
    expect(incidentSchema.safeParse({ ...base, title: '   ' }).success).toBe(false)
})
it('accepts a resolved billable incident without adding commercial fields', () => {
    const result = incidentSchema.parse({ ...base, resolved: true, billable_to_client: 'yes', final_cost: '120.50', resolution_notes: 'Crear adicional', total: 1000 })
    expect(result).toMatchObject({ resolved: true, final_cost: '120.50' })
    expect(result).not.toHaveProperty('total')
})
