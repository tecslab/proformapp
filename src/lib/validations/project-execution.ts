import { z } from 'zod'

export const executionStatuses = ['planned', 'quoted', 'committed', 'in_progress', 'completed', 'cancelled'] as const
export const executionLabels: Record<typeof executionStatuses[number], string> = {
    planned: 'Planificada', quoted: 'Cotizada', committed: 'Comprometida',
    in_progress: 'En progreso', completed: 'Completada', cancelled: 'Cancelada',
}
const money = z.string().trim().refine(
    value => value === '' || /^\d{1,10}(\.\d{1,2})?$/.test(value),
    'Ingresa un monto positivo con hasta dos decimales'
)
export const executionSchema = z.object({
    project_id: z.string().uuid(),
    scope_item_id: z.string().uuid().or(z.literal('')),
    provider_id: z.string().uuid().or(z.literal('')),
    description: z.string().trim().min(1, 'Ingresa una descripción').max(500),
    category: z.string().trim().max(150),
    estimated_cost: money,
    committed_cost: money,
    status: z.enum(executionStatuses),
    notes: z.string().trim().max(2000),
})
export type ExecutionFormData = z.infer<typeof executionSchema>
