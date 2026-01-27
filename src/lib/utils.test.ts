import { cn } from './utils'

describe('cn utility', () => {
    it('merges class names correctly', () => {
        const result = cn('bg-red-500', 'text-white')
        expect(result).toBe('bg-red-500 text-white')
    })

    it('handles conditional classes', () => {
        const result = cn('bg-red-500', false && 'text-white', 'p-4')
        expect(result).toBe('bg-red-500 p-4')
    })

    it('merges tailwind classes (overrides)', () => {
        // tailwind-merge should ensure p-4 overrides p-2 if they conflict
        const result = cn('p-2', 'p-4')
        expect(result).toBe('p-4')
    })
})
