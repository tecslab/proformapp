import { proformaSchema, itemSchema } from './proforma'

describe('itemSchema', () => {
    it('validates a valid item', () => {
        const item = {
            description: 'Item 1',
            quantity: 10,
            unit: 'units',
            unit_cost: 5,
            percentage_gain: 20,
        }
        const result = itemSchema.safeParse(item)
        expect(result.success).toBe(true)
    })

    it('requires positive quantity', () => {
        const item = {
            description: 'Item 1',
            quantity: -5,
            unit: 'units',
            unit_cost: 5,
        }
        const result = itemSchema.safeParse(item)
        expect(result.success).toBe(false)
    })
})

describe('proformaSchema', () => {
    it('validates a valid proforma', () => {
        const proforma = {
            client_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
            date: '2023-01-01',
            items: [
                {
                    description: 'Item 1',
                    quantity: 1,
                    unit: 'u',
                    unit_cost: 100,
                },
            ],
            iva_percentage: 15,
        }
        const result = proformaSchema.safeParse(proforma)
        expect(result.success).toBe(true)
    })

    it('fails without items', () => {
        const proforma = {
            client_id: '123e4567-e89b-12d3-a456-426614174000',
            date: '2023-01-01',
            items: [],
            iva_percentage: 15,
        }
        const result = proformaSchema.safeParse(proforma)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.items).toBeDefined()
        }
    })
})
