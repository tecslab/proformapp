'use server'

// Note: This file contains server actions but we need to fetch data from client components often.
// However, the actions must be marked 'use server' at the top of the function or file.
// I will separate the concerns. This file will be 'use server'.

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

export async function createProforma(data: ProformaFormData) {
    'use server'
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

    // 3. Get Next Number (Double check or rely on DB function inside transaction? 
    // Ideally we lock, but Supabase HTTP API doesn't do complex transactions easily without RPC.
    // Optimistic approach: Get number, insert. If conflict (unique constraint), retry.
    // For now, we will trust getNextProformaNumber coupled with the sequence table logic.

    // We'll assume get_next_proforma_number handles the incrementing of the sequence table safely.
    // However, calling it separately from insert leaves a gap.
    // A better approach would be an RPC 'create_proforma' that does it all.
    // But per instructions, we'll try to do it in the action with the tools we have.

    // Let's call the function to get the number.
    const { data: nextNumber, error: seqError } = await supabase.rpc('get_next_proforma_number', {
        p_user_id: user.id
    })

    if (seqError || nextNumber === null) {
        return { error: 'Failed to generate proforma number' }
    }

    // 4. Calculate Totals (Server-side trust)
    const { items, iva_percentage, ...headerData } = data

    let subtotal = 0
    const calculatedItems = items.map(item => {
        // Business Logic:
        // earned_value = unit_cost * (percentage_gain / 100)
        // unit_price = unit_cost + earned_value
        // item_total = unit_price * quantity

        const earned_value = item.unit_cost * (item.percentage_gain / 100)
        const unit_price = item.unit_cost + earned_value
        const line_total = unit_price * item.quantity

        subtotal += line_total

        return {
            ...item,
            line_total
        }
    })

    const iva_amount = subtotal * (iva_percentage / 100)
    const total = subtotal + iva_amount

    // 5. Insert Proforma
    const { data: proforma, error: insertError } = await supabase
        .from('proformas')
        .insert({
            ...headerData,
            proforma_number: nextNumber,
            user_id: user.id,
            status: 'draft', // Initial status
            subtotal,
            iva_percentage,
            iva_amount,
            total
        })
        .select()
        .single()

    if (insertError) {
        return { error: `Failed to create proforma: ${insertError.message}` }
    }

    // 6. Insert Items
    const itemsToInsert = calculatedItems.map(item => ({
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
        // Cleanup? If items fail, we have a proforma without items. 
        // Ideally we'd delete the proforma.
        await supabase.from('proformas').delete().eq('id', proforma.id)
        return { error: `Failed to create items: ${itemsError.message}` }
    }

    revalidatePath('/dashboard/proformas')
    redirect(`/dashboard/proformas`)
}
