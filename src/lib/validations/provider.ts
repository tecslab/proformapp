import { z } from 'zod'

export const PROVIDER_TYPES = ['supplier', 'master', 'contractor', 'service', 'other'] as const

export type ProviderType = (typeof PROVIDER_TYPES)[number]

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
    supplier: 'Proveedor',
    master: 'Maestro',
    contractor: 'Contratista',
    service: 'Servicio',
    other: 'Otro',
}

export const providerSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
    type: z.enum(PROVIDER_TYPES),
    specialty: z.string().trim().max(150, 'Máximo 150 caracteres').optional(),
    cedula_ruc: z.string().trim().refine(
        (value) => value === '' || /^\d{10}(\d{3})?$/.test(value),
        'Debe tener 10 o 13 dígitos'
    ).optional(),
    phone: z.string().trim().max(30, 'Máximo 30 caracteres').optional(),
    email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
    address: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
    notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
    active: z.boolean(),
})

export type ProviderFormData = z.infer<typeof providerSchema>
