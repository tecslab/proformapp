import { z } from 'zod'

export const itemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
    unit: z.string().min(1, 'Unit is required'),
    unit_cost: z.coerce.number().min(0, 'Unit cost must be positive'),
    percentage_gain: z.coerce.number().min(0, 'Gain must be positive').default(0),
    // Calculated fields (for UI mostly, but validated if present)
    line_total: z.number().optional(),
})

export const proformaSchema = z.object({
    client_id: z.string().uuid('Please select a client'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date',
    }),
    iva_percentage: z.coerce.number().min(0).default(15),
    delivery_days: z.coerce.number().min(0).optional(),
    payment_methods: z.string().optional(),
    observations: z.string().optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
})

export type ItemFormData = z.infer<typeof itemSchema>
export type ProformaFormData = z.infer<typeof proformaSchema>
