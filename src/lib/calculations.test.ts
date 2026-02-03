import { numberToWordsEs, calculateItemDetails } from './calculations'

describe('numberToWordsEs', () => {
    it('converts integers correctly', () => {
        expect(numberToWordsEs(100)).toContain('CIEN DÓLARES')
        expect(numberToWordsEs(123)).toContain('CIENTO VEINTE Y TRES DÓLARES')
        expect(numberToWordsEs(1500)).toContain('MIL QUINIENTOS DÓLARES')
    })

    it('converts decimals correctly', () => {
        expect(numberToWordsEs(10.50)).toContain('CON 50/100 CENTAVOS')
        expect(numberToWordsEs(10.05)).toContain('CON 5/100 CENTAVOS')
    })

    it('handles zero', () => {
        expect(numberToWordsEs(0)).toContain('CERO DÓLARES')
    })

    it('handles large numbers (millions)', () => {
        expect(numberToWordsEs(1000000)).toContain('UN MILLÓN DÓLARES')
        expect(numberToWordsEs(2500000)).toContain('DOS MILLONES QUINIENTOS MIL DÓLARES')
    })
})

describe('calculateItemDetails', () => {
    it('calculates totals correctly with 0% gain', () => {
        const result = calculateItemDetails(100, 0, 2)
        expect(result.earned).toBe(0)
        expect(result.unitPrice).toBe(100)
        expect(result.lineTotal).toBe(200)
    })

    it('calculates totals correctly with 20% gain', () => {
        const result = calculateItemDetails(100, 20, 1)
        expect(result.earned).toBe(20) // 20% of 100
        expect(result.unitPrice).toBe(120)
        expect(result.lineTotal).toBe(120)
    })

    it('calculates totals correctly with quantity > 1', () => {
        const result = calculateItemDetails(10, 50, 5)
        // Cost 10, Gain 50% -> Earned 5 -> Price 15
        expect(result.earned).toBe(5)
        expect(result.unitPrice).toBe(15)
        expect(result.lineTotal).toBe(75) // 15 * 5
    })

    it('handles floating point precision gracefully', () => {
        // Javascript floating point math: 0.1 + 0.2 != 0.3 usually
        // But our function returns raw numbers, formatting happens in UI/PDF
        const result = calculateItemDetails(10.33, 10, 1)
        expect(result.earned).toBeCloseTo(1.033)
        expect(result.unitPrice).toBeCloseTo(11.363)
    })
})
