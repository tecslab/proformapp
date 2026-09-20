'use server'

import { createClient } from '@/lib/supabase/server'
import { projectSchema, type ProjectFormData } from '@/lib/validations/project'
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
