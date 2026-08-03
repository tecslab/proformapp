const DESCRIPTION_COLUMN_WIDTH = 110

type TextSplitter = (text: string, maxWidth: number) => string[]

/**
 * Builds the lines needed by the description cell. Comment lines are blank in
 * the table data so AutoTable reserves their height; they are painted in gray
 * by the cell callback in the PDF generator.
 */
export function buildDescriptionCellLines(
    description: string,
    comment: string | null | undefined,
    splitTextToSize: TextSplitter,
): { cellLines: string[]; descriptionLines: string[]; commentLines: string[] } {
    const descriptionLines = splitTextToSize(description, DESCRIPTION_COLUMN_WIDTH)
    const commentLines = comment ? splitTextToSize(comment, DESCRIPTION_COLUMN_WIDTH) : []

    return {
        descriptionLines,
        commentLines,
        cellLines: [...descriptionLines, ...commentLines.map(() => ' ')],
    }
}
