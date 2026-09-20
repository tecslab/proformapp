'use server'

import { createClient } from '@/lib/supabase/server'
import { executionSchema, type ExecutionFormData } from '@/lib/validations/project-execution'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getExecution(projectId: string) {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { items: [], providers: [], error: 'No autorizado' }
    const [items, providers] = await Promise.all([
        db.from('project_execution_items').select('*').eq('user_id', user.id)
            .eq('project_id', projectId).is('archived_at', null).order('created_at'),
        db.from('providers').select('*').eq('user_id', user.id).order('name'),
    ])
    return { items: items.data ?? [], providers: providers.data ?? [], error: items.error?.message ?? providers.error?.message }
}

export async function saveExecution(input: ExecutionFormData, id?: string) {
    const parsed = executionSchema.safeParse(input)
    if (!parsed.success || (id !== undefined && !z.string().uuid().safeParse(id).success)) return { error: 'Datos inválidos' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const value = parsed.data
    // RLS validates project ownership and scope/provider relationships atomically.
    const record = {
        user_id: user.id, project_id: value.project_id,
        scope_item_id: value.scope_item_id || null, provider_id: value.provider_id || null,
        description: value.description, category: value.category || null,
        estimated_cost: value.estimated_cost === '' ? null : Number(value.estimated_cost),
        committed_cost: value.committed_cost === '' ? null : Number(value.committed_cost),
        status: value.status, notes: value.notes || null,
    }
    const query = id
        ? db.from('project_execution_items').update(record).eq('id', id).eq('user_id', user.id)
            .eq('project_id', value.project_id).is('archived_at', null)
        : db.from('project_execution_items').insert(record)
    const { data, error } = await query.select('id').maybeSingle()
    if (error || !data) return { error: 'No se pudo guardar. Verifica el proyecto, alcance y proveedor seleccionados.' }
    revalidatePath('/dashboard/projects/' + value.project_id)
    revalidatePath('/dashboard/projects')
    return { error: null }
}
