'use server'

import { createClient } from '@/lib/supabase/server'
import { proformaSchema, type ProformaFormData } from '@/lib/validations/proforma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getNextProformaNumber() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Read-only peek at the sequence table
    const { data, error } = await supabase
        .from('proforma_sequence')
        .select('last_number')
        .eq('user_id', user.id)
        .single()

    if (error) {
        // If no sequence exists yet, default to 1
        if (error.code === 'PGRST116') return 1

        console.error('Error getting next number:', error)
        return null
    }

    return (data.last_number || 0) + 1
}

export async function getProformas(query: string = '', page: number = 1, pageSize: number = 10) {
    const supabase = await createClient()

    // Calculate pagination
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let dbQuery = supabase
        .from('proformas')
        .select('*, clients(first_name, last_name, cedula_ruc)', { count: 'exact' })
        .order('proforma_number', { ascending: false })
        .range(start, end)

    if (query) {
        // Search by number (exact) or Client name (fuzzy)
        // Note: searching localized relationship data is tricky in simple Supabase queries without embedding.
        // We can search on proforma_number (casted to text) OR perform a client search first.
        // For simplicity V1: search exact proforma number OR let's try a join filter if possible, 
        // but Supabase/PostgREST 'or' across joined tables is hard.
        // Let's stick to Proforma Number or ID searches for now, and maybe Client RUC if stored on proforma (it's not).
        // Actually, we can filter by the client's fields if we use the right syntax: !inner join.

        const isNumber = !isNaN(Number(query))
        if (isNumber) {
            dbQuery = dbQuery.eq('proforma_number', query)
        } else {
            // Search by client name requires !inner to filter the parent rows based on child condition
            dbQuery = supabase
                .from('proformas')
                .select('*, clients!inner(first_name, last_name, cedula_ruc)', { count: 'exact' })
                .order('proforma_number', { ascending: false })
                .range(start, end)
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`, { referencedTable: 'clients' })
        }
    }

    const { data, count, error } = await dbQuery

    if (error) {
        console.error('Error fetching proformas:', error)
        return { data: [], count: 0, error: error.message }
    }

    return { data, count, error: null }
}

export async function getProforma(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('proformas')
        .select('*, items(*)')
        .eq('id', id)
        .single()

    if (error) {
        return { error: error.message }
    }

    // Sort items by inserted order usually? or add an index column? 
    // Default postgres return order isn't guaranteed. 
    // For now we assume they come back reasonably or sort by insertion if we had an auto-inc or created_at.
    // items have created_at usually.
    if (data.items) {
        data.items.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    return { data, error: null }
}

export async function createProforma(data: ProformaFormData) {
    const supabase = await createClient()

    // 1. Validate Data
    const validation = proformaSchema.safeParse(data)
    if (!validation.success) {
        return { error: 'Invalid data', details: validation.error.flatten() }
    }

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 3. Get Next Number
    const { data: nextNumber, error: seqError } = await supabase.rpc('get_next_proforma_number', {
        p_user_id: user.id
    })

    if (seqError || nextNumber === null) {
        return { error: 'Failed to generate proforma number' }
    }

    // 4. Calculate Totals
    const { items, iva_percentage, ...headerData } = data
    const calculation = calculateProformaTotals(items, iva_percentage)

    // 5. Insert Proforma
    const { data: proforma, error: insertError } = await supabase
        .from('proformas')
        .insert({
            ...headerData,
            proforma_number: nextNumber,
            user_id: user.id,
            status: 'draft',
            subtotal: calculation.subtotal,
            iva_percentage,
            iva_amount: calculation.iva_amount,
            total: calculation.total
        })
        .select()
        .single()

    if (insertError) {
        return { error: `Failed to create proforma: ${insertError.message}` }
    }

    // 6. Insert Items
    const itemsToInsert = calculation.items.map(item => ({
        proforma_id: proforma.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        percentage_gain: item.percentage_gain,
        line_total: item.line_total
    }))

    const { error: itemsError } = await supabase
        .from('items')
        .insert(itemsToInsert)

    if (itemsError) {
        // Cleanup on failure
        await supabase.from('proformas').delete().eq('id', proforma.id)
        return { error: `Failed to create items: ${itemsError.message}` }
    }

    revalidatePath('/dashboard/proformas')
    redirect(`/dashboard/proformas`)
}

export async function updateProforma(id: string, data: ProformaFormData) {
    const supabase = await createClient()

    // 1. Validate
    const validation = proformaSchema.safeParse(data)
    if (!validation.success) {
        return { error: 'Invalid data' }
    }

    // 2. Check status (Guard)
    const { data: current } = await supabase.from('proformas').select('status').eq('id', id).single()
    if (current?.status !== 'draft') {
        return { error: 'Only draft proformas can be edited.' }
    }

    // 3. Calculate Totals
    const { items, iva_percentage, ...headerData } = data
    const calculation = calculateProformaTotals(items, iva_percentage)

    // 4. Update Header
    const { error: updateError } = await supabase
        .from('proformas')
        .update({
            ...headerData,
            subtotal: calculation.subtotal,
            iva_percentage,
            iva_amount: calculation.iva_amount,
            total: calculation.total,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (updateError) return { error: updateError.message }

    // 5. Replace Items (Simple V1 approach: Delete all + Insert all)
    // Deleting
    const { error: deleteError } = await supabase.from('items').delete().eq('proforma_id', id)
    if (deleteError) return { error: `Error clearing old items: ${deleteError.message}` }

    // Inserting
    const itemsToInsert = calculation.items.map(item => ({
        proforma_id: id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        percentage_gain: item.percentage_gain,
        line_total: item.line_total
    }))

    const { error: insertError } = await supabase.from('items').insert(itemsToInsert)
    if (insertError) return { error: `Error saving items: ${insertError.message}` }

    revalidatePath('/dashboard/proformas')
    revalidatePath(`/dashboard/proformas/${id}/edit`)
    redirect('/dashboard/proformas')
}

export async function finalizeProforma(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('proformas')
        .update({ status: 'finalized' })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/proformas')
}

export async function cloneProforma(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch Source
    const { data: source, error: fetchError } = await getProforma(id)
    if (fetchError || !source) return { error: 'Proforma not found' }

    const original = source

    // 2. Get Next Number
    const { data: nextNumber } = await supabase.rpc('get_next_proforma_number', { p_user_id: user.id })
    if (!nextNumber) return { error: 'Failed to generate number' }

    // 3. Insert Copy Header
    const { data: newProforma, error: copyError } = await supabase
        .from('proformas')
        .insert({
            client_id: original.client_id,
            user_id: user.id,
            proforma_number: nextNumber,
            date: new Date().toISOString(), // Current date
            status: 'draft',
            iva_percentage: original.iva_percentage,
            delivery_days: original.delivery_days,
            payment_methods: original.payment_methods,
            observations: original.observations,
            subtotal: original.subtotal,
            iva_amount: original.iva_amount,
            total: original.total
        })
        .select()
        .single()

    if (copyError) return { error: copyError.message }

    // 4. Copy Items
    if (original.items && original.items.length > 0) {
        const itemsToCopy = original.items.map((item: any) => ({
            proforma_id: newProforma.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_cost: item.unit_cost,
            percentage_gain: item.percentage_gain,
            line_total: item.line_total
        }))

        await supabase.from('items').insert(itemsToCopy)
    }

    revalidatePath('/dashboard/proformas')
    redirect(`/dashboard/proformas/${newProforma.id}/edit`)
}

// Helper for consistency
function calculateProformaTotals(items: any[], iva_percentage: number) {
    let subtotal = 0
    const calculatedItems = items.map((item: any) => {
        const earned_value = Number(item.unit_cost) * (Number(item.percentage_gain) / 100)
        const unit_price = Number(item.unit_cost) + earned_value
        const line_total = unit_price * Number(item.quantity)

        subtotal += line_total

        return {
            ...item,
            line_total // DB might ignore this if column dropped, or we use it
        }
    })

    const iva_amount = subtotal * (iva_percentage / 100)
    const total = subtotal + iva_amount

    return { items: calculatedItems, subtotal, iva_amount, total }
}
