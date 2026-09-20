'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { receivableSchema, transactionSchema, voidSchema, type ReceivableInput, type TransactionInput } from '@/lib/validations/project-transaction'
import type { Database, TransactionRow } from '@/lib/types/database'

export async function getProjectFinances(projectId: string) {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { transactions: [], receivables: [], error: 'No autorizado' }
    const transactions: TransactionRow[] = []
    const receivables: Database['public']['Views']['project_receivable_balances']['Row'][] = []
    // Explicit paging avoids silently calculating balances from Supabase's first 1,000 rows.
    for (let start = 0; ; start += 500) {
        const { data, error } = await db.from('project_transactions').select('*').eq('project_id', projectId)
            .eq('user_id', user.id).order('transaction_date', { ascending: false }).order('id').range(start, start + 499)
        if (error) return { transactions: [], receivables: [], error: error.message }
        transactions.push(...data)
        if (data.length < 500) break
    }
    for (let start = 0; ; start += 500) {
        const { data, error } = await db.from('project_receivable_balances').select('*').eq('project_id', projectId)
            .eq('user_id', user.id).order('created_at').order('id').range(start, start + 499)
        if (error) return { transactions: [], receivables: [], error: error.message }
        receivables.push(...data)
        if (data.length < 500) break
    }
    return { transactions, receivables, error: null }
}

export async function recordProjectTransaction(input: TransactionInput) {
    const parsed = transactionSchema.safeParse(input)
    if (!parsed.success) return { error: 'Revisa los datos del movimiento' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const v = parsed.data
    const { error } = await db.from('project_transactions').insert({
        ...v, amount: Number(v.amount), user_id: user.id,
        project_proforma_id: v.project_proforma_id || null, scope_item_id: v.scope_item_id || null,
        execution_item_id: v.execution_item_id || null, provider_id: v.provider_id || null, receivable_id: v.receivable_id || null,
        payment_method: v.payment_method || null, notes: v.notes || null,
    })
    if (error) return { error: 'No se pudo registrar el movimiento. Verifica las relaciones y que el proyecto esté activo.' }
    revalidatePath('/dashboard/projects/' + v.project_id)
    revalidatePath('/dashboard/projects')
    return { error: null }
}

export async function createProjectReceivable(input: ReceivableInput) {
    const parsed = receivableSchema.safeParse(input)
    if (!parsed.success) return { error: 'Revisa los datos del cobro esperado' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const v = parsed.data
    const { error } = await db.from('project_receivables').insert({
        ...v, user_id: user.id, expected_amount: Number(v.expected_amount),
        project_proforma_id: v.project_proforma_id || null, due_date: v.due_date || null,
    })
    if (error) return { error: 'No se pudo registrar el cobro esperado' }
    revalidatePath('/dashboard/projects/' + v.project_id)
    revalidatePath('/dashboard/projects')
    return { error: null }
}

export async function voidProjectTransaction(input: { id: string; reason: string }) {
    const parsed = voidSchema.safeParse(input)
    if (!parsed.success) return { error: 'Indica un motivo de anulación' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const { data, error } = await db.from('project_transactions')
        .update({ voided_at: new Date().toISOString(), void_reason: parsed.data.reason })
        .eq('id', parsed.data.id).eq('user_id', user.id).is('voided_at', null).select('project_id').maybeSingle()
    if (error || !data) return { error: 'No se pudo anular el movimiento; puede estar anulado o no disponible' }
    revalidatePath('/dashboard/projects/' + data.project_id)
    revalidatePath('/dashboard/projects')
    return { error: null }
}

export async function cancelProjectReceivable(id: string) {
    if (!z.string().uuid().safeParse(id).success) return { error: 'Identificador inválido' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const { data, error } = await db.from('project_receivables').update({ status: 'cancelled' })
        .eq('id', id).eq('user_id', user.id).neq('status', 'cancelled').select('project_id').maybeSingle()
    if (error || !data) return { error: 'No se pudo cancelar el cobro esperado' }
    revalidatePath('/dashboard/projects/' + data.project_id)
    revalidatePath('/dashboard/projects')
    return { error: null }
}
