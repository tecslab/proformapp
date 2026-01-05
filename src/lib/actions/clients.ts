'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { clientSchema, type ClientFormData } from '@/lib/validations/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getClients(query: string = '', page: number = 1, pageSize: number = 10) {
    const supabase = await createSupabaseClient()

    // Calculate pagination range
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let dbQuery = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (query) {
        dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,cedula_ruc.ilike.%${query}%`)
    }

    const { data, count, error } = await dbQuery

    if (error) {
        console.error('Error fetching clients:', error)
        return { data: [], count: 0, error: error.message }
    }

    return { data, count, error: null }
}

export async function getClient(id: string) {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching client:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

export async function createClient(data: ClientFormData) {
    const supabase = await createSupabaseClient()

    // Server-side validation
    const validation = clientSchema.safeParse(data)
    if (!validation.success) {
        return { error: 'Invalid data' }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase.from('clients').insert({
        ...data,
        user_id: user.id
    })

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { error: 'A client with this Cedula/RUC already exists.' }
        }
        return { error: error.message }
    }

    revalidatePath('/dashboard/clients')
    redirect('/dashboard/clients')
}

export async function updateClient(id: string, data: ClientFormData) {
    const supabase = await createSupabaseClient()

    const validation = clientSchema.safeParse(data)
    if (!validation.success) {
        return { error: 'Invalid data' }
    }

    const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)

    if (error) {
        if (error.code === '23505') {
            return { error: 'A client with this Cedula/RUC already exists.' }
        }
        return { error: error.message }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${id}/edit`)
    redirect('/dashboard/clients')
}

export async function deleteClient(id: string) {
    const supabase = await createSupabaseClient()

    // Soft delete
    const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/clients')
}
