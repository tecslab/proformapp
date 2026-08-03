import { buildDescriptionCellLines } from './pdf-table-utils'

describe('buildDescriptionCellLines', () => {
    const splitByWords = (text: string, maxWidth: number) => {
        const words = text.split(' ')
        const lines: string[] = []
        let current = ''

        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word
            if (current && candidate.length > maxWidth) {
                lines.push(current)
                current = word
            } else {
                current = candidate
            }
        }

        if (current) lines.push(current)
        return lines
    }

    it('reserves one table line for every wrapped comment line', () => {
        const result = buildDescriptionCellLines(
            'MESÓN TIPO ISLA ZONA BBQ',
            'elaborado en tablero melamínico, consta de módulo bajo con puertas y repisas para almacenaje, incluye iluminación',
            splitByWords,
        )

        expect(result.descriptionLines).toEqual(['MESÓN TIPO ISLA ZONA BBQ'])
        expect(result.commentLines.length).toBeGreaterThan(1)
        expect(result.cellLines).toEqual([
            ...result.descriptionLines,
            ...result.commentLines.map(() => ' '),
        ])
    })

    it('does not add placeholder lines when there is no comment', () => {
        const result = buildDescriptionCellLines('PERFORACIÓN DE MESÓN', null, splitByWords)

        expect(result.commentLines).toEqual([])
        expect(result.cellLines).toEqual(result.descriptionLines)
    })

    it('also reserves space when the description itself wraps', () => {
        const result = buildDescriptionCellLines(
            'A DESCRIPTION THAT NEEDS TO WRAP ACROSS MULTIPLE LINES BECAUSE IT IS LONG ENOUGH TO EXCEED THE DESCRIPTION COLUMN WIDTH IN THE PDF TABLE',
            'short comment',
            splitByWords,
        )

        expect(result.descriptionLines.length).toBeGreaterThan(1)
        expect(result.commentLines).toHaveLength(1)
        expect(result.cellLines).toHaveLength(result.descriptionLines.length + 1)
    })
})
