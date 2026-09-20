import { z } from 'zod'
import { financialDate } from './project-transaction'

export const responsibilities = ['under_review', 'client', 'provider', 'company', 'shared', 'not_applicable'] as const
export const responsibilityLabels: Record<typeof responsibilities[number], string> = {
    under_review: 'En revisión', client: 'Cliente', provider: 'Proveedor',
    company: 'Empresa', shared: 'Compartida', not_applicable: 'No aplica',
}
const optionalCost = z.string().trim().refine(
    value => value === '' || /^\d{1,10}(\.\d{1,2})?$/.test(value),
    'Usa un monto no negativo con hasta dos decimales'
)
export const incidentSchema = z.object({
    project_id: z.string().uuid(), title: z.string().trim().min(1, 'Indica un título').max(200),
    description: z.string().trim().max(4000), incident_date: financialDate,
    responsibility: z.enum(responsibilities), estimated_cost: optionalCost, final_cost: optionalCost,
    billable_to_client: z.enum(['unknown', 'yes', 'no']),
    resolved: z.boolean(), resolution_notes: z.string().trim().max(4000),
})
export type IncidentInput = z.infer<typeof incidentSchema>
