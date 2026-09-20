import { z } from 'zod'

export const PROJECT_STATUSES = [
    'draft',
    'waiting_advance',
    'approved',
    'in_progress',
    'waiting_client',
    'waiting_supplier',
    'finishing',
    'pending_collection',
    'completed',
    'paused',
    'cancelled',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    draft: 'Borrador',
    waiting_advance: 'Esperando adelanto',
    approved: 'Aprobado',
    in_progress: 'En progreso',
    waiting_client: 'Esperando al cliente',
    waiting_supplier: 'Esperando proveedor',
    finishing: 'Finalizando',
    pending_collection: 'Cobro pendiente',
    completed: 'Completado',
    paused: 'Pausado',
    cancelled: 'Cancelado',
}

export const projectSchema = z.object({
    client_id: z.string().uuid('Selecciona un cliente válido'),
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
    status: z.enum(PROJECT_STATUSES),
    start_date: z.string().optional(),
    expected_end_date: z.string().optional(),
    notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
}).superRefine((data, context) => {
    if (data.start_date && data.expected_end_date && data.expected_end_date < data.start_date) {
        context.addIssue({
            code: 'custom',
            path: ['expected_end_date'],
            message: 'La fecha final no puede ser anterior a la fecha inicial',
        })
    }
})

export type ProjectFormData = z.infer<typeof projectSchema>

export const PROJECT_PROFORMA_RELATION_TYPES = ['initial', 'additional'] as const

export const PROJECT_PROFORMA_RELATION_LABELS: Record<(typeof PROJECT_PROFORMA_RELATION_TYPES)[number], string> = {
    initial: 'Alcance inicial',
    additional: 'Alcance adicional',
}

export const importProjectProformaSchema = z.object({
    project_id: z.string().uuid('Proyecto inválido'),
    proforma_id: z.string().uuid('Proforma inválida'),
    item_ids: z.array(z.string().uuid('Ítem inválido')).min(1, 'Selecciona al menos un ítem'),
    relation_type: z.enum(PROJECT_PROFORMA_RELATION_TYPES),
}).superRefine((data, context) => {
    if (new Set(data.item_ids).size !== data.item_ids.length) {
        context.addIssue({
            code: 'custom',
            path: ['item_ids'],
            message: 'La selección contiene ítems duplicados',
        })
    }
})

export type ImportProjectProformaData = z.infer<typeof importProjectProformaSchema>
