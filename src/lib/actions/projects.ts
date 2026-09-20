'use server'

import { createClient } from '@/lib/supabase/server'
import {
    importProjectProformaSchema,
    projectSchema,
    type ImportProjectProformaData,
    type ProjectFormData,
} from '@/lib/validations/project'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function nullable(value?: string) {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

export async function getProjects(query = '', page = 1, pageSize = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], count: 0, error: 'No autorizado' }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    let dbQuery = supabase
        .from('projects')
        .select('*, clients(first_name, last_name, cedula_ruc)', { count: 'exact' })
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .range(start, end)

    if (query.trim()) {
        dbQuery = dbQuery.ilike('name', `%${query.trim()}%`)
    }

    const { data, count, error } = await dbQuery
    if (error) return { data: [], count: 0, error: error.message }

    return { data, count: count ?? 0, error: null }
}

export async function getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autorizado' }

    const { data, error } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .single()

    return error ? { data: null, error: error.message } : { data, error: null }
}

export async function getProjectClients() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'No autorizado' }

    const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, cedula_ruc')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('first_name')
        .order('last_name')

    return error ? { data: [], error: error.message } : { data, error: null }
}

export async function createProject(input: ProjectFormData) {
    const validation = projectSchema.safeParse(input)
    if (!validation.success) return { error: 'Datos inválidos', details: validation.error.flatten() }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const data = validation.data
    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', data.client_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

    if (!client) return { error: 'El cliente seleccionado no está disponible' }

    const { error } = await supabase.from('projects').insert({
        user_id: user.id,
        client_id: data.client_id,
        name: data.name,
        status: data.status,
        start_date: nullable(data.start_date),
        expected_end_date: nullable(data.expected_end_date),
        notes: nullable(data.notes),
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/projects')
    redirect('/dashboard/projects')
}

export async function updateProject(id: string, input: ProjectFormData) {
    const validation = projectSchema.safeParse(input)
    if (!validation.success) return { error: 'Datos inválidos', details: validation.error.flatten() }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const data = validation.data
    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', data.client_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

    if (!client) return { error: 'El cliente seleccionado no está disponible' }

    const { data: project, error } = await supabase
        .from('projects')
        .update({
            client_id: data.client_id,
            name: data.name,
            status: data.status,
            start_date: nullable(data.start_date),
            expected_end_date: nullable(data.expected_end_date),
            notes: nullable(data.notes),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .select('id')
        .maybeSingle()

    if (error) return { error: error.message }
    if (!project) return { error: 'Proyecto no encontrado' }

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)
    redirect(`/dashboard/projects/${id}`)
}

export async function archiveProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data, error } = await supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .select('id')
        .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { error: 'Proyecto no encontrado' }

    revalidatePath('/dashboard/projects')
    return { error: null }
}

export async function getImportableProformas(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'No autorizado' }

    const { data: project } = await supabase
        .from('projects')
        .select('id, client_id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .maybeSingle()

    if (!project) return { data: [], error: 'Proyecto no encontrado' }

    const [{ data: importedItems, error: importedError }, { data: proformas, error: proformasError }] = await Promise.all([
        supabase
            .from('project_scope_items')
            .select('source_item_id')
            .eq('project_id', projectId)
            .eq('user_id', user.id),
        supabase
            .from('proformas')
            .select('id, proforma_number, date, subtotal, descuento, iva_amount, total, items(*)')
            .eq('user_id', user.id)
            .eq('client_id', project.client_id)
            .eq('status', 'finalized')
            .order('proforma_number', { ascending: false })
            .order('position', { referencedTable: 'items', ascending: true }),
    ])

    if (importedError) return { data: [], error: importedError.message }
    if (proformasError) return { data: [], error: proformasError.message }

    const importedIds = new Set((importedItems ?? []).map((item) => item.source_item_id))
    const available = (proformas ?? [])
        .map((proforma) => ({
            ...proforma,
            items: proforma.items.filter((item) => !importedIds.has(item.id)),
        }))
        .filter((proforma) => proforma.items.length > 0)

    return { data: available, error: null }
}

export async function getProjectScope(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'No autorizado' }

    const { data, error } = await supabase
        .from('project_proformas')
        .select(`
            *,
            proformas(proforma_number, date),
            project_scope_items(*)
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .order('position', { referencedTable: 'project_scope_items', ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
}

export async function importProjectProforma(input: ImportProjectProformaData) {
    const validation = importProjectProformaSchema.safeParse(input)
    if (!validation.success) return { error: 'Datos de importación inválidos', details: validation.error.flatten() }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const data = validation.data
    const { data: result, error } = await supabase.rpc('import_proforma_items_to_project', {
        p_project_id: data.project_id,
        p_proforma_id: data.proforma_id,
        p_item_ids: data.item_ids,
        p_relation_type: data.relation_type,
    })

    if (error) {
        const knownMessages: Record<string, string> = {
            '23505': 'Uno o más ítems ya fueron importados.',
            '23514': 'La proforma debe estar finalizada y pertenecer al mismo cliente.',
            'P0002': 'No se encontró el proyecto o la proforma.',
            '42501': 'No tienes autorización para realizar esta importación.',
        }
        return { error: knownMessages[error.code] ?? error.message }
    }

    revalidatePath(`/dashboard/projects/${data.project_id}`)
    revalidatePath('/dashboard/projects')
    return { data: result, error: null }
}
