import { clientSchema } from './client'

describe('clientSchema', () => {
    it('validates a correct client', () => {
        const validClient = {
            first_name: 'John',
            last_name: 'Doe',
            cedula_ruc: '1234567890',
            email: 'john@example.com',
        }
        const result = clientSchema.safeParse(validClient)
        expect(result.success).toBe(true)
    })

    it('fails if required fields are missing', () => {
        const invalidClient = {
            cedula_ruc: '1234567890',
        }
        const result = clientSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            expect(errors.first_name).toBeDefined()
            expect(errors.last_name).toBeDefined()
        }
    })

    it('validates cedula_ruc length', () => {
        const shortRuc = {
            first_name: 'John',
            last_name: 'Doe',
            cedula_ruc: '123', // Too short
        }
        const result = clientSchema.safeParse(shortRuc)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.cedula_ruc).toBeDefined()
        }
    })

    it('allows empty email', () => {
        const clientWithEmptyEmail = {
            first_name: 'John',
            last_name: 'Doe',
            cedula_ruc: '1234567890',
            email: '',
        }
        const result = clientSchema.safeParse(clientWithEmptyEmail)
        expect(result.success).toBe(true)
    })
})
