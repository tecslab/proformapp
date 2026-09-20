'use server'

import { createClient } from '@/lib/supabase/server'
import { incidentSchema, type IncidentInput } from '@/lib/validations/project-incident'
import type { IncidentRow } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getProjectIncidents(projectId: string) {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { data: [], error: 'No autorizado' }
    const incidents: IncidentRow[] = []
    for (let start = 0; ; start += 500) {
        const { data, error } = await db.from('project_incidents').select('*').eq('project_id', projectId)
            .eq('user_id', user.id).order('incident_date', { ascending: false }).order('id').range(start, start + 499)
        if (error) return { data: [], error: error.message }
        incidents.push(...data)
        if (data.length < 500) break
    }
    return { data: incidents, error: null }
}

export async function saveProjectIncident(input: IncidentInput, id?: string) {
    const parsed = incidentSchema.safeParse(input)
    if (!parsed.success || (id !== undefined && !z.string().uuid().safeParse(id).success)) return { error: 'Datos de incidencia inválidos' }
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    const v = parsed.data
    const record = {
        ...v, user_id: user.id, description: v.description || null, resolution_notes: v.resolution_notes || null,
        estimated_cost: v.estimated_cost === '' ? null : Number(v.estimated_cost),
        final_cost: v.final_cost === '' ? null : Number(v.final_cost),
        billable_to_client: v.billable_to_client === 'unknown' ? null : v.billable_to_client === 'yes',
    }
    const query = id
        ? db.from('project_incidents').update(record).eq('id', id).eq('project_id', v.project_id).eq('user_id', user.id)
        : db.from('project_incidents').insert(record)
    const { data, error } = await query.select('id').maybeSingle()
    if (error || !data) return { error: 'No se pudo guardar la incidencia. Verifica que el proyecto esté activo.' }
    revalidatePath('/dashboard/projects/' + v.project_id)
    return { error: null }
}

export async function getIncidentProformaContext(id: string) {
    if (!z.string().uuid().safeParse(id).success) return null
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return null
    const { data: incident } = await db.from('project_incidents').select('*')
        .eq('id', id).eq('user_id', user.id).eq('billable_to_client', true).maybeSingle()
    if (!incident) return null
    const { data: project } = await db.from('projects').select('id, name, client_id')
        .eq('id', incident.project_id).eq('user_id', user.id).is('archived_at', null).maybeSingle()
    if (!project) return null
    return { incident, project }
}
