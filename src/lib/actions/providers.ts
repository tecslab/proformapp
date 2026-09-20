'use server'

import { createClient } from '@/lib/supabase/server'
import { providerSchema, type ProviderFormData } from '@/lib/validations/provider'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function nullable(value?: string) {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

export async function getProviders(query = '', page = 1, pageSize = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], count: 0, error: 'No autorizado' }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    let dbQuery = supabase
        .from('providers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name')
        .range(start, end)

    if (query.trim()) dbQuery = dbQuery.ilike('name', `%${query.trim()}%`)

    const { data, count, error } = await dbQuery
    if (error) return { data: [], count: 0, error: error.message }
    return { data, count: count ?? 0, error: null }
}

export async function getProvider(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autorizado' }

    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    return error ? { data: null, error: error.message } : { data, error: null }
}

export async function createProvider(input: ProviderFormData) {
    const validation = providerSchema.safeParse(input)
    if (!validation.success) return { error: 'Datos inválidos', details: validation.error.flatten() }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const data = validation.data
    const { error } = await supabase.from('providers').insert({
        user_id: user.id,
        name: data.name,
        type: data.type,
        specialty: nullable(data.specialty),
        cedula_ruc: nullable(data.cedula_ruc),
        phone: nullable(data.phone),
        email: nullable(data.email),
        address: nullable(data.address),
        notes: nullable(data.notes),
        active: data.active,
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/providers')
    redirect('/dashboard/providers')
}

export async function updateProvider(id: string, input: ProviderFormData) {
    const validation = providerSchema.safeParse(input)
    if (!validation.success) return { error: 'Datos inválidos', details: validation.error.flatten() }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const data = validation.data
    const { data: provider, error } = await supabase
        .from('providers')
        .update({
            name: data.name,
            type: data.type,
            specialty: nullable(data.specialty),
            cedula_ruc: nullable(data.cedula_ruc),
            phone: nullable(data.phone),
            email: nullable(data.email),
            address: nullable(data.address),
            notes: nullable(data.notes),
            active: data.active,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()

    if (error) return { error: error.message }
    if (!provider) return { error: 'Proveedor no encontrado' }

    revalidatePath('/dashboard/providers')
    redirect('/dashboard/providers')
}

export async function deactivateProvider(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data, error } = await supabase
        .from('providers')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { error: 'Proveedor no encontrado' }

    revalidatePath('/dashboard/providers')
    return { error: null }
}
