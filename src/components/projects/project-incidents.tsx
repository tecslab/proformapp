'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { IncidentRow } from '@/lib/types/database'
import { incidentSchema, responsibilities, responsibilityLabels, type IncidentInput } from '@/lib/validations/project-incident'
import { saveProjectIncident } from '@/lib/actions/project-incidents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const money = (value: number | null) => value === null ? 'Sin definir' : new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
const selectStyle = 'w-full rounded-md border p-2 bg-background'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block space-y-1 text-sm"><span>{label}</span>{children}</label>
}
export function ProjectIncidents({ projectId, incidents }: { projectId: string; incidents: IncidentRow[] }) {
    const [editor, setEditor] = useState<{ incident?: IncidentRow } | null>(null)
    const [filter, setFilter] = useState('all')
    const visible = incidents.filter(i => filter === 'all' || (filter === 'resolved' ? i.resolved : !i.resolved))
    return <section className="space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-semibold">Incidencias</h2><Button onClick={() => setEditor({})}>Registrar incidencia</Button></div>
        <p className="text-sm text-muted-foreground">Los costos de una incidencia son informativos. Registra sus compromisos y pagos en Ejecución y Cobros y pagos. Si corresponde cobrar al cliente, crea una proforma adicional, finalízala e impórtala al proyecto.</p>
        <Field label="Mostrar"><select className={selectStyle} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas</option><option value="open">Pendientes</option><option value="resolved">Resueltas</option></select></Field>
        {!visible.length && <p className="text-sm text-muted-foreground">No hay incidencias en esta selección.</p>}
        {visible.map(i => <Card key={i.id}><CardContent className="space-y-2">
            <div className="flex justify-between gap-3"><h3 className="font-semibold">{i.title}</h3><span>{i.resolved ? 'Resuelta' : 'Pendiente'}</span></div>
            <p className="text-sm text-muted-foreground">{i.incident_date} · {responsibilityLabels[i.responsibility as keyof typeof responsibilityLabels]}</p>
            {i.description && <p className="text-sm whitespace-pre-wrap">{i.description}</p>}
            <p className="text-sm">Costo estimado: {money(i.estimated_cost)} · Costo final: {money(i.final_cost)}</p>
            <p className="text-sm">Cobrable al cliente: {i.billable_to_client === null ? 'Por determinar' : i.billable_to_client ? 'Sí' : 'No'}</p>
            {i.resolution_notes && <p className="text-sm whitespace-pre-wrap">Resolución: {i.resolution_notes}</p>}
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditor({ incident: i })}>Editar / resolver</Button>
                {i.billable_to_client && <Button asChild><Link href={'/dashboard/proformas/new?incident=' + i.id}>Crear proforma adicional</Link></Button>}
            </div>
        </CardContent></Card>)}
        <Dialog open={editor !== null} onOpenChange={open => { if (!open) setEditor(null) }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editor?.incident ? 'Editar incidencia' : 'Registrar incidencia'}</DialogTitle><DialogDescription>Documenta el imprevisto, su responsabilidad y resolución.</DialogDescription></DialogHeader>
                {editor && <IncidentForm projectId={projectId} incident={editor.incident} onSaved={() => setEditor(null)} />}
            </DialogContent>
        </Dialog>
    </section>
}

function IncidentForm({ projectId, incident, onSaved }: { projectId: string; incident?: IncidentRow; onSaved: () => void }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const form = useForm<IncidentInput>({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            project_id: projectId, title: incident?.title ?? '', description: incident?.description ?? '',
            incident_date: incident?.incident_date ?? today,
            responsibility: (incident?.responsibility ?? 'under_review') as IncidentInput['responsibility'],
            estimated_cost: incident?.estimated_cost?.toString() ?? '', final_cost: incident?.final_cost?.toString() ?? '',
            billable_to_client: incident?.billable_to_client == null ? 'unknown' : incident.billable_to_client ? 'yes' : 'no',
            resolved: incident?.resolved ?? false, resolution_notes: incident?.resolution_notes ?? '',
        },
    })
    async function submit(values: IncidentInput) {
        setError(null)
        try {
            const result = await saveProjectIncident(values, incident?.id)
            if (result.error) { setError(result.error); return }
            onSaved(); router.refresh()
        } catch { setError('No se pudo guardar. Intenta nuevamente.') }
    }
    return <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <Field label="Título"><Input {...form.register('title')} /></Field>
        <Field label="Fecha de incidencia"><Input type="date" {...form.register('incident_date')} /></Field>
        <Field label="Descripción"><Textarea {...form.register('description')} /></Field>
        <Field label="Responsabilidad"><select className={selectStyle} {...form.register('responsibility')}>{responsibilities.map(r => <option key={r} value={r}>{responsibilityLabels[r]}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Costo estimado"><Input inputMode="decimal" placeholder="Sin definir" {...form.register('estimated_cost')} /></Field><Field label="Costo final"><Input inputMode="decimal" placeholder="Sin definir" {...form.register('final_cost')} /></Field></div>
        <Field label="Cobrable al cliente"><select className={selectStyle} {...form.register('billable_to_client')}><option value="unknown">Por determinar</option><option value="yes">Sí</option><option value="no">No</option></select></Field>
        <label className="flex gap-2 items-center"><input type="checkbox" {...form.register('resolved')} />Resuelta</label>
        <Field label="Notas de resolución"><Textarea {...form.register('resolution_notes')} /></Field>
        {Object.entries(form.formState.errors).map(([key, value]) => <p key={key} role="alert" className="text-sm text-destructive">{value.message}</p>)}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Guardando…' : 'Guardar incidencia'}</Button>
    </form>
}
