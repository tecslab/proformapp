'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProjectFinancialSummary } from '@/lib/types/database'

export async function getProjectFinancialSummary(projectId: string) {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { data: null, error: 'No autorizado' }
    const { data, error } = await db.from('project_financial_summary').select('*')
        .eq('project_id', projectId).eq('user_id', user.id).maybeSingle()
    return { data, error: error?.message ?? (!data ? 'Resumen no disponible' : null) }
}

export async function getProjectDashboard() {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { data: [], error: 'No autorizado' }
    const summaries: ProjectFinancialSummary[] = []
    for (let start = 0; ; start += 500) {
        const { data, error } = await db.from('project_financial_summary').select('*')
            .eq('user_id', user.id).is('archived_at', null).order('project_id').range(start, start + 499)
        if (error) return { data: [], error: error.message }
        summaries.push(...data)
        if (data.length < 500) break
    }
    return { data: summaries, error: null }
}
