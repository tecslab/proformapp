import { z } from 'zod'

export const clientSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    cedula_ruc: z.string().regex(/^\d{10}(\d{3})?$/, 'Must be 10 or 13 digits'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
})

export type ClientFormData = z.infer<typeof clientSchema>
