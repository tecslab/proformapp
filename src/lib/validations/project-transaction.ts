import { z } from 'zod'

export const transactionTypes = ['client_advance', 'client_partial_payment', 'client_balance', 'provider_advance', 'provider_payment', 'material_purchase', 'labor_payment', 'transport', 'refund', 'other'] as const
export const transactionLabels: Record<typeof transactionTypes[number], string> = {
    client_advance: 'Adelanto del cliente', client_partial_payment: 'Cobro parcial',
    client_balance: 'Saldo del cliente', provider_advance: 'Adelanto a proveedor',
    provider_payment: 'Pago a proveedor', material_purchase: 'Compra de materiales',
    labor_payment: 'Mano de obra', transport: 'Transporte', refund: 'Devolución', other: 'Otro',
}
export const clientTypes: readonly string[] = ['client_advance', 'client_partial_payment', 'client_balance']
export const outgoingTypes: readonly string[] = ['provider_advance', 'provider_payment', 'material_purchase', 'labor_payment', 'transport']
const optionalId = z.string().uuid().or(z.literal(''))
export const financialDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(value + 'T00:00:00Z')
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}, 'Fecha inválida')
export const positiveMoney = z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Usa hasta dos decimales').refine(value => Number(value) > 0, 'El monto debe ser mayor que cero')
export const transactionSchema = z.object({
    project_id: z.string().uuid(), project_proforma_id: optionalId, scope_item_id: optionalId,
    execution_item_id: optionalId, provider_id: optionalId, receivable_id: optionalId,
    direction: z.enum(['in', 'out']), type: z.enum(transactionTypes), amount: positiveMoney,
    transaction_date: financialDate, description: z.string().trim().min(1).max(500),
    payment_method: z.string().trim().max(100), notes: z.string().trim().max(2000),
}).superRefine((data, ctx) => {
    if ((clientTypes.includes(data.type) && data.direction !== 'in') || (outgoingTypes.includes(data.type) && data.direction !== 'out')) {
        ctx.addIssue({ code: 'custom', path: ['direction'], message: 'La dirección no corresponde al tipo de movimiento' })
    }
    if (data.receivable_id && !clientTypes.includes(data.type)) ctx.addIssue({ code: 'custom', path: ['receivable_id'], message: 'Solo un cobro de cliente puede liquidar un cobro esperado' })
    if (data.execution_item_id && data.direction !== 'out') ctx.addIssue({ code: 'custom', path: ['execution_item_id'], message: 'La partida solo admite pagos de salida' })
})
export const receivableSchema = z.object({
    project_id: z.string().uuid(), project_proforma_id: optionalId,
    description: z.string().trim().min(1).max(500), expected_amount: positiveMoney,
    due_date: financialDate.or(z.literal('')),
})
export const voidSchema = z.object({ id: z.string().uuid(), reason: z.string().trim().min(1, 'Indica el motivo').max(500) })
export type TransactionInput = z.infer<typeof transactionSchema>
export type ReceivableInput = z.infer<typeof receivableSchema>
