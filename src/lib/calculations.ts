
// Helper for number to words (Simplified Spanish)
export function numberToWordsEs(number: number): string {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
    const diez_veinte = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

    function convertGroup(n: number): string {
        let output = ''
        if (n === 100) return 'CIEN'

        if (n >= 100) {
            output += centenas[Math.floor(n / 100)]
            n %= 100
            if (n > 0) output += ' '
        }

        if (n >= 10 && n <= 19) {
            output += diez_veinte[n - 10]
            return output
        } else if (n >= 20) {
            output += decenas[Math.floor(n / 10)]
            n %= 10
            if (n > 0) output += ' Y '
        }

        if (n > 0) {
            output += unidades[n]
        }
        return output
    }

    const integerPart = Math.floor(number)
    const decimalPart = Math.round((number - integerPart) * 100)

    let words = ''

    if (integerPart === 0) words = 'CERO'
    else if (integerPart >= 1000000) {
        const millions = Math.floor(integerPart / 1000000)
        const remainder = integerPart % 1000000
        if (millions === 1) words += 'UN MILLÓN '
        else words += convertGroup(millions) + ' MILLONES '

        if (remainder > 0) {
            if (remainder >= 1000) {
                const thousands = Math.floor(remainder / 1000)
                const rest = remainder % 1000
                if (thousands === 1) words += 'MIL '
                else words += convertGroup(thousands) + ' MIL '
                if (rest > 0) words += convertGroup(rest)
            } else {
                words += convertGroup(remainder)
            }
        }
    } else if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000)
        const rest = integerPart % 1000
        if (thousands === 1) words += 'MIL '
        else words += convertGroup(thousands) + ' MIL '
        if (rest > 0) words += convertGroup(rest)
    } else {
        words += convertGroup(integerPart)
    }

    return `${words.trim()} DÓLARES AMERICANOS CON ${decimalPart}/100 CENTAVOS`
}

export interface ItemCalculation {
    earned: number
    unitPrice: number
    lineTotal: number
}

/**
 * Calculates the financial details for a single line item.
 * @param unitCost The base cost of the item
 * @param percentageGain The profit margin percentage (0-100)
 * @param quantity The number of items
 */
export function calculateItemDetails(unitCost: number, percentageGain: number, quantity: number): ItemCalculation {
    const earned = unitCost * (percentageGain / 100)
    const unitPrice = unitCost + earned
    const lineTotal = unitPrice * quantity
    return {
        earned,
        unitPrice,
        lineTotal
    }
}
