import { createClient } from "@/lib/supabase/server"
import { startOfMonth, endOfMonth, toDate } from "date-fns"

export async function getDashboardStats() {
    const supabase = await createClient()
    const now = new Date()
    const start = startOfMonth(now).toISOString()
    const end = endOfMonth(now).toISOString()

    // 1. Total Clients (Active)
    const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)

    if (clientsError) console.error('Error fetching client count:', clientsError)

    // 2. Proformas This Month
    const { count: proformasCount, error: proformasError } = await supabase
        .from('proformas')
        .select('*', { count: 'exact', head: true })
        .gte('date', start)
        .lte('date', end)

    if (proformasError) console.error('Error fetching proforma count:', proformasError)

    return {
        totalClients: clientsCount || 0,
        monthlyProformas: proformasCount || 0
    }
}
