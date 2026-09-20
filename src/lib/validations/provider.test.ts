import { providerSchema } from './provider'

describe('providerSchema', () => {
    it('accepts a valid provider', () => {
        expect(providerSchema.safeParse({
            name: 'Darío',
            type: 'master',
            specialty: 'Carpintería',
            cedula_ruc: '0912345678',
            phone: '',
            email: '',
            address: '',
            notes: '',
            active: true,
        }).success).toBe(true)
    })

    it('rejects invalid identification numbers', () => {
        const result = providerSchema.safeParse({
            name: 'Proveedor X',
            type: 'supplier',
            cedula_ruc: '123',
            active: true,
        })
        expect(result.success).toBe(false)
    })
})
